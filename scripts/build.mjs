// Build website tĩnh vào thư mục dist/
//   npm run build        → build 1 lần
//   npm run dev          → build + tự build lại khi sửa file + chạy xem thử tại http://localhost:4321
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';
import sharp from 'sharp';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(ROOT, 'assets');
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'img');
const IMG_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

const log = (...a) => console.log('›', ...a);

// ---------------- Cấu hình ----------------
async function readConfig() {
  const raw = await fs.readFile(path.join(ROOT, 'config.jsonc'), 'utf8');
  const errors = [];
  const cfg = parseJsonc(raw, errors, { allowTrailingComma: true });
  if (errors.length) {
    const e = errors[0];
    const line = raw.slice(0, e.offset).split('\n').length;
    throw new Error(`config.jsonc lỗi ở dòng ${line}: ${printParseErrorCode(e.error)} (kiểm tra dấu phẩy / ngoặc kép)`);
  }
  const need = (o, k) => {
    if (o == null || o[k] == null) throw new Error(`config.jsonc thiếu mục "${k}"`);
  };
  ['site', 'khoaHoc', 'lienHe', 'form', 'videos', 'pixel', 'seo', 'hinhAnh'].forEach((k) => need(cfg, k));
  if (!Number.isFinite(+cfg.khoaHoc.hocPhi)) throw new Error('config.jsonc: "hocPhi" phải là số, ví dụ 10000000');
  return cfg;
}

function siteUrlFrom(cfg) {
  const u =
    cfg.site.url ||
    process.env.SITE_URL ||
    (process.env.CONTEXT === 'production' && process.env.URL) || // Netlify
    process.env.DEPLOY_PRIME_URL || // Netlify preview
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.CF_PAGES_URL ||
    '';
  return u.replace(/\/+$/, '');
}

// ---------------- Ảnh ----------------
const hashOf = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);

/** Nén 1 ảnh sang WebP (có cache để build lại nhanh). Trả về { file, w, h } */
async function toWebp(srcBuf, outDir, baseName, width, quality = 78) {
  const key = hashOf(Buffer.concat([srcBuf, Buffer.from(`${width}|${quality}`)]));
  const cached = path.join(CACHE, `${key}.webp`);
  let out;
  if (fss.existsSync(cached)) out = await fs.readFile(cached);
  else {
    out = await sharp(srcBuf, { animated: false })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    await fs.mkdir(CACHE, { recursive: true });
    await fs.writeFile(cached, out);
  }
  const meta = await sharp(out).metadata();
  const file = `${baseName}-${hashOf(out)}.webp`;
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, file), out);
  return { file, w: meta.width, h: meta.height };
}

async function listImages(dir) {
  if (!fss.existsSync(dir)) return [];
  return (await fs.readdir(dir))
    .filter((f) => IMG_RE.test(f) && !f.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
}

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'anh';

/** Xử lý 1 thư mục ảnh → thumbnail + ảnh lớn WebP */
async function processGallery(folder, thumbW, fullW) {
  const src = path.join(ASSETS, folder);
  const out = path.join(DIST, 'assets', folder);
  const files = await listImages(src);
  const items = [];
  for (const f of files) {
    const buf = await fs.readFile(path.join(src, f));
    const base = slug(path.parse(f).name);
    const t = await toWebp(buf, out, `${base}-sm`, thumbW, 74);
    const l = await toWebp(buf, out, `${base}-lg`, fullW, 82);
    items.push({ thumb: `/assets/${folder}/${t.file}`, full: `/assets/${folder}/${l.file}`, w: t.w, h: t.h, name: f });
  }
  return items;
}

// xoay ngẫu nhiên nhưng ổn định theo tên file (−2° → +2°)
const rotFor = (name) => {
  const n = parseInt(crypto.createHash('md5').update(name).digest('hex').slice(0, 6), 16);
  return (((n % 400) / 100) - 2).toFixed(2);
};

// ---------------- Video ----------------
function youtubeId(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:shorts\/|embed\/|youtu\.be\/|[?&]v=|live\/)([\w-]{11})/);
  return m ? m[1] : '';
}

async function processVideos(cfg, doodles) {
  const out = [];
  const client = [];
  let i = 0;
  for (const v of cfg.videos) {
    const id = youtubeId(v.youtube);
    const label = String(v.nhan || '').trim() || `Video ${i + 1}`;
    let poster = '';
    if (v.anhBia) {
      const p = path.join(ROOT, v.anhBia.replace(/^\//, ''));
      if (fss.existsSync(p)) {
        const r = await toWebp(await fs.readFile(p), path.join(DIST, 'assets', 'video'), slug(path.parse(p).name), 540, 76);
        poster = `/assets/video/${r.file}`;
      } else console.warn(`  ⚠ Không thấy ảnh bìa ${v.anhBia} — dùng ảnh tạm`);
    }
    if (!poster && id) poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    if (!poster) {
      const svg = doodles.posterPlaceholder(label, i);
      const r = await toWebp(Buffer.from(svg), path.join(DIST, 'assets', 'video'), `poster-tam-${i + 1}`, 360, 70);
      poster = `/assets/video/${r.file}`;
    }
    let item;
    if (id) item = { type: 'youtube', id, label };
    else if (v.mp4) item = { type: 'mp4', src: v.mp4, label, poster };
    else item = { type: 'none', label };
    client.push(item);
    out.push({ ...item, nhan: label, poster });
    i++;
  }
  return { videos: out, clientVideos: client };
}

// ---------------- Pixel ----------------
function pixelSnippets(px) {
  const ok = (v, re) => (v && re.test(String(v).trim()) ? String(v).trim() : '');
  const tt = ok(px.tiktok, /^[A-Z0-9]{10,30}$/i);
  const fb = ok(px.facebook, /^\d{6,20}$/);
  const ga = ok(px.ga4, /^G-[A-Z0-9]{4,15}$/i);
  const gtm = ok(px.gtm, /^GTM-[A-Z0-9]{4,12}$/i);
  for (const [k, v, real] of [['tiktok', px.tiktok, tt], ['facebook', px.facebook, fb], ['ga4', px.ga4, ga], ['gtm', px.gtm, gtm]]) {
    if (v && !real) console.warn(`  ⚠ pixel.${k} "${v}" không đúng định dạng — bỏ qua`);
  }
  let head = '';
  let body = '';
  if (tt)
    head += `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tt}');ttq.page();}(window,document,'ttq');</script>\n`;
  if (fb)
    head += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb}');fbq('track','PageView');</script>\n`;
  if (ga)
    head += `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');</script>\n`;
  if (gtm) {
    head += `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');</script>\n`;
    body += `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
  }
  return { head, body, gtm: !!gtm, enabled: { tiktok: !!tt, facebook: !!fb, ga4: !!ga, gtm: !!gtm } };
}

// ---------------- Font tự host ----------------
async function buildFonts() {
  const out = path.join(DIST, 'assets', 'fonts');
  await fs.mkdir(out, { recursive: true });
  const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
  const fonts = [
    ['Patrick Hand', 'patrick-hand', 400],
    ['Be Vietnam Pro', 'be-vietnam-pro', 400],
    ['Be Vietnam Pro', 'be-vietnam-pro', 600],
  ];
  let css = '';
  const preloads = [];
  for (const [family, pkg, weight] of fonts) {
    for (const [subset, range] of [['vietnamese', VI], ['latin', LATIN]]) {
      const src = path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', `${pkg}-${subset}-${weight}-normal.woff2`);
      const buf = await fs.readFile(src);
      const file = `${pkg}-${subset}-${weight}-${hashOf(buf)}.woff2`;
      await fs.writeFile(path.join(out, file), buf);
      css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/assets/fonts/${file}) format('woff2');unicode-range:${range};}\n`;
      if (subset === 'latin' && !(pkg === 'be-vietnam-pro' && weight === 600)) preloads.push(`/assets/fonts/${file}`);
      if (subset === 'vietnamese' && pkg === 'patrick-hand') preloads.push(`/assets/fonts/${file}`);
    }
  }
  return {
    css,
    preloads: preloads.map((h) => `<link rel="preload" href="${h}" as="font" type="font/woff2" crossorigin>`).join('\n'),
  };
}

// ---------------- Build chính ----------------
export async function build() {
  const t0 = Date.now();
  // nạp lại module mẫu mỗi lần build (cho chế độ dev)
  const bust = `?t=${Date.now()}`;
  const doodles = await import(path.join(ROOT, 'src', 'doodles.mjs') + bust);
  const pages = await import(path.join(ROOT, 'src', 'pages.mjs') + bust);

  const cfg = await readConfig();
  const siteUrl = siteUrlFrom(cfg);
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, 'assets'), { recursive: true });

  // Chép các file tĩnh trong assets/ (trừ thư mục ảnh sẽ được nén riêng)
  const SKIP = new Set(['feedback', 'ket-qua', 'video', 'README.md']);
  for (const f of fss.existsSync(ASSETS) ? await fs.readdir(ASSETS) : []) {
    if (SKIP.has(f) || f.startsWith('.')) continue;
    await fs.cp(path.join(ASSETS, f), path.join(DIST, 'assets', f), { recursive: true });
  }
  // mp4 trong assets/video/ chép nguyên
  if (fss.existsSync(path.join(ASSETS, 'video'))) {
    for (const f of await fs.readdir(path.join(ASSETS, 'video'))) {
      if (/\.(mp4|webm|mov)$/i.test(f)) {
        await fs.mkdir(path.join(DIST, 'assets', 'video'), { recursive: true });
        await fs.copyFile(path.join(ASSETS, 'video', f), path.join(DIST, 'assets', 'video', f));
      }
    }
  }

  // Logo
  let logoFile = null;
  const logoPath = path.join(ROOT, (cfg.hinhAnh.logo || '').replace(/^\//, ''));
  if (cfg.hinhAnh.logo && fss.existsSync(logoPath)) {
    const r = await toWebp(await fs.readFile(logoPath), path.join(DIST, 'assets'), 'logo', 480, 90);
    logoFile = { src: `/assets/${r.file}`, w: r.w, h: r.h };
  }
  // Ảnh chân dung
  let portrait = null;
  const pPath = cfg.hinhAnh.anhChanDung && path.join(ROOT, cfg.hinhAnh.anhChanDung.replace(/^\//, ''));
  if (pPath && fss.existsSync(pPath)) {
    const r = await toWebp(await fs.readFile(pPath), path.join(DIST, 'assets'), 'chan-dung', 720, 80);
    portrait = { src: `/assets/${r.file}`, w: r.w, h: r.h };
  }

  // Ảnh feedback: đếm từ ảnh thật trong assets/feedback/. Chưa có ảnh → dùng ảnh mẫu (không hiện con số).
  let feedback = await processGallery('feedback', 480, 1400);
  let feedbackIsSample = false;
  if (!feedback.length) {
    feedbackIsSample = true;
    const out = path.join(DIST, 'assets', 'feedback');
    for (let i = 0; i < 20; i++) {
      const r = await toWebp(Buffer.from(doodles.feedbackPlaceholder(i)), out, `mau-${i + 1}`, 400, 70);
      feedback.push({ thumb: `/assets/feedback/${r.file}`, full: `/assets/feedback/${r.file}`, w: r.w, h: r.h, name: `mau-${i}` });
    }
  }
  feedback = feedback.map((f) => ({ ...f, rot: rotFor(f.name) }));
  const results = await processGallery('ket-qua', 360, 1400);

  const { videos, clientVideos } = await processVideos(cfg, doodles);
  const px = pixelSnippets(cfg.pixel);

  // CSS + JS (có mã hash để trình duyệt cache lâu dài)
  const fonts = await buildFonts();
  const cssSrc = fonts.css + (await fs.readFile(path.join(ROOT, 'src', 'styles.css'), 'utf8'));
  const cssMin = (await esbuild.transform(cssSrc, { loader: 'css', minify: true, target: ['safari13', 'chrome80'] })).code;
  const cssFile = `assets/site-${hashOf(Buffer.from(cssMin))}.css`;
  await fs.writeFile(path.join(DIST, cssFile), cssMin);

  const js = await esbuild.build({
    entryPoints: { main: path.join(ROOT, 'src/client/main.js'), thanks: path.join(ROOT, 'src/client/thanks.js') },
    bundle: true,
    minify: true,
    format: 'esm',
    splitting: true,
    target: ['es2019'],
    outdir: path.join(DIST, 'assets'),
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[hash]',
    metafile: true,
    write: true,
    logLevel: 'silent',
  });
  const outFor = (name) => '/' + path.relative(DIST, Object.keys(js.metafile.outputs).map((o) => path.resolve(ROOT, o)).find((o) => path.basename(o).startsWith(name + '-') && o.endsWith('.js'))).replace(/\\/g, '/');

  const ctx = {
    cfg,
    siteUrl,
    logoFile,
    portrait,
    feedback,
    feedbackIsSample,
    results,
    videos,
    fontPreloads: fonts.preloads,
    pixelHead: px.head,
    pixelBody: px.body,
    assets: { css: '/' + cssFile, mainJs: outFor('main'), thanksJs: outFor('thanks') },
    clientConfig: {
      formUrl: /^https:\/\/script\.google(usercontent)?\.com\//.test(cfg.form.appsScriptUrl || '') ? cfg.form.appsScriptUrl : '',
      zalo: cfg.lienHe.zalo,
      gtm: px.gtm,
      videos: clientVideos,
      galleries: {
        feedback: feedback.map((f, i) => ({ full: f.full, alt: `Phản hồi của học viên ${i + 1}` })),
        'ket-qua': results.map((r, i) => ({ full: r.full, alt: `Ảnh chụp app báo lãi ${i + 1}` })),
      },
    },
  };
  if (cfg.form.appsScriptUrl && !ctx.clientConfig.formUrl) console.warn('  ⚠ form.appsScriptUrl không phải link script.google.com — form chạy chế độ thử');

  const write = async (rel, html) => {
    const p = path.join(DIST, rel);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, html);
  };
  await write('index.html', pages.indexPage(ctx));
  await write('cam-on/index.html', pages.thanksPage(ctx));
  await write('chinh-sach-bao-ve-du-lieu/index.html', pages.privacyPage(ctx));
  await write('404.html', pages.notFoundPage(ctx));

  // Favicon từ cụm 3 cây nến
  const fav = doodles.faviconSvg().replace('<svg', '<svg width="64" height="64"');
  await write('favicon.svg', fav);
  const favPadded = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#FAF6EE"/><g transform="translate(26 26) scale(2)">${fav.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g></svg>`;
  await sharp(Buffer.from(favPadded)).png().toFile(path.join(DIST, 'apple-touch-icon.png'));
  await sharp(Buffer.from(fav)).resize(32, 32).png().toFile(path.join(DIST, 'favicon-32.png'));

  await write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /cam-on/\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
  if (siteUrl)
    await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/chinh-sach-bao-ve-du-lieu/</loc></url></urlset>\n`);
  // Header cache/bảo mật cho Netlify & Cloudflare Pages (Vercel dùng vercel.json)
  await write('_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/cam-on/*\n  X-Robots-Tag: noindex\n`);

  log(`Build xong sau ${Date.now() - t0}ms → dist/`);
  log(`Video: ${videos.length} · Ảnh feedback: ${feedbackIsSample ? '0 (đang dùng ảnh mẫu)' : feedback.length} · Ảnh app: ${results.length}`);
  log(`Pixel: ${Object.entries(px.enabled).filter(([, v]) => v).map(([k]) => k).join(', ') || 'chưa bật'} · Form: ${ctx.clientConfig.formUrl ? 'Google Sheet' : 'chế độ thử'}`);
  log(`Logo: ${logoFile ? 'file PNG' : 'SVG vẽ lại (chưa có file PNG)'} · URL: ${siteUrl || '(chưa có)'}`);
}

// ---------------- Chạy ----------------
const watch = process.argv.includes('--watch');
try {
  await build();
} catch (e) {
  console.error('✖ Build lỗi:', e.message);
  if (!watch) process.exit(1);
}
if (watch) {
  const { serve } = await import('./serve.mjs');
  serve();
  let timer;
  for (const d of ['src', 'assets', 'config.jsonc']) {
    const p = path.join(ROOT, d);
    if (!fss.existsSync(p)) continue;
    fss.watch(p, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => build().catch((e) => console.error('✖ Build lỗi:', e.message)), 200);
    });
  }
}
