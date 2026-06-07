import type { APIRoute } from "astro";
import { saveOrderNormalized, setupOrdersTable, setupBlingTokensTable, setupMETokensTable } from "./turso";
import { createVenda } from "./bling-auth";
import { addToCart, checkout, generate } from "./melhor-envio-auth";
import { buscarBlingId } from "../../data/bling-produtos";
import { sendConfirmationEmail, sendInfluencerAlertEmail } from "./resend";

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
    const body = await request.json();
    const { orderId, orderData } = body;

    if (!orderId || !orderData) {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 });
    }

    await setupOrdersTable();
    await setupBlingTokensTable();
    await setupMETokensTable();

    const {
      nome, email, cpfCnpj, telefone,
      itens = [], total, endereco = {},
      freteSelecionado = null, condicaoPagamento, cupom,
      descontoValor = 0, descontoPercent = 0,
    } = orderData;

    const observacao = `PEDIDO INFLUENCER — Cupom: ${cupom}`;

    // Save order
    await saveOrderNormalized(orderId, {
      ...orderData,
      observacao,
      emailSent: 0,
      blingProcessed: 0,
      meProcessed: 0,
    });

    const addressStr = `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ""} — ${endereco.cidade}/${endereco.uf} — CEP ${endereco.cep}`;

    // 1. Email de confirmação para o influencer
    try {
      await sendConfirmationEmail({
        customerEmail: email,
        customerName: nome,
        orderId,
        items: itens.map((i: any) => ({ name: i.titulo, quantity: i.quantidade, price: i.preco, size: i.tamanhoSelecionado })),
        total: 0,
        address: addressStr,
        condicaoPagamento,
        observacao: "Pedido gratuito",
        descontoPercent: 100,
        descontoValor: total,
      });
      await saveOrderNormalized(orderId, { ...orderData, observacao, emailSent: 1, blingProcessed: 0, meProcessed: 0 });
    } catch (e) {
      console.error("[Influencer] Erro email confirmação:", e);
    }

    // 2. Bling
    let blingProcessed = 0;
    try {
      await createVenda({
        nome, email, cpfCnpj, telefone,
        itens: itens.map((i: any) => ({
          blingId: buscarBlingId(i.slug, i.corVarianteSelecionada, i.tamanhoSelecionado) ?? i.blingId ?? i.id,
          quantidade: i.quantidade,
          valor: i.preco,
        })),
        total: 0,
        endereco: {
          cep: endereco.cep, logradouro: endereco.logradouro, numero: endereco.numero,
          complemento: endereco.complemento, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf,
        },
        condicaoPagamento,
        observacao,
        descontoValor: total, // 100% de desconto = valor integral
        descontoPercent: 100,
        fretePreco: freteSelecionado?.price ?? 0,
      });
      blingProcessed = 1;
      await saveOrderNormalized(orderId, { ...orderData, observacao, emailSent: 1, blingProcessed: 1, meProcessed: 0 });
      console.log("[Influencer] Bling ok");
    } catch (e) {
      console.error("[Influencer] Erro Bling:", e);
    }

    // 3. Melhor Envio
    let meProcessed = 0;
    if (blingProcessed && freteSelecionado?.serviceId && endereco?.cep) {
      try {
        const insuranceValue = itens.reduce((s: number, i: any) => s + i.preco * i.quantidade, 0);
        const totalWeight = Math.max(itens.reduce((s: number, i: any) => s + (i.peso ?? 0.3) * i.quantidade, 0), 0.1);

        const cartItem = await addToCart({
          service: parseInt(freteSelecionado.serviceId),
          from: ME_FROM,
          to: {
            name: nome, email, phone: telefone.replace(/\D/g, ""),
            document: cpfCnpj.length <= 11 ? cpfCnpj : "",
            company_document: cpfCnpj.length === 14 ? cpfCnpj : "",
            state_register: "ISENTO",
            address: endereco.logradouro, number: endereco.numero,
            complement: endereco.complemento ?? "", district: endereco.bairro ?? "",
            city: endereco.cidade, state_abbr: endereco.uf, country_id: "BR",
            postal_code: endereco.cep.replace(/\D/g, ""),
          },
          products: itens.map((i: any) => ({ name: i.titulo, quantity: String(i.quantidade), unitary_value: String(i.preco) })),
          volumes: [{ height: 25, width: 25, length: 35, weight: totalWeight }],
          options: {
            insurance_value: insuranceValue, receipt: false, own_hand: false,
            reverse: false, non_commercial: true, platform: "Zaylo Shop",
            tags: [{ tag: orderId }, { tag: "INFLUENCER" }],
          },
        });

        const meOrderId = cartItem?.id;
        if (meOrderId) {
          await checkout([meOrderId]);
          await generate([meOrderId]);
          meProcessed = 1;
          await saveOrderNormalized(orderId, { ...orderData, observacao, emailSent: 1, blingProcessed: 1, meProcessed: 1 });
          console.log("[Influencer] ME ok:", meOrderId);
        }
      } catch (e) {
        console.error("[Influencer] Erro ME:", e);
      }
    }

    // 4. Alerta para a empresa
    try {
      await sendInfluencerAlertEmail({
        customerName: nome,
        customerEmail: email,
        orderId,
        couponCode: cupom,
        items: itens.map((i: any) => ({ name: i.titulo, quantity: i.quantidade, price: i.preco, size: i.tamanhoSelecionado })),
        address: addressStr,
      });
    } catch (e) {
      console.error("[Influencer] Erro email alerta:", e);
    }

    return new Response(JSON.stringify({ ok: true, orderId, blingProcessed, meProcessed }), { status: 200 });
  } catch (error: any) {
    console.error("[Influencer] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
