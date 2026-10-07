# Deploying Folio (Cloudflare Workers)

Folio runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare).
There are three environments. Each one has its **own Supabase project**, so testing never touches real users or real money.

| | Local | Staging | Production |
|---|---|---|---|
| Where | `npm run dev` (localhost:3000) | Worker `folio-staging` | Worker `folio` |
| Git branch | any | `staging` | `main` |
| Supabase project | staging (or your own) | **Folio Staging** | **Folio** (real users) |
| Payments | simulated | simulated (`PAYMENTS_MODE=simulated`) | PayPal live (`PAYMENTS_MODE=paypal`) |
| Banner | none | yellow "Staging" bar | none |

How a change ships: work on a branch → merge into `staging` → test on the staging URL → merge `staging` into `main` → production.

## Plan requirement
The built Worker is about **4.4 MiB compressed**. The Workers Free plan allows 3 MiB, so the account needs **Workers Paid** ($5/month, limit 10 MiB).

## 1. Supabase: one project per environment
1. Create a second Supabase project, e.g. **Folio Staging**, in the same region as production.
2. Run every file in `supabase/migrations/` on it, in order, in the SQL Editor (the same ones production has had).
   From now on, **every new migration runs on staging first, then production.**
3. In each project, **Authentication → URL Configuration**:
   - Site URL: that environment's address (e.g. `https://folio-staging.<account>.workers.dev`, `https://folio.app`).
   - Redirect URLs: `<that address>/auth/callback` and `<that address>/auth/confirm`.
4. Copy the templates and settings production uses (email templates, LinkedIn/GitHub providers, storage buckets come from the migrations).

## 2. Cloudflare: one Worker per environment
Both Workers build from this repository with **Workers Builds** (Cloudflare dashboard → Workers & Pages → the Worker → Settings → Build).

| Setting | `folio` (production) | `folio-staging` |
|---|---|---|
| Branch | `main` | `staging` |
| Build command | `npm run build` is NOT needed; leave empty | leave empty |
| Deploy command | `npm run deploy` | `npm run deploy:staging` |

Turn off "non-production branch builds" on `folio` so feature branches don't try to deploy to production.

### Variables
`NEXT_PUBLIC_*` values are baked into the build, so they go in **Settings → Build → Variables and secrets** (build time).
Everything else is read when the site runs, so it goes in **Settings → Variables and secrets** (runtime), or via `npx wrangler secret put NAME [--env staging]`.

| Name | Where | Production | Staging |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build | Folio project URL | Folio Staging URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build | Folio anon key | Folio Staging anon key |
| `NEXT_PUBLIC_SITE_URL` | build | `https://folio.app` (your domain) | staging address |
| `NEXT_PUBLIC_APP_ENV` | build | (empty) | `staging` |
| `NEXT_PUBLIC_SKIP_EMAIL_CONFIRMATION` | build | (empty, never on) | optional `true` for quick testing |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime secret | Folio service key | Folio Staging service key |
| `GEMINI_API_KEY` | runtime secret | yes | yes (can be the same key) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | runtime secret | live keys | sandbox keys (only if `PAYMENTS_MODE=paypal`) |
| `PAYMENTS_MODE`, `PAYPAL_ENV` | `wrangler.jsonc` vars | `paypal`, `live` | `simulated`, `sandbox` |

Never put secrets in `wrangler.jsonc`, in chat, or in a commit.

## 3. Deploying by hand (optional)
Normally pushing to `staging` or `main` deploys automatically. To deploy from a laptop:
```bash
npx wrangler login
npm run deploy:staging   # or: npm run deploy  (production)
```
Careful: a local build also reads `.env.local`, so set the target environment's `NEXT_PUBLIC_*` values in your shell first,
or deploy through Workers Builds instead.

## 4. Testing the Worker locally
`npm run preview` builds the Cloudflare version and runs it on Cloudflare's runtime at localhost:8787.
Copy `.dev.vars.example` to `.dev.vars` first so it uses your `.env.local`.

## Notes
- `src/proxy.ts` (keeps sessions fresh) runs as Node.js middleware, which the adapter supports as **experimental**. It works in local tests; if it ever breaks after an upgrade, move it to an edge `middleware.ts`.
- Certificate PDFs load their fonts from `public/fonts/certificate/` over HTTP (Workers have no filesystem).
- Rollback: Cloudflare dashboard → the Worker → Deployments, or `npx wrangler rollback [--env staging]`.
