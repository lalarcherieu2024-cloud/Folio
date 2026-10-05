import { FEE_RATE } from "../data/shared";

// How payments run:
//   "paypal"    real money through PayPal (needs PAYMENTS_MODE=paypal and the PayPal keys)
//   "simulated" nothing real moves: paying and withdrawing just update the records, for development and demos
//   "off"       payments are unavailable
// Without PAYMENTS_MODE set, development simulates but production stays OFF, so a missing setting can never
// make a live site hand out free "paid" projects.
export type PaymentsMode = "paypal" | "simulated" | "off";

export function paymentsMode(): PaymentsMode {
  const m = process.env.PAYMENTS_MODE;
  if (m === "paypal") return process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "paypal" : "off";
  if (m === "simulated") return "simulated";
  if (m === "off") return "off";
  return process.env.NODE_ENV === "production" ? "off" : "simulated";
}

export const CURRENCY = "EUR";

/** What the student receives (the price), Folio's fee on top, and what the company pays, all in cents. */
export function splitPrice(priceEur: number) {
  const amountCents = Math.round(priceEur * 100);
  const feeCents = Math.round(amountCents * FEE_RATE);
  return { amountCents, feeCents, totalCents: amountCents + feeCents };
}

export const eurFromCents = (cents: number) => "€" + (cents / 100).toLocaleString("en-GB", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
