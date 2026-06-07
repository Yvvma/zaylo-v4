import type { APIRoute } from "astro";

const RESEND_TOKEN = import.meta.env.RESEND_TOKEN ?? "";
const COMPANY_EMAIL = "contato@zaylo.com.br";
const FROM_EMAIL = "contato@zaylo.com.br";
const SITE_URL = import.meta.env.SITE_URL ?? "https://zaylo.com.br";

async function sendEmail(to: string, subject: string, html: string, fromName?: string) {
  const from = fromName ? `${fromName} <${FROM_EMAIL}>` : FROM_EMAIL;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_TOKEN}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

const BASE_STYLE = `
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #000000; padding: 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .content h2 { font-size: 18px; color: #333; margin: 0 0 8px; }
    .content p { font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 16px; }
    table.items { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.items th { background-color: #f9f9f9; padding: 10px 12px; text-align: left; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; }
    table.items td { padding: 10px 12px; font-size: 14px; color: #333; border-bottom: 1px solid #f0f0f0; }
    table.items td.price { text-align: right; font-weight: 600; }
    table.items tr:last-child td { border-bottom: none; }
    .total-row td { padding: 12px; font-size: 16px; font-weight: bold; color: #000; border-top: 2px solid #000; }
    .total-row td:last-child { text-align: right; }
    .tracking-box { background-color: #f0f0f0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
    .tracking-box p { margin: 4px 0; }
    .tracking-code { font-size: 18px; font-weight: bold; color: #000; letter-spacing: 2px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
    .footer p { margin: 4px 0; }
  </style>
`;

function wrapHtml(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE_STYLE}</head><body><div class="container"><div class="header"><img src="${SITE_URL}/logos/zaylo-logo.png" alt="Zaylo" style="height:32px;width:auto;display:block;margin:0 auto"></div><div class="content">${body}</div><div class="footer"><p>Zaylo — Todos os direitos reservados</p></div></div></body></html>`;
}

export async function sendConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  total: number;
  address: string;
  condicaoPagamento?: string;
  observacao?: string;
  descontoPercent?: number;
  descontoValor?: number;
  fretePreco?: number;
}) {
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr><td>${i.name}${i.size ? `<br><span style="font-size:12px;color:#888">Tam: ${i.size}</span>` : ""}</td><td style="text-align:center">${i.quantity}</td><td class="price">R$ ${(i.price * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const pagamentoHtml = params.observacao
    ? `<p style="font-size:13px;color:#666;margin:0 0 4px"><strong>Pagamento:</strong> ${params.observacao}${params.condicaoPagamento && params.condicaoPagamento !== "1x" ? ` (${params.condicaoPagamento})` : ""}</p>`
    : "";

  const clientHtml = wrapHtml(`
    <h2>Olá, ${params.customerName}!</h2>
    <p>Seu pedido <strong>${params.orderId}</strong> foi confirmado e estamos preparando o envio.</p>

    ${pagamentoHtml}

    <table class="items">
      <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      ${params.descontoValor && params.descontoValor > 0 ? `<tr><td colspan="2" style="padding:8px 12px;font-size:13px;color:#e53e3e">Desconto${params.descontoPercent ? ` (${params.descontoPercent}%)` : ""}</td><td style="padding:8px 12px;font-size:13px;color:#e53e3e;text-align:right">- R$ ${params.descontoValor.toFixed(2)}</td></tr>` : ""}
      ${params.fretePreco ? `<tr><td colspan="2" style="padding:8px 12px;font-size:13px;color:#666">Frete</td><td style="padding:8px 12px;font-size:13px;color:#666;text-align:right">R$ ${params.fretePreco.toFixed(2)}</td></tr>` : ""}
      <tr class="total-row"><td colspan="2">Total</td><td>R$ ${params.total.toFixed(2)}</td></tr>
    </table>

    <p style="font-size:13px;color:#888"><strong>Endereço de entrega:</strong><br>${params.address}</p>
    <p style="font-size:13px;color:#888">Você receberá o código de rastreio assim que a etiqueta for postada.</p>
    <p style="margin-top:24px;font-size:13px;color:#888">Equipe Zaylo</p>
  `);

  const companyHtml = wrapHtml(`
    <h2>Nova venda</h2>
    <p><strong>Pedido:</strong> ${params.orderId}<br>
    <strong>Cliente:</strong> ${params.customerName} (${params.customerEmail})</p>
    <p><strong>Endereço:</strong> ${params.address}</p>

    ${pagamentoHtml}

    <table class="items">
      <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      ${params.descontoValor && params.descontoValor > 0 ? `<tr><td colspan="2" style="padding:8px 12px;font-size:13px;color:#e53e3e">Desconto${params.descontoPercent ? ` (${params.descontoPercent}%)` : ""}</td><td style="padding:8px 12px;font-size:13px;color:#e53e3e;text-align:right">- R$ ${params.descontoValor.toFixed(2)}</td></tr>` : ""}
      ${params.fretePreco ? `<tr><td colspan="2" style="padding:8px 12px;font-size:13px;color:#666">Frete</td><td style="padding:8px 12px;font-size:13px;color:#666;text-align:right">R$ ${params.fretePreco.toFixed(2)}</td></tr>` : ""}
      <tr class="total-row"><td colspan="2">Total</td><td>R$ ${params.total.toFixed(2)}</td></tr>
    </table>

    <p style="font-size:13px;color:#888;font-style:italic">Aguardando postagem para gerar código de rastreio.</p>
  `);

  await Promise.all([
    sendEmail(params.customerEmail, `Pedido ${params.orderId} confirmado | ZAYLO`, clientHtml, "Zaylo"),
    sendEmail(COMPANY_EMAIL, `Nova venda — Pedido ${params.orderId} | ZAYLO`, companyHtml, `Pedido ${params.orderId} | Zaylo`),
  ]);
}

export async function sendInfluencerAlertEmail(params: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  couponCode: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  address: string;
}) {
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr><td>${i.name}${i.size ? `<br><span style="font-size:12px;color:#888">Tam: ${i.size}</span>` : ""}</td><td style="text-align:center">${i.quantity}</td><td class="price">R$ ${(i.price * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const html = wrapHtml(`
    <h2 style="color:#b45309">🌟 Pedido de Influencer</h2>
    <p><strong>Cupom utilizado:</strong> <span style="background:#fef3c7;padding:2px 8px;border-radius:4px;font-weight:bold">${params.couponCode}</span></p>
    <p><strong>Pedido:</strong> ${params.orderId}<br>
    <strong>Influencer:</strong> ${params.customerName} (${params.customerEmail})</p>
    <p><strong>Endereço:</strong> ${params.address}</p>
    <table class="items">
      <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="font-size:13px;color:#888;font-style:italic">Pedido gratuito — processado automaticamente no Bling e Melhor Envio.</p>
  `);

  await sendEmail(COMPANY_EMAIL, `🌟 Influencer — Pedido ${params.orderId} | ZAYLO`, html, "Zaylo");
}

export async function sendAlertEmail(orderId: string, customerEmail: string, customerName: string) {
  const html = wrapHtml(`
    <h2>Falha no envio de e-mail</h2>
    <p><strong>Pedido:</strong> ${orderId}<br>
    <strong>Cliente:</strong> ${customerName} (${customerEmail})</p>
    <p>O e-mail de confirmação não foi entregue para o cliente.</p>
    <p style="font-size:13px;color:#888;font-style:italic">Tente reenviar manualmente ou verifique o status do e-mail no painel da Resend.</p>
  `);
  await sendEmail(COMPANY_EMAIL, `Falha no e-mail — Pedido ${orderId} | ZAYLO`, html, `Pedido ${orderId} | Zaylo`);
}

export async function sendTrackingEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  trackingCode: string;
}) {
  const clientHtml = wrapHtml(`
    <h2>Olá, ${params.customerName}!</h2>
    <p>Seu pedido <strong>${params.orderId}</strong> foi postado e está a caminho!</p>

    <div class="tracking-box">
      <p style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Código de rastreio</p>
      <p class="tracking-code">${params.trackingCode}</p>
    </div>

    <p style="margin-top:24px;font-size:13px;color:#888">Equipe Zaylo</p>
  `);

  const companyHtml = wrapHtml(`
    <h2>Etiqueta postada</h2>
    <p><strong>Pedido:</strong> ${params.orderId}<br>
    <strong>Cliente:</strong> ${params.customerName} (${params.customerEmail})</p>

    <div class="tracking-box">
      <p style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Código de rastreio</p>
      <p class="tracking-code">${params.trackingCode}</p>
    </div>
  `);

  await Promise.all([
    sendEmail(params.customerEmail, `Pedido ${params.orderId} — código de rastreio | ZAYLO`, clientHtml, "Zaylo"),
    sendEmail(COMPANY_EMAIL, `Etiqueta postada — Pedido ${params.orderId} | ZAYLO`, companyHtml, `Pedido ${params.orderId} | Zaylo`),
  ]);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (body.type === "tracking") {
      await sendTrackingEmail(body);
    } else {
      await sendConfirmationEmail(body);
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: any) {
    console.error("Resend error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
