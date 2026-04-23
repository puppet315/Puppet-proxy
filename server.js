const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { Readable } = require('stream');

const app = express();
const PORT = Number(process.env.PORT || 8080);

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function encodeBase64Url(input) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function decodeTarget(raw) {
  const candidates = [() => decodeURIComponent(raw), () => decodeBase64Url(raw), () => raw];
  for (const attempt of candidates) {
    try {
      const parsed = new URL(attempt());
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed;
    } catch (_) {}
  }
  return null;
}

function getForwardHeaders(req, targetUrl) {
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    const lowered = name.toLowerCase();
    if (!value || HOP_BY_HOP_HEADERS.has(lowered) || lowered === 'host' || lowered === 'content-length') {
      continue;
    }
    headers[name] = value;
  }
  headers.host = targetUrl.host;
  return headers;
}

function injectProxyHelpers(html, targetUrl) {
  const baseTag = `<base href="${targetUrl.origin}">`;
  const bootTag = '<script src="/proxy-client.js"></script>';
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}${bootTag}`);
  }
  return `${baseTag}${bootTag}${html}`;
}

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => res.redirect('/puppet315.html'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/service/:encoded', async (req, res) => {
  const targetUrl = decodeTarget(req.params.encoded);
  if (!targetUrl) {
    return res.status(400).json({ error: 'Unable to decode destination URL.' });
  }

  const init = {
    method: req.method,
    headers: getForwardHeaders(req, targetUrl),
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = req;
    init.duplex = 'half';
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const contentType = upstream.headers.get('content-type') || '';

    for (const [name, value] of upstream.headers.entries()) {
      const lowered = name.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lowered)) continue;
      if (['content-security-policy', 'x-frame-options', 'frame-options', 'content-length'].includes(lowered)) continue;
      res.setHeader(name, value);
    }

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) {
        const absolute = new URL(location, targetUrl).toString();
        res.setHeader('location', `/service/${encodeBase64Url(absolute)}`);
      }
    }

    res.status(upstream.status);

    if (contentType.includes('text/html')) {
      const html = await upstream.text();
      return res.send(injectProxyHelpers(html, targetUrl));
    }

    if (!upstream.body) return res.end();
    return Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach upstream URL.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`puppet315 proxy server listening at http://localhost:${PORT}`);
});
