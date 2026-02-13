/**
 * Vercel serverless proxy for HLS (m3u8 + segments).
 * Avoids CORS issues when the player runs on Vercel but the stream is on another origin (e.g. ttvnw.net).
 * GET /api/proxy?url=<encoded-full-url>
 */

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).end();
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(400).json({ error: 'Missing url query parameter' });
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
