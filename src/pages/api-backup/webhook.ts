import type { APIRoute } from "astro";
import { sendConfirmationEmail, sendAlertEmail, sendTrackingEmail } from "./resend";
import { getOrderNormalized, saveOrderNormalized, setupOrdersTable } from "./turso";
import { searchOrder, tracking } from "./melhor-envio-auth";
import { createVenda } from "./bling-auth";
import { buscarBlingId } from "../../data/bling-produtos";
import { setupMETokensTable, setupBlingTokensTable } from "./turso";

const ASAAS_WEBHOOK_SECRET = import.meta.env.ASAAS_WEBHOOK_SECRET ?? "";

export const POST: APIRoute = async ({ request }) => {
  try {
    const asaasToken = request.headers.get("asaas-access-token");
    if (!asaasToken || asaasToken !== ASAAS_WEBHOOK_SECRET) {
      console.warn("[Webhook] Unauthorized — invalid token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const event = await request.json();
    console.log("[Webhook] Event:", event.event, "| Payment:", event.payment?.id);

    if (event.event !== "PAYMENT_RECEIVED") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const payment = event.payment;
    if (!payment?.id) {
      return new Response(JSON.stringify({ error: "No payment data" }), { status: 400 });
    }

    await setupMETokensTable().catch(() => console.warn("[ME] Falha ao criar tabela"));
    await setupBlingTokensTable().catch(() => console.warn("[Bling] Falha ao criar tabela"));
    await setupOrdersTable().catch(() => console.warn("[Orders] Falha ao criar tabela"));

    const orderId = payment.externalReference ?? `ZY${payment.id}`;
    console.log("[Webhook] orderId:", orderId, "| payment.id:", payment.id);

    const orderMeta = await getOrderNormalized(orderId);
    if (!orderMeta) {
      console.warn("[Webhook] Pedido não encontrado no Turso:", orderId);
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const emailSent = !!orderMeta.emailSent;
    const blingProcessed = !!orderMeta.blingProcessed;
    const meProcessed = !!orderMeta.meProcessed;
    const paymentIdSaved = orderMeta.paymentId ?? null;

    const {
      nome = "Cliente",
      email = "",
      cpfCnpj = "",
      telefone = "",
      itens = [],
      total = payment.value,
      endereco = {},
      freteSelecionado = null,
      observacao = "",
      condicaoPagamento = "",
      descontoPercent = 0,
      descontoValor = 0,
    } = orderMeta;

    // Save payment.id for deduplication
    if (!paymentIdSaved) {
      const latest = await getOrderNormalized(orderId) ?? orderMeta;
      await saveOrderNormalized(orderId, { ...latest, paymentId: payment.id });
    }

    // If order already fully processed, skip everything immediately
    if (blingProcessed && meProcessed) {
      console.log("[Webhook] Pedido já processado — ignorando requisição");
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true }), { status: 200 });
    }

    let isBlingProcessed = blingProcessed;

    // ─── 1. Confirmation email ──────────────────────────────────────────────
    if (!emailSent && email) {
      try {
        await sendConfirmationEmail({
          customerEmail: email,
          customerName: nome,
          orderId,
          items: itens.map((i: any) => ({
            name: i.titulo,
            quantity: i.quantidade,
            price: i.preco,
            size: i.tamanhoSelecionado,
          })),
          total,
          address: `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ""} — ${endereco.cidade}/${endereco.uf} — CEP ${endereco.cep}`,
          condicaoPagamento,
          observacao,
          descontoPercent,
          descontoValor,
          fretePreco: freteSelecionado?.price ?? 0,
        });
        console.log("[Resend] Confirmation email sent to:", email);

        const latest = await getOrderNormalized(orderId) ?? orderMeta;
        await saveOrderNormalized(orderId, { ...latest, emailSent: 1 });
      } catch (e) {
        console.error("[Resend] Erro ao enviar email de confirmação:", e);
        try {
          await sendAlertEmail(orderId, email, nome);
          console.log("[Resend] Alerta de falha enviado para empresa");
        } catch (e2) {
          console.error("[Resend] Erro ao enviar alerta para empresa:", e2);
        }
      }
    } else {
      console.log("[Webhook] Email já enviado ou sem email — pulando");
    }

    // ─── 2. Bling — contato + venda ─────────────────────────────────────────
    if (!blingProcessed && cpfCnpj && itens.length > 0) {
      if (!endereco?.logradouro || !endereco?.numero) {
        console.warn("[Webhook] Endereço incompleto no pedido — pulando Bling:", orderId);
      } else {
        try {
          const result = await createVenda({
            nome,
            email,
            cpfCnpj,
            telefone,
            itens: itens.map((i: any) => ({
              blingId: buscarBlingId(i.slug, i.corVarianteSelecionada, i.tamanhoSelecionado) ?? i.blingId ?? i.produtoId ?? i.id,
              quantidade: i.quantidade,
              valor: i.preco,
            })),
            total,
            endereco: {
              cep: endereco.cep,
              logradouro: endereco.logradouro,
              numero: endereco.numero,
              complemento: endereco.complemento,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              uf: endereco.uf,
            },
            condicaoPagamento,
            observacao,
            descontoValor,
            descontoPercent,
            fretePreco: freteSelecionado?.price ?? 0,
          });

          const blingVendaId = result?.venda?.data?.id ?? null;
          const blingContatoId = result?.contatoId ?? null;
          console.log("[Bling] Venda criada:", blingVendaId ?? "ok", "| Contato:", blingContatoId);

          const latest = await getOrderNormalized(orderId) ?? orderMeta;
          await saveOrderNormalized(orderId, {
            ...latest,
            blingProcessed: 1,
          });

          isBlingProcessed = true;
          console.log("[Webhook] Bling processado e salvo no Turso");
        } catch (e) {
          console.error("[Bling] Erro ao criar venda:", e);
        }
      }
    } else {
      console.log("[Webhook] Bling já processado ou sem dados — pulando");
    }

    let meOrderId: string | null = null;

    // ─── 3. Melhor Envio — check existing label (não gerar duplicidade) ──
    if (!meProcessed && isBlingProcessed && freteSelecionado?.serviceId && endereco?.cep) {
      try {
        const searchResult = await searchOrder(orderId);
        const orders = Array.isArray(searchResult) ? searchResult : [];
        const meOrder = orders.find((o: any) => {
          const tags = o.tags ?? [];
          return tags.some((t: any) => t.tag === orderId);
        });

        if (meOrder) {
          meOrderId = meOrder.id;
          let trackingCode: string | null = meOrder.tracking ?? null;
          let shippingStatus: string | null = meOrder.status ?? null;

          try {
            const trackingResult = await tracking([meOrderId]);
            const trackingData = Array.isArray(trackingResult) ? trackingResult[0] : trackingResult;
            if (trackingData?.tracking) trackingCode = trackingData.tracking;
            if (trackingData?.status) shippingStatus = trackingData.status;
          } catch {
            // tracking call is optional — use data from search result
          }

          const latest = await getOrderNormalized(orderId) ?? orderMeta;
          await saveOrderNormalized(orderId, {
            ...latest,
            meOrderId,
            meProcessed: 1,
            trackingCode,
            shippingStatus,
            shippingUpdatedAt: Date.now(),
          });
          console.log("[Webhook] ME etiqueta encontrada — tracking:", trackingCode, "| status:", shippingStatus);

          if (trackingCode && email && !orderMeta.trackingEmailSent) {
            await sendTrackingEmail({
              customerEmail: email,
              customerName: nome,
              orderId,
              trackingCode,
              shippingStatus,
            });
            const latest2 = await getOrderNormalized(orderId) ?? orderMeta;
            await saveOrderNormalized(orderId, {
              ...latest2,
              trackingEmailSent: 1,
            });
            console.log("[Webhook] Tracking email enviado para:", email);
          }
        } else {
          console.log("[Webhook] Nenhuma etiqueta encontrada no Melhor Envio para:", orderId);
        }
      } catch (e) {
        console.error("[ME] Erro ao consultar etiqueta:", e);
      }
    } else {
      console.log("[Webhook] ME já processado ou Bling pendente — pulando");
    }

    return new Response(
      JSON.stringify({ ok: true, orderId, meOrderId }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
