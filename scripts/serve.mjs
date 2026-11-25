// Máy chủ xem thử thư mục dist/ tại http://localhost:4321
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.mp4': 'video/mp4',
};

export function serve(port = Number(process.env.PORT) || 4321) {
  http
    .createServer((req, res) => {
      let p;
      try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (_) { return res.writeHead(400).end(); }
      let file = path.join(DIST, p.replace(/\0/g, ''));
      file = path.resolve(file);
      // chặn đọc file ngoài thư mục dist/ (vd /../dist-khac/…)
      if (file !== DIST && !file.startsWith(DIST + path.sep)) return res.writeHead(403).end();
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return fs.createReadStream(path.join(DIST, '404.html')).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    // chỉ mở trên máy mình (không lộ ra mạng LAN/wifi công cộng)
    .listen(port, '127.0.0.1', () => console.log(`› Xem thử tại http://localhost:${port}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) serve();
