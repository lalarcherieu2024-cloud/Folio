# Hosting Folio on Cloudflare Workers (proposal)

This branch (`cloudflare-deploy`) gets Folio ready to run on Cloudflare Workers. **Nothing here changes how the app runs today.** `npm run dev` and `npm run build` are still plain Next.js; the Cloudflare build sits next to them under separate `*:vinext` scripts. If the team doesn't want it, don't merge the branch.

## Why vinext, not OpenNext

- Cloudflare now recommends **[vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)** for Next.js apps. It's Cloudflare's implementation of the Next.js APIs on Vite.
- The older adapter, **OpenNext**, doesn't support Node.js middleware ([docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)). In Next.js 16, `src/proxy.ts`, which keeps people signed in, always runs as Node.js middleware, so OpenNext isn't an option without reworking sign-in.
- `npx vinext check` reports Folio as **100% compatible**: every `next/*` import, server actions with the 11 MB upload limit, `proxy.ts`, and all 35 pages and 7 API routes.

## What changed on this branch

| File | Change |
|---|---|
| `package.json` | `dev:vinext`, `build:vinext`, `start:vinext`, `deploy:vinext` scripts; vinext, Vite and Wrangler packages; `"type": "module"` (the Next.js build and lint still pass) |
| `vite.config.ts`, `wrangler.jsonc` | The Vite build and the Worker config. The Worker is called `folio`, matching the existing Cloudflare project |
| `src/lib/certificate.ts` | The certificate PDF no longer reads its fonts from disk (Workers have no file system). The fonts are built into the code: `src/assets/fonts/embedded.ts`, regenerated with `node scripts/embed-fonts.mjs`. The PDF looks exactly the same |
| `next.config.ts` | Removed the font-tracing setting the old approach needed |

## Tested locally

- `npm run build:vinext` builds. The Worker is **1.55 MB compressed**; the free plan allows 3 MB, the paid plan 10 MB.
- Run in Cloudflare's own runtime (`npm run start:vinext`), these all work with live Supabase data:
  - the home page and `/projects`
  - project pages
  - sign-in and sign-up
  - the legal pages
  - the certificate route
- `next build`, `eslint` and `tsc` still pass.

**Not yet tested on a real Cloudflare deployment.** That needs someone with access to the Cloudflare account; see below.

## Try it locally

```bash
npm run build:vinext
npm run start:vinext   # http://localhost:8787, reads .env.local
```

## Deploying (needs Cloudflare account access)

1. **Secrets and variables.** In the Cloudflare dashboard, go to Workers → `folio` → Settings → Variables and secrets. Add the values from `.env.example`:

   | Type | Variables |
   |---|---|
   | Plain text | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `PAYMENTS_MODE`, `PAYPAL_ENV`, `GEMINI_MODEL` |
   | Secret | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |

   The `NEXT_PUBLIC_*` values are also needed **at build time**, so add them under Settings → Build → Variables too.
2. **Workers Builds.** The repo is already connected; it currently fails with "No access to the specified resource". Under Settings → Build, set:

   | Setting | Value |
   |---|---|
   | Build command | `npm run build:vinext` |
   | Deploy command | `npm run deploy:vinext` |
   | Production branch | `main` |

   Then check that the build token has access to the `folio` Worker. That missing access is what the current "No access" error is about.
3. **Supabase.** Under Authentication → URL Configuration, add the Workers URL (`https://folio.<account>.workers.dev`), or your custom domain, as the Site URL and as an allowed redirect URL `…/auth/callback`. Otherwise email confirmation and LinkedIn sign-in return to the wrong place.
4. **Custom domain** (optional): Workers → `folio` → Settings → Domains & Routes.

## Known caveats

- **vinext is young** (1.0). It's Cloudflare's recommended path, but expect occasional rough edges. The `next` build stays available as a fallback.
- During the build, most pages show as "?" (unclassified). That's harmless: like Next.js, they render on each request.
- No data cache or image optimisation is configured; Folio doesn't use either today. Both can be added later (`vinext init --help`).
