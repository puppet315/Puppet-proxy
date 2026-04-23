# Puppet-proxy (`puppet315`)

This repo now includes a **fully runnable local proxy app** with:

- A web page launcher at `public/puppet315.html`
- A Node.js proxy server at `server.js`
- A helper installer script to vendor the Scramjet repository (`scripts/setup-scramjet.sh`)

> Educational use only. Only test against resources you are authorized to access.

## Requirements

- Node.js 20+
- npm 10+
- Git

## Setup

```bash
npm install
npm run setup:scramjet
npm start
```

Then open:

- <http://localhost:8080/puppet315.html>

## How it works

1. The launcher page attempts to load Scramjet from:
   - `/scramjet/scramjet.client.js` (local vendored path)
   - jsDelivr fallback (`MercuryWorkshop/scramjet`)
2. URL submissions are encoded and sent to `/service/<encoded-url>`.
3. `server.js` fetches the upstream URL and streams it back.
4. HTML responses are injected with `public/proxy-client.js` so future link clicks/forms stay inside `/service/*`.

## Notes

- This is an educational proxy baseline and not a hardened production proxy.
- Some modern sites with strict anti-bot/CSP/runtime checks may still not work perfectly.
