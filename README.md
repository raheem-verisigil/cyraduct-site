# cyraduct.com

Marketing and protocol site for [Cyraduct](https://github.com/raheem-verisigil/cyraduct).

## Canonical architecture

This repository is intentionally **static-only**:

- `source/` is the only frontend source tree.
- The repository root (`index.html`, `assets/`, `CNAME`) is the built GitHub Pages output.
- There is no Express server, tRPC layer, OAuth flow, database, or application runtime in this repository.
- The protocol API is deployed separately from [the FastAPI repository](https://github.com/raheem-verisigil/cyraduct) at `https://api.cyraduct.com`.

The previous `client/`, `server/`, `drizzle/`, and shared Manus scaffold was removed because it was unused by the marketing page and had caused the website and API deployments to become conflated.

## Verification Lab

The page calls the FastAPI service directly from the browser to:

- check `/healthz`, `/v1/public-key`, `/v1/conformance/fixtures`, and `/openapi.json`
- run the live conformance suite (`POST /v1/conformance/run`)
- issue and verify a synthetic Finance Guard receipt
- run a deliberate action-binding mismatch test against `/v1/broker/execute`

The mismatch test uses `example.invalid`, an RFC 2606 reserved domain, and only reports success for the exact `action_binding_mismatch` refusal with `executed: false`. It never contacts a real sink.

## Rebuild

```bash
cd source
npm install
npm run build
cd ..
rm -rf assets
cp -R source/dist/assets assets
cp source/dist/index.html index.html
```

Keep `CNAME` and the root favicon/icon files in place.

## Deployments

- **Website:** GitHub Pages from the repository root, custom domain `cyraduct.com`.
- **API:** Railway FastAPI service, custom domain `api.cyraduct.com`.

The two domains must remain separate. A website deployment must never replace the API service.
