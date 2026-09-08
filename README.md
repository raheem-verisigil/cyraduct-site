# cyraduct.com

Marketing/protocol site for [Cyraduct](https://github.com/raheem-verisigil/cyraduct).

## What's here

The repo root (`index.html`, `assets/`, `CNAME`) is the **built, deployable static site**
— this is what GitHub Pages actually serves. `source/` contains the buildable React
project that produces it.

## Where this came from

The page content, copy, and design (`source/src/Home.tsx`, `source/src/index.css`) were
built as a full-stack scaffold via Manus and uploaded for deployment. The vast majority
of that scaffold (auth, OAuth, LLM calls, image generation, voice transcription, a MySQL
database, S3 storage) was unused platform boilerplate — Home.tsx never referenced any of
it, and the app's router (`server/routers.ts`) only wired up a no-op auth stub.

Since this is a static marketing page with no need for a server, database, or user
accounts, only the actual page component and its real dependencies (`react`,
`lucide-react`, Tailwind) were kept. Everything else — the Express/tRPC backend, Drizzle
ORM schema, Manus runtime plugins, session/cookie handling — was intentionally left out.
That keeps the deployed site to two static files with zero secrets, zero server, and zero
attack surface beyond serving HTML/JS/CSS.

## The "Verification Lab" section

This page calls the live Cyraduct API directly from the browser (`api.cyraduct.com`) to:
- check `/healthz`, `/v1/public-key`, `/v1/conformance/fixtures`, `/openapi.json` status
- run the live conformance suite (`POST /v1/conformance/run`)
- verify a receipt ID against `/v1/attested/verify/{id}`
- run a deliberate action-mismatch test against `/v1/broker/execute`, using
  `example.invalid` (an RFC 2606 reserved domain, guaranteed to never resolve) as the
  execution webhook — so the tamper test can never actually reach anything, real or not

None of this is faked or cached client-side; every result shown is a live round-trip to
the deployed API.

## Rebuilding from source

```bash
cd source
npm install
npm run build
```

Then copy `source/dist/index.html` and `source/dist/assets/` up to the repo root
(replacing what's there), keeping `CNAME` untouched, and commit.

## Deploy

GitHub Pages, serving from `main` branch root. Custom domain: `cyraduct.com` (see `CNAME`).
