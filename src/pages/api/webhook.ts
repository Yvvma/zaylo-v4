import type { APIRoute } from "astro";
import { sendConfirmationEmail, sendAlertEmail } from "./resend";
import { getOrderNormalized, saveOrderNormalized, setupOrdersTable } from "./turso";
import { addToCart, checkout, generate } from "./melhor-envio-auth";
import { createVenda } from "./bling-auth";
import { buscarBlingId } from "../../data/bling-produtos";
import { calculatePackageDimensions } from "../../data/products";
import { setupMETokensTable, setupBlingTokensTable } from "./turso";

const ASAAS_WEBHOOK_SECRET = import.meta.env.ASAAS_WEBHOOK_SECRET ?? "";
const ME_CNPJ = (import.meta.env.ME_FROM_CNPJ ?? "").replace(/\D/g, "");
const ME_FROM = {
  name: import.meta.env.ME_FROM_NAME ?? "Zaylo",
  email: import.meta.env.ME_FROM_EMAIL ?? "",
  phone: import.meta.env.ME_FROM_PHONE ?? "",
  document: "",
  company_document: ME_CNPJ,
  state_register: import.meta.env.ME_FROM_STATE_REGISTER ?? "ISENTO",
  address: import.meta.env.ME_FROM_ADDRESS ?? "",
  number: import.meta.env.ME_FROM_NUMBER ?? "",
  district: import.meta.env.ME_FROM_DISTRICT ?? "",
  city: import.meta.env.ME_FROM_CITY ?? "",
  state_abbr: import.meta.env.ME_FROM_STATE ?? "",
  country_id: "BR",
  postal_code: import.meta.env.ME_FROM_CEP?.replace(/\D/g, "") ?? "",
};

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
    const existingMeOrderId = null;

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

    // ─── 3. Melhor Envio label ─────────────────────────────────────────────
    let meOrderId: string | null = existingMeOrderId;
    if (!meProcessed && isBlingProcessed && freteSelecionado?.serviceId && endereco?.cep) {
      try {
        if (!meOrderId) {
          const insuranceValue = itens.reduce((s: number, i: any) => s + i.preco * i.quantidade, 0);
          const totalWeight = Math.max(
            itens.reduce((s: number, i: any) => s + (i.peso ?? 0.3) * i.quantidade, 0),
            0.1
          );
          const pkg = calculatePackageDimensions(itens.map((i: any) => ({
            slug: i.slug, selectedSize: i.tamanhoSelecionado, quantity: i.quantidade,
          })));

          const cartItem = await addToCart({
            service: parseInt(freteSelecionado.serviceId),
            from: ME_FROM,
            to: {
              name: nome,
              email: email,
              phone: telefone.replace(/\D/g, ""),
              document: cpfCnpj.length <= 11 ? cpfCnpj : "",
              company_document: cpfCnpj.length === 14 ? cpfCnpj : "",
              state_register: "ISENTO",
              address: endereco.logradouro,
              number: endereco.numero,
              complement: endereco.complemento ?? "",
              district: endereco.bairro ?? "",
              city: endereco.cidade,
              state_abbr: endereco.uf,
              country_id: "BR",
              postal_code: endereco.cep.replace(/\D/g, ""),
            },
            products: itens.map((i: any) => ({
              name: i.titulo,
              quantity: String(i.quantidade),
              unitary_value: String(i.preco),
            })),
            volumes: [{
              height: pkg.height,
              width: pkg.width,
              length: pkg.length,
              weight: totalWeight,
            }],
            options: {
              insurance_value: insuranceValue,
              receipt: false,
              own_hand: false,
              reverse: false,
              non_commercial: true,
              platform: "Zaylo Shop",
              tags: [{ tag: orderId }],
            },
          });

          meOrderId = cartItem?.id;
          console.log("[ME] Cart:", meOrderId);

          if (meOrderId) {
            const latest = await getOrderNormalized(orderId) ?? orderMeta;
            await saveOrderNormalized(orderId, { ...latest, meOrderId });
          }
        }

        if (meOrderId) {
          await checkout([meOrderId]);
          console.log("[ME] Checkout:", meOrderId);

          await generate([meOrderId]);
          console.log("[ME] Generated:", meOrderId);

          const latest = await getOrderNormalized(orderId) ?? orderMeta;
          await saveOrderNormalized(orderId, { ...latest, meOrderId, meProcessed: 1 });
          console.log("[Webhook] ME processado e salvo no Turso");
        }
      } catch (e) {
        console.error("[ME] Erro ao gerar etiqueta:", e);
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
