// Tạo ảnh chia sẻ assets/og-image.png (1200×630) bằng trình duyệt Playwright.
// Chạy khi muốn đổi ảnh: npm run build && npm run og   (cần cài playwright: npx playwright install chromium)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { logoSvg, heroIllustration } from '../src/doodles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const index = await fs.readFile(path.join(ROOT, 'dist', 'index.html'), 'utf8');
const cssHref = index.match(/href="(\/assets\/site-[^"]+\.css)"/)[1];
let css = await fs.readFile(path.join(ROOT, 'dist', cssHref), 'utf8');
// nhúng font dạng base64 để trình duyệt chắc chắn nạp được
for (const m of [...css.matchAll(/url\((\/assets\/fonts\/[^)]+\.woff2)\)/g)]) {
  const b64 = (await fs.readFile(path.join(ROOT, 'dist', m[1]))).toString('base64');
  css = css.replace(m[0], `url(data:font/woff2;base64,${b64})`);
}

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${css}
body{width:1200px;height:630px;margin:0;overflow:hidden;background:#FAF6EE}
.og{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;align-items:center;height:100%;padding:56px 64px}
.og .logo-svg{height:120px;width:auto;margin-bottom:26px}
.og h1{font-size:84px;line-height:1.02;margin:12px 0 20px}
.og p{font:400 27px/1.3 'Patrick Hand';margin:0;white-space:nowrap}
.og .tag span{font-size:26px}
.og .hero-art{width:100%}
</style></head><body><div class="og"><div>${logoSvg()}<p class="tag"><span>KHOÁ HỌC</span></p>
<h1>Khoá học tìm cổ phiếu <mark class="hl">sóng thần</mark></h1>
<p>5 buổi online · Tối đa 5 người/lớp · Workshop miễn phí 1 năm</p></div><div>${heroIllustration()}</div></div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(async () => { await document.fonts.load("84px 'Patrick Hand'", 'ếẩ'); await document.fonts.ready; });
await p.screenshot({ path: path.join(ROOT, 'assets', 'og-image.png') });
await b.close();
console.log('› Đã tạo assets/og-image.png');
