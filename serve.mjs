import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Block dotfiles/dotfolders (.git, .github, .gitignore, etc.) at the path-segment level.
  const segments = urlPath.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) return notFound(res);

  const filePath = path.join(__dirname, urlPath);

  // Path traversal guard: resolved path must stay inside the project root.
  const root = path.resolve(__dirname) + path.sep;
  if (!path.resolve(filePath).startsWith(root)) return notFound(res);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext];
  // No known extension (.md, .docx, .log, extensionless git internals, etc.) → refuse to serve.
  if (!contentType) return notFound(res);

  fs.readFile(filePath, (err, data) => {
    if (err) return notFound(res);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
