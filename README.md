# Puppet-proxy (`puppet315`)

This repo includes a local educational proxy app with a **browser-like UI**:

- Multi-tab launcher (`public/puppet315.html` + `public/puppet315.js`)
- Node.js proxy server (`server.js`)
- Scramjet helper installer (`scripts/setup-scramjet.sh`)

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

## What was fixed

- The previous black-screen behavior was caused by encoding mismatch (Scramjet encoder output vs local server decoder).
- The launcher now always uses a consistent base64url encoding that the local `/service/<encoded>` route can decode.
- Response headers now strip frame-blocking headers (`X-Frame-Options`/`Frame-Options`) to allow rendering in the in-app iframe tabs.

## How it works

1. You open a URL in the address bar.
2. The UI routes each tab to `/service/<base64url(url)>`.
3. `server.js` fetches the upstream page, injects `proxy-client.js` into HTML, and streams the response.
4. `proxy-client.js` keeps link clicks and form submissions inside the proxy path.

## Notes

- This is an educational baseline and not a hardened production proxy.
- Some advanced sites may still block or degrade under proxying.
