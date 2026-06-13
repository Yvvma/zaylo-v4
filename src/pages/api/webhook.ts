import type { APIRoute } from "astro";
import { sendConfirmationEmail, sendAlertEmail } from "./resend";
import { getOrderNormalized, saveOrderNormalized, setupOrdersTable } from "./turso";
import { createVenda } from "./bling-auth";
import { buscarBlingId } from "../../data/bling-produtos";
import { getShippingSpecs, calculatePackageDimensions } from "../../data/products";
import { setupBlingTokensTable } from "./turso";

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
    if (blingProcessed) {
      console.log("[Webhook] Pedido já processado — ignorando requisição");
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true }), { status: 200 });
    }

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
          const itensComSpecs = itens.map((i: any) => {
            const specs = getShippingSpecs(i.slug, i.tamanhoSelecionado);
            return {
              ...i,
              specs,
            };
          });
          const pesoBruto = itensComSpecs.reduce((s: number, i: any) => s + i.specs.weight * i.quantidade, 0);
          const pkg = calculatePackageDimensions(itensComSpecs.map((i: any) => ({
            slug: i.slug, selectedSize: i.tamanhoSelecionado, quantity: i.quantidade,
          })));

          const result = await createVenda({
            nome,
            email,
            cpfCnpj,
            telefone,
            itens: itensComSpecs.map((i: any) => ({
              blingId: buscarBlingId(i.slug, i.corVarianteSelecionada, i.tamanhoSelecionado) ?? i.blingId ?? i.produtoId ?? i.id,
              quantidade: i.quantidade,
              valor: i.preco,
              peso: i.specs.weight,
              altura: i.specs.height,
              largura: i.specs.width,
              comprimento: i.specs.length,
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
            pesoBruto,
            quantidadeVolumes: 1,
            volumes: [{ peso: pesoBruto, altura: pkg.height, largura: pkg.width, comprimento: pkg.length }],
          });

          const blingVendaId = result?.venda?.data?.id ?? null;
          const blingContatoId = result?.contatoId ?? null;
          console.log("[Bling] Venda criada:", blingVendaId ?? "ok", "| Contato:", blingContatoId);

          const latest = await getOrderNormalized(orderId) ?? orderMeta;
          await saveOrderNormalized(orderId, {
            ...latest,
            blingProcessed: 1,
          });

          console.log("[Webhook] Bling processado e salvo no Turso");
        } catch (e) {
          console.error("[Bling] Erro ao criar venda:", e);
        }
      }
    } else {
      console.log("[Webhook] Bling já processado ou sem dados — pulando");
    }

    return new Response(
      JSON.stringify({ ok: true, orderId }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
