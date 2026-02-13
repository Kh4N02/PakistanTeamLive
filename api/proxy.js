/**
 * Vercel serverless proxy for HLS (m3u8 + segments).
 * Avoids CORS issues when the player runs on Vercel but the stream is on another origin (e.g. ttvnw.net).
 * GET /api/proxy?url=<encoded-url>  or  POST /api/proxy with JSON body { "url": "<url>" }
 * POST is used for very long URLs to avoid query string length limits.
 */

function getTargetUrl(req) {
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return null;
      }
    }
    return body && typeof body.url === 'string' ? body.url : null;
  }
  return req.query.url && typeof req.query.url === 'string' ? req.query.url : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const targetUrl = getTargetUrl(req);
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url (query param for GET or body.url for POST)' });
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': '*/*',
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(response.status).end();
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: 'Proxy fetch failed' });
  }
};
