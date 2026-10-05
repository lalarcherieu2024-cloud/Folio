import "server-only";
import { randomUUID } from "node:crypto";
import { CURRENCY } from "./config";

// Thin PayPal REST client: Orders v2 (company pays Folio) and Payouts (Folio pays the student).
// NOT yet exercised against a real PayPal account: test it in the sandbox (PAYPAL_ENV=sandbox) before going live.

const base = () => (process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");
const value = (cents: number) => (cents / 100).toFixed(2);

export class PayPalError extends Error {
  constructor(message: string, readonly detail?: unknown) { super(message); }
}

async function token(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${base()}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials", cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new PayPalError("Couldn't connect to PayPal.", json);
  return json.access_token;
}

async function call(path: string, init: { method: string; body?: unknown; requestId?: string }) {
  const res = await fetch(`${base()}${path}`, {
    method: init.method, cache: "no-store",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError(json?.message ?? json?.details?.[0]?.description ?? `PayPal said no (${res.status}).`, json);
  return json;
}

/** The company's checkout: an order for the full amount, paid into Folio's PayPal account. */
export async function createOrder(o: { escrowId: string; totalCents: number; description: string; returnUrl: string; cancelUrl: string }) {
  const order = await call("/v2/checkout/orders", {
    method: "POST", requestId: randomUUID(),
    body: {
      intent: "CAPTURE",
      purchase_units: [{ reference_id: o.escrowId, custom_id: o.escrowId, description: o.description.slice(0, 120), amount: { currency_code: CURRENCY, value: value(o.totalCents) } }],
      payment_source: { paypal: { experience_context: { brand_name: "Folio", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: o.returnUrl, cancel_url: o.cancelUrl } } },
    },
  });
  const approveUrl = (order.links ?? []).find((l: { rel: string }) => l.rel === "payer-action" || l.rel === "approve")?.href as string | undefined;
  if (!order.id || !approveUrl) throw new PayPalError("PayPal didn't return a checkout link.", order);
  return { orderId: order.id as string, approveUrl };
}

/** Takes the money after the company approved it. The caller must check amount, currency and escrow id. */
export async function captureOrder(orderId: string) {
  const r = await call(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", requestId: `capture-${orderId}` });
  const unit = r.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return {
    completed: r.status === "COMPLETED" && cap?.status === "COMPLETED",
    captureId: cap?.id as string | undefined,
    cents: cap ? Math.round(parseFloat(cap.amount.value) * 100) : 0,
    currency: cap?.amount?.currency_code as string | undefined,
    escrowId: (cap?.custom_id ?? unit?.custom_id) as string | undefined,
  };
}

/** Pays the student's PayPal account from Folio's balance. `withdrawalId` makes retries safe (PayPal rejects a repeated batch id). */
export async function createPayout(o: { withdrawalId: string; email: string; cents: number }) {
  const r = await call("/v1/payments/payouts", {
    method: "POST",
    body: {
      sender_batch_header: { sender_batch_id: o.withdrawalId, email_subject: "You've been paid on Folio", email_message: "Your verified project payment from Folio." },
      items: [{ recipient_type: "EMAIL", receiver: o.email, amount: { value: value(o.cents), currency: CURRENCY }, note: "Folio project payment", sender_item_id: o.withdrawalId }],
    },
  });
  return { batchId: r.batch_header?.payout_batch_id as string | undefined };
}

/** Gives a company its money back (the whole payment: price and fee) when it cancels a paid project nobody started. */
export async function refundCapture(o: { captureId: string; cents: number }) {
  const r = await call(`/v2/payments/captures/${encodeURIComponent(o.captureId)}/refund`, {
    method: "POST", requestId: `refund-${o.captureId}`,
    body: { amount: { value: value(o.cents), currency_code: CURRENCY }, note_to_payer: "Your Folio project was cancelled." },
  });
  if (r.status !== "COMPLETED" && r.status !== "PENDING") throw new PayPalError("PayPal didn't complete the refund.", r);
  return { refundId: r.id as string };
}
