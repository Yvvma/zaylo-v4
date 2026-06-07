import type { APIRoute } from "astro";
import { getMEToken } from "./melhor-envio-auth";

const ME_BASE = "https://melhorenvio.com.br/api/v2/me";
const USER_AGENT = "Zaylo Shop (contato@zaylo.com.br)";
const ME_ORIGIN_CEP = (import.meta.env.ME_FROM_CEP ?? "").replace(/\D/g, "");

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, from, to, products } = body;

    if (action !== "calculateShipment") {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
    }

    const token = await getMEToken();
    const res = await fetch(`${ME_BASE}/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: { postal_code: ME_ORIGIN_CEP },
        to,
        products,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[ME/calculate] status:", res.status, "| body:", JSON.stringify(data).slice(0, 2000));
    if (!res.ok) return new Response(JSON.stringify(data), { status: res.status });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Melhor Envio error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
