const http = require('http');
const https = require('https');

const PORT = 3001;
const ANTHROPIC_HOST = 'api.anthropic.com';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-beta');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const headers = {
      'Content-Type': 'application/json',
      'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
    };
    if (req.headers['x-api-key']) headers['x-api-key'] = req.headers['x-api-key'];
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const options = {
      hostname: ANTHROPIC_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers,
    };

    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy a correr → http://localhost:${PORT}`);
  console.log(`Reencaminha para → https://${ANTHROPIC_HOST}`);
});
