import type { APIRoute } from "astro";
import { saveOrder } from "./order-store";

const ASAAS_API_URL = import.meta.env.PUBLIC_ASAAS_API_URL ?? "https://api.asaas.com/v3";
const ASAAS_API_KEY = import.meta.env.ASAAS_API_KEY ?? "";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("API called, ASAAS_API_URL:", ASAAS_API_URL);
    console.log("ASAAS_API_KEY:", ASAAS_API_KEY ? "set" : "missing");

    const body = await request.json();
    const { action, ...data } = body;

    let endpoint = "";
    let method = "POST";
    let payload = data;

    switch (action) {
      case "saveOrder":
        await saveOrder(data.orderId, data.orderData);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      case "createCustomer":
        endpoint = `${ASAAS_API_URL}/customers`;
        break;
      case "createPayment":
        endpoint = `${ASAAS_API_URL}/payments`;
        break;
      case "createInstallment":
        endpoint = `${ASAAS_API_URL}/installments`;
        break;
      case "getPayment":
        endpoint = `${ASAAS_API_URL}/payments/${data.paymentId}`;
        method = "GET";
        payload = undefined;
        break;
      case "getPixQrCode":
        endpoint = `${ASAAS_API_URL}/payments/${data.paymentId}/pixQrCode`;
        method = "GET";
        payload = undefined;
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "zaylo",
      access_token: ASAAS_API_KEY,
    };

    const res = await fetch(endpoint, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(JSON.stringify(responseData), { status: res.status });
    }

    return new Response(JSON.stringify(responseData), { status: 200 });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};