import type { APIRoute } from "astro";
import { saveOrderNormalized, setupOrdersTable, setupBlingTokensTable } from "./turso";
import { createVenda } from "./bling-auth";
import { buscarBlingId } from "../../data/bling-produtos";
import { getShippingSpecs, calculatePackageDimensions } from "../../data/products";
import { sendConfirmationEmail, sendInfluencerAlertEmail } from "./resend";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orderId, orderData } = body;

    if (!orderId || !orderData) {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 });
    }

    await setupOrdersTable();
    await setupBlingTokensTable();

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
        descontoValor: descontoValor,
        fretePreco: freteSelecionado?.price ?? 0,
        customerOnly: true,
      });
      await saveOrderNormalized(orderId, { ...orderData, observacao, emailSent: 1, blingProcessed: 0 });
    } catch (e) {
      console.error("[Influencer] Erro email confirmação:", e);
    }

    // 2. Bling
    let blingProcessed = 0;
    try {
      const itensComSpecs = itens.map((i: any) => {
        const specs = getShippingSpecs(i.slug, i.tamanhoSelecionado);
        return { ...i, specs };
      });
      const pesoBruto = itensComSpecs.reduce((s: number, i: any) => s + i.specs.weight * i.quantidade, 0);
      const pkg = calculatePackageDimensions(itensComSpecs.map((i: any) => ({
        slug: i.slug, selectedSize: i.tamanhoSelecionado, quantity: i.quantidade,
      })));

      await createVenda({
        nome, email, cpfCnpj, telefone,
        itens: itensComSpecs.map((i: any) => ({
          blingId: buscarBlingId(i.slug, i.corVarianteSelecionada, i.tamanhoSelecionado) ?? i.blingId ?? i.id,
          quantidade: i.quantidade,
          valor: i.preco,
          peso: i.specs.weight,
          altura: i.specs.height,
          largura: i.specs.width,
          comprimento: i.specs.length,
        })),
        total: 0,
        endereco: {
          cep: endereco.cep, logradouro: endereco.logradouro, numero: endereco.numero,
          complemento: endereco.complemento, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf,
        },
        condicaoPagamento,
        observacao,
        descontoValor,
        descontoPercent: 100,
        fretePreco: freteSelecionado?.price ?? 0,
        pesoBruto,
        quantidadeVolumes: 1,
        volumes: [{ peso: pesoBruto, altura: pkg.height, largura: pkg.width, comprimento: pkg.length }],
      });
      blingProcessed = 1;
      await saveOrderNormalized(orderId, { ...orderData, observacao, emailSent: 1, blingProcessed: 1 });
      console.log("[Influencer] Bling ok");
    } catch (e) {
      console.error("[Influencer] Erro Bling:", e);
    }

    // 3. Alerta para a empresa
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

    return new Response(JSON.stringify({ ok: true, orderId, blingProcessed }), { status: 200 });
  } catch (error: any) {
    console.error("[Influencer] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
