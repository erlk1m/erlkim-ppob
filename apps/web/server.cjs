const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const distDir = path.join(__dirname, 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function resolveFile(reqUrl) {
  const cleanUrl = decodeURIComponent((reqUrl || '/').split('?')[0]);
  const requested = cleanUrl === '/' ? '/index.html' : cleanUrl;
  const filePath = path.normalize(path.join(distDir, requested));

  if (!filePath.startsWith(distDir)) return path.join(distDir, 'index.html');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  return path.join(distDir, 'index.html');
}

http.createServer((req, res) => {
  try {
    const filePath = resolveFile(req.url);
    const body = fs.readFileSync(filePath);
    send(res, 200, body, mime[path.extname(filePath)] || 'application/octet-stream');
  } catch (error) {
    send(res, 500, 'Internal Server Error');
  }
}).listen(port, host, () => {
  console.log(`ERLKIM PULSA web listening on http://${host}:${port}`);
});
