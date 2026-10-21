const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { questionsForNode } = require('./src/server/problems');
const { passedForUid, isValidUid } = require('./src/server/luogu');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const root = __dirname;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*'
  });
  res.end(JSON.stringify(body));
}

function resolveStaticPath(pathname) {
  let target;
  try {
    target = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch {
    return null;
  }
  const file = path.resolve(root, '.' + target);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  return file;
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/problems') {
    try {
      const problems = await questionsForNode(
        url.searchParams.get('node') || '',
        url.searchParams.get('category') || '',
        url.searchParams.get('level') || '进阶'
      );
      return sendJson(res, 200, { source: '洛谷', problems });
    } catch (error) {
      return sendJson(res, error.status || 502, { error: error.message });
    }
  }

  if (url.pathname === '/api/luogu/passed') {
    const uid = (url.searchParams.get('uid') || '').trim();
    if (!isValidUid(uid)) return sendJson(res, 400, { error: '请输入有效的洛谷用户 UID。' });
    try {
      return sendJson(res, 200, await passedForUid(uid));
    } catch (error) {
      return sendJson(res, error.status || 502, { error: error.message });
    }
  }

  return sendJson(res, 404, { error: 'API not found' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || host + ':' + port));

  if (url.pathname.startsWith('/api/')) {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
    return handleApi(req, res, url);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  const file = resolveStaticPath(url.pathname);
  if (!file) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.readFile(file, (error, contents) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const type = mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': path.basename(file) === 'index.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(contents);
  });
});

if (require.main === module) {
  server.listen(port, host, () => console.log('Algorithm map running at http://' + host + ':' + port));
}

module.exports = { server, resolveStaticPath, mimeTypes, questionsForNode, passedForUid };
