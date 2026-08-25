const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function getLanAddresses() {
  try {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const item of interfaces[name] || []) {
        const family = item.family;
        if ((family === 'IPv4' || family === 4) && !item.internal) {
          addresses.push(item.address);
        }
      }
    }
    return addresses;
  } catch (error) {
    return [];
  }
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, relative);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = safeResolve(req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    const target = !statErr && stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;

    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, HOST, () => {
  const lan = getLanAddresses();
  console.log(`Currency exchange app server running`);
  console.log(`  Local:   http://127.0.0.1:${PORT}/`);
  if (lan.length === 0) {
    console.log(`  Network: (no LAN IPv4 found)`);
  } else {
    for (const ip of lan) {
      console.log(`  iPad:    http://${ip}:${PORT}/`);
    }
  }
  console.log(`Open the iPad URL in Safari (same Wi‑Fi), then Add to Home Screen if needed.`);
});
