# Connecting PayPal to Folio

Folio takes the company's payment, holds it, and pays the student when the work is verified.
PayPal is used both ways: **Checkout** (company pays Folio) and **Payouts** (Folio pays the student).

> The PayPal calls in `src/lib/payments/paypal.ts` have not been run against a real PayPal account yet.
> Test everything in the **sandbox** first. Nothing real moves until `PAYPAL_ENV=live`.

## 1. Run the database migrations (once)
In the Supabase SQL Editor, in this order, after `0018`: `0019`, `0020`, `0021`, `0022`, `0023`.

## 2. Create Folio's PayPal account
1. Sign up for a **PayPal Business** account at paypal.com/business with Folio's company details and complete PayPal's verification. This account receives company payments and sends student payouts.

## 3. Create the app and get the keys (sandbox first)
1. Go to **developer.paypal.com** and log in with that business account.
2. **Apps & Credentials** → switch to **Sandbox** → **Create App** → name it `Folio` (type: Merchant).
3. Copy the **Client ID** and the **Secret**. Never paste them in chat, a commit, or a screenshot.
4. In the app's settings, make sure **Payouts** is ticked under features. (For live money, PayPal has to approve Payouts for your account: ask them under *Products & Services*.)

## 4. Create test accounts
**Testing Tools → Sandbox Accounts**: PayPal gives you a fake *Business* and a fake *Personal* account.
- The **Personal** account plays the company paying.
- Create a second Personal account for the student, and use ITS email as the student's payout email.

## 5. Put the keys in `.env.local`
```
PAYMENTS_MODE=paypal
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=<your sandbox client id>
PAYPAL_CLIENT_SECRET=<your sandbox secret>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev`. (Leave `PAYMENTS_MODE` empty to stay in *test mode*, where nothing real moves.)

## 6. Try the whole loop
1. **Company** posts a project → *Pay with PayPal* → log in with the sandbox Personal account → approve. The project goes live.
2. **Student** applies, the company accepts, the student submits their work.
3. **Company** approves and verifies. The money is released to the student's balance.
4. **Student** → *Payments* → type the sandbox student email under *Payout account* → *Save* → *Withdraw to PayPal*.
5. Check the student's sandbox account (sandbox.paypal.com) for the payout.

## 7. Going live
Create a **Live** app (same screen, Live tab), put its keys in the production environment with `PAYPAL_ENV=live` and
`NEXT_PUBLIC_SITE_URL=https://your-domain`, and never set `PAYMENTS_MODE=simulated` in production.

## Before real money: check this
Holding other people's money and paying it out later is regulated in Spain/the EU, and PayPal's rules for
marketplaces are strict about it. A marketplace-grade provider (PayPal Commerce Platform, Stripe Connect, Adyen for
Platforms) handles identity checks and licensing for you. Talk to PayPal and a lawyer before launching with real payments.
