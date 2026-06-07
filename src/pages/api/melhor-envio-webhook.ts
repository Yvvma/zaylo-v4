import type { APIRoute } from "astro";
import { sendTrackingEmail } from "./resend";
import { getOrder, saveOrder } from "./order-store";

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    console.log("[ME-Webhook] Event:", body.event, "| Payload:", JSON.stringify(body).slice(0, 1000));

    if (body.event === "webhook.ping") {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (body.event !== "order.updated") {
      console.log("[ME-Webhook] Skipping event:", body.event);
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const payload = body.data ?? body;
    const trackingCode = payload?.tracking;

    // Extract the order ID from the tag we set when creating the label
    const tags = payload?.tags ?? [];
    const tagObj = Array.isArray(tags) ? tags[0] : null;
    const orderId = tagObj?.tag ?? payload?.id;

    // Look up the order in Turso by the tag key — this is the only external dependency
    const orderMeta = (await getOrder(orderId)) ?? {};
    const email = orderMeta?.email;
    const nome = orderMeta?.nome;
    const trackingEmailSent = orderMeta?.trackingEmailSent ?? false;
    const shippingStatus = payload?.status ?? payload?.status_updated;

    // Always save the latest shipping status to Turso
    const statusUpdate: any = { shippingUpdatedAt: Date.now() };
    if (shippingStatus) statusUpdate.shippingStatus = shippingStatus;

    // If we have a tracking code and haven't sent the email yet, send it once
    if (trackingCode && !trackingEmailSent && email) {
      try {
        await sendTrackingEmail({
          customerEmail: email,
          customerName: nome ?? "Cliente",
          orderId,
          trackingCode,
          shippingStatus,
        });
        console.log("[ME-Webhook] Tracking email sent to:", email, "| code:", trackingCode);

        statusUpdate.trackingCode = trackingCode;
        statusUpdate.trackingEmailSent = true;
      } catch (e) {
        console.error("[ME-Webhook] Email error:", e);
        // Don't mark as sent if it failed — will retry on next webhook
        statusUpdate.trackingCode = trackingCode;
      }
    } else if (trackingCode && trackingEmailSent) {
      // Tracking already sent to customer — just save status, they manage tracking
      console.log("[ME-Webhook] Tracking já enviado para:", email, "— apenas atualizando status");
      statusUpdate.trackingCode = trackingCode;
    } else {
      console.log("[ME-Webhook] No tracking code yet, saving status only");
    }

    // Persist updates
    const latest = (await getOrder(orderId)) ?? orderMeta;
    await saveOrder(orderId, {
      ...latest,
      ...statusUpdate,
    });

    return new Response(
      JSON.stringify({ ok: true, orderId, trackingCode }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ME-Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};