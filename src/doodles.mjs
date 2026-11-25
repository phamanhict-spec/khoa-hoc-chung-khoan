// Hình vẽ tay (doodle) tạo sẵn lúc build bằng Rough.js → SVG tĩnh, không tốn JS khi tải trang.
import rough from 'roughjs';

const gen = rough.generator();

export const C = {
  ink: '#1F1F1F',
  orange: '#E4561A',
  orangeLite: '#F6C3A8',
  yellow: '#FFE27A',
  noteYellow: '#FFF1A8',
  peach: '#FDE0D2',
  teal: '#2E8B82',
  road: '#CFC6B6',
  paper: '#FAF6EE',
  white: '#FFFFFF',
};

let seedCounter = 11;
const base = (o = {}) => ({
  stroke: C.ink,
  strokeWidth: 2,
  roughness: 1.1,
  bowing: 1,
  fillStyle: 'solid',
  seed: o.seed ?? seedCounter++,
  ...o,
});

// Các hàm vẽ trả về "drawable" của rough
const S = {
  line: (x1, y1, x2, y2, o) => gen.line(x1, y1, x2, y2, base(o)),
  rect: (x, y, w, h, o) => gen.rectangle(x, y, w, h, base(o)),
  circle: (x, y, d, o) => gen.circle(x, y, d, base(o)),
  ellipse: (x, y, w, h, o) => gen.ellipse(x, y, w, h, base(o)),
  poly: (pts, o) => gen.polygon(pts, base(o)),
  path: (d, o) => gen.path(d, base(o)),
  curve: (pts, o) => gen.curve(pts, base(o)),
  arc: (x, y, w, h, a, b, closed, o) => gen.arc(x, y, w, h, a, b, closed, base(o)),
};

function paths(drawable) {
  return gen
    .toPaths(drawable)
    .map((p) => {
      const fill = p.fill && p.fill !== 'none' ? p.fill : 'none';
      return `<path d="${p.d.replace(/(\d+\.\d{2})\d+/g, '$1')}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');
}

/** Ghép các drawable thành 1 thẻ <svg>. extra = chuỗi SVG thêm vào cuối (chữ…) */
export function svg(w, h, items, { cls = '', label = '', extra = '', attrs = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" ${a11y} ${attrs}>${items
    .flat()
    .map(paths)
    .join('')}${extra}</svg>`;
}

// ---------- Icon ----------
const ic = (items, label, cls = 'doodle') => svg(64, 64, items, { cls, label });

export const icons = {
  house: () =>
    ic([
      S.rect(14, 30, 36, 26, { fill: C.orangeLite }),
      S.poly([[8, 32], [32, 10], [56, 32]], { fill: C.yellow }),
      S.rect(27, 40, 10, 16, { fill: C.white }),
    ], 'Bất động sản'),
  gold: () =>
    ic([
      S.poly([[8, 50], [16, 26], [48, 26], [56, 50]], { fill: C.yellow }),
      S.line(20, 32, 30, 32, { strokeWidth: 1.5 }),
      S.line(44, 12, 44, 18, { strokeWidth: 1.5 }),
      S.line(40, 15, 48, 15, { strokeWidth: 1.5 }),
    ], 'Vàng'),
  candles: (circled = false) =>
    ic([
      S.line(18, 30, 18, 54), S.rect(13, 36, 10, 12, { fill: C.orangeLite }),
      S.line(32, 18, 32, 48), S.rect(27, 24, 10, 16, { fill: C.yellow }),
      S.line(46, 8, 46, 40), S.rect(41, 12, 10, 20, { fill: C.orange }),
      ...(circled ? [S.ellipse(32, 32, 62, 60, { stroke: C.orange, strokeWidth: 2.5, roughness: 1.6 })] : []),
    ], 'Cổ phiếu'),
  globeFactory: () =>
    ic([
      S.circle(16, 22, 24, { fill: C.orangeLite }),
      S.ellipse(16, 22, 10, 24, { strokeWidth: 1.4 }),
      S.line(4, 22, 28, 22, { strokeWidth: 1.4 }),
      S.path('M24 36 Q 30 44 36 40', { strokeWidth: 1.6 }),
      S.line(36, 40, 31, 38, { strokeWidth: 1.6 }), S.line(36, 40, 34, 35, { strokeWidth: 1.6 }),
      S.poly([[30, 58], [30, 46], [38, 40], [38, 46], [46, 40], [46, 46], [54, 40], [54, 58]], { fill: C.yellow }),
      S.rect(48, 26, 5, 14, { fill: C.white }),
    ], 'Từ vĩ mô đến doanh nghiệp'),
  funnelClock: () =>
    ic([
      S.poly([[6, 10], [42, 10], [28, 30], [28, 50], [20, 54], [20, 30]], { fill: C.yellow }),
      S.circle(46, 44, 26, { fill: C.white }),
      S.line(46, 44, 46, 36, { strokeWidth: 1.8 }), S.line(46, 44, 52, 47, { strokeWidth: 1.8 }),
    ], 'Lọc cổ phiếu và chọn thời điểm'),
  magnifierReport: () =>
    ic([
      S.rect(8, 6, 34, 46, { fill: C.white }),
      S.line(14, 16, 34, 16, { strokeWidth: 1.4 }), S.line(14, 24, 36, 24, { strokeWidth: 1.4 }),
      S.line(14, 32, 26, 32, { strokeWidth: 1.4 }),
      S.circle(38, 38, 22, { fill: C.orangeLite }),
      S.line(46, 46, 58, 58, { strokeWidth: 4 }),
    ], 'Đọc báo cáo tài chính'),
  robot: () =>
    ic([
      S.line(32, 6, 32, 14), S.circle(32, 6, 6, { fill: C.orange }),
      S.rect(12, 14, 40, 32, { fill: C.yellow }),
      S.circle(24, 28, 8, { fill: C.white }), S.circle(40, 28, 8, { fill: C.white }),
      S.line(24, 38, 40, 38),
      S.rect(18, 48, 28, 10, { fill: C.orangeLite }),
      S.line(6, 24, 12, 26), S.line(58, 24, 52, 26),
    ], 'Trí tuệ nhân tạo'),
  binocularsWave: () =>
    ic([
      S.path('M4 52 Q 14 40 24 50 T 44 48 T 60 46', { stroke: C.orange, strokeWidth: 2.4 }),
      S.circle(20, 26, 20, { fill: C.orangeLite }), S.circle(44, 26, 20, { fill: C.orangeLite }),
      S.rect(28, 16, 8, 8, { fill: C.white }),
      S.circle(20, 26, 8, { fill: C.white }), S.circle(44, 26, 8, { fill: C.white }),
    ], 'Đánh giá kỳ vọng tương lai'),
  flag: (fill = C.orange) =>
    ic([
      S.line(16, 6, 16, 60, { strokeWidth: 2.4 }),
      S.poly([[16, 8], [52, 14], [16, 30]], { fill }),
      S.ellipse(16, 60, 22, 6, { strokeWidth: 1.4 }),
    ], 'Lá cờ'),
  finishFlag: () =>
    svg(80, 80, [
      S.line(18, 8, 18, 74, { strokeWidth: 2.6 }),
      S.rect(18, 10, 48, 30, { fill: C.white }),
      S.rect(18, 10, 12, 10, { fill: C.ink, roughness: 0.6 }), S.rect(42, 10, 12, 10, { fill: C.ink, roughness: 0.6 }),
      S.rect(30, 20, 12, 10, { fill: C.ink, roughness: 0.6 }), S.rect(54, 20, 12, 10, { fill: C.ink, roughness: 0.6 }),
      S.rect(18, 30, 12, 10, { fill: C.ink, roughness: 0.6 }), S.rect(42, 30, 12, 10, { fill: C.ink, roughness: 0.6 }),
      S.ellipse(18, 74, 26, 7, { strokeWidth: 1.4 }),
      S.line(60, 52, 68, 46, { stroke: C.orange }), S.line(62, 60, 72, 58, { stroke: C.orange }),
      S.line(54, 46, 56, 38, { stroke: C.orange }),
    ], { cls: 'doodle', label: 'Cờ đích' }),
  play: () =>
    svg(72, 72, [
      S.circle(36, 36, 62, { fill: C.orange, stroke: C.ink, strokeWidth: 2.4 }),
      S.poly([[28, 22], [52, 36], [28, 50]], { fill: C.white, strokeWidth: 2 }),
    ], { cls: 'doodle play-icon' }),
  check: (color = C.teal) =>
    svg(40, 40, [S.path('M6 22 L 16 32 L 34 8', { stroke: color, strokeWidth: 4, roughness: 1.4 })], { cls: 'mark mark-check' }),
  cross: (color = C.orange) =>
    svg(40, 40, [
      S.line(8, 8, 32, 32, { stroke: color, strokeWidth: 4, roughness: 1.4 }),
      S.line(32, 8, 8, 32, { stroke: color, strokeWidth: 4, roughness: 1.4 }),
    ], { cls: 'mark mark-cross' }),
  arrowRight: (color = C.ink) =>
    svg(60, 24, [
      S.path('M4 13 Q 28 9 52 12', { stroke: color, strokeWidth: 2.6 }),
      S.line(52, 12, 42, 4, { stroke: color, strokeWidth: 2.6 }),
      S.line(52, 12, 43, 21, { stroke: color, strokeWidth: 2.6 }),
    ], { cls: 'arrow arrow-right' }),
  arrowDown: () =>
    svg(24, 40, [
      S.path('M12 4 Q 9 20 12 34', { strokeWidth: 2.4 }),
      S.line(12, 34, 5, 25, { strokeWidth: 2.4 }),
      S.line(12, 34, 19, 26, { strokeWidth: 2.4 }),
    ], { cls: 'arrow arrow-down' }),
  vs: () =>
    svg(72, 56, [S.ellipse(36, 28, 66, 48, { fill: C.yellow, strokeWidth: 2 })], {
      cls: 'vs-badge',
      label: 'so với',
      extra: `<text x="36" y="37" text-anchor="middle" font-family="'Patrick Hand', 'Itim', cursive" font-size="28" fill="${C.ink}">vs</text>`,
    }),
  zalo: () =>
    svg(48, 48, [S.path('M8 10 Q 8 6 12 6 L 38 6 Q 42 6 42 10 L 42 30 Q 42 34 38 34 L 20 34 L 10 42 L 13 34 L 12 34 Q 8 34 8 30 Z', { fill: C.white, stroke: C.ink, strokeWidth: 2 })], {
      cls: 'zalo-icon',
      extra: `<text x="25" y="25" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-weight="600" font-size="11" fill="#0068FF">Zalo</text>`,
    }),
  close: () =>
    svg(32, 32, [S.line(7, 7, 25, 25, { strokeWidth: 3, stroke: '#fff' }), S.line(25, 7, 7, 25, { strokeWidth: 3, stroke: '#fff' })], { cls: 'close-icon' }),
  chevron: (dir = 'right') =>
    svg(32, 32, dir === 'right'
      ? [S.path('M12 6 L 22 16 L 12 26', { strokeWidth: 3 })]
      : [S.path('M20 6 L 10 16 L 20 26', { strokeWidth: 3 })], { cls: 'chev' }),
  tiktok: () =>
    svg(32, 32, [
      S.path('M18 5 L 18 21 Q 18 27 12 27 Q 6 27 6 21 Q 6 15 13 15', { strokeWidth: 2.6 }),
      S.path('M18 5 Q 20 11 26 12', { strokeWidth: 2.6 }),
    ], { cls: 'tt-icon' }),
};

// ---------- Hình minh hoạ màn hình đầu: nến tăng dần + con sóng ----------
export function heroIllustration() {
  const W = 520, H = 440;
  const candle = (x, top, bottom, bodyTop, bodyBottom, fill) => [
    S.line(x, top, x, bottom, { strokeWidth: 2.6 }),
    S.rect(x - 16, bodyTop, 32, bodyBottom - bodyTop, { fill, strokeWidth: 2.6 }),
  ];
  return svg(W, H, [
    // con sóng lớn cuộn đầu ở bên phải
    S.path('M10 420 C 110 410, 200 380, 270 320 C 330 268, 360 190, 410 140 C 450 100, 505 105, 510 150 C 514 190, 478 210, 452 196 C 430 184, 436 156, 458 158 C 472 160, 474 176, 462 180 C 470 230, 490 300, 512 330 L 512 430 L 10 430 Z',
      { fill: C.orangeLite, stroke: C.orange, strokeWidth: 3, roughness: 1.2, seed: 4 }),
    S.path('M60 425 C 160 400, 260 360, 320 300 C 360 260, 390 210, 420 180', { stroke: C.teal, strokeWidth: 2.6, roughness: 1.4, seed: 5 }),
    S.path('M200 428 C 290 400, 370 350, 420 290', { stroke: C.teal, strokeWidth: 2.2, roughness: 1.4, seed: 6 }),
    S.path('M400 128 C 380 110, 360 112, 350 126', { stroke: C.orange, strokeWidth: 2.2, seed: 7 }),
    S.path('M430 108 C 425 90, 410 84, 398 90', { stroke: C.orange, strokeWidth: 2.2, seed: 8 }),
    // nến tăng dần
    ...candle(110, 250, 360, 270, 340, C.yellow),
    ...candle(190, 200, 330, 220, 300, C.white),
    ...candle(270, 140, 290, 165, 260, C.yellow),
    ...candle(350, 70, 250, 95, 210, C.orange),
    // mũi tên tăng trưởng xanh ngọc
    S.path('M70 300 Q 200 230 300 150 T 420 50', { stroke: C.teal, strokeWidth: 4, roughness: 1.3, seed: 9 }),
    S.line(420, 50, 396, 54, { stroke: C.teal, strokeWidth: 4 }),
    S.line(420, 50, 414, 74, { stroke: C.teal, strokeWidth: 4 }),
    // đường nền
    S.line(30, 400, 490, 404, { strokeWidth: 2.4 }),
    // vài nét sao lấp lánh
    S.line(450, 120, 470, 120, { stroke: C.orange }), S.line(460, 110, 460, 130, { stroke: C.orange }),
    S.line(60, 200, 74, 200, { stroke: C.orange }), S.line(67, 193, 67, 207, { stroke: C.orange }),
  ], { cls: 'hero-art', label: 'Hình vẽ tay: cây nến cổ phiếu tăng dần trên con sóng lớn' });
}

// ---------- Logo (vẽ lại theo logo thương hiệu; dùng khi chưa có file PNG) ----------
export function logoCandles(cls = 'logo-candles') {
  return svg(64, 64, [
    S.line(12, 20, 12, 60, { strokeWidth: 3, seed: 1, roughness: 0.6 }), S.rect(6, 26, 12, 28, { fill: C.orangeLite, strokeWidth: 3, seed: 2, roughness: 0.6 }),
    S.line(32, 10, 32, 50, { strokeWidth: 3, seed: 3, roughness: 0.6 }), S.rect(26, 16, 12, 26, { fill: C.orange, strokeWidth: 3, seed: 4, roughness: 0.6 }),
    S.line(52, 2, 52, 36, { strokeWidth: 3, seed: 5, roughness: 0.6 }), S.rect(46, 8, 12, 20, { fill: C.orange, strokeWidth: 3, seed: 6, roughness: 0.6 }),
  ], { cls });
}

/** Logo đầy đủ dạng SVG inline (chữ dùng font Patrick Hand của trang) */
export function logoSvg(cls = 'logo-svg') {
  const font = "font-family=\"'Patrick Hand','Itim',cursive\"";
  return `<svg class="${cls}" viewBox="0 0 820 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chứng khoán phố Việt Hưng">
  <polygon points="20,20 400,20 450,66 400,112 20,112" fill="${C.orange}"/>
  <text x="215" y="84" text-anchor="middle" ${font} font-size="52" fill="#fff" letter-spacing="2">CHỨNG KHOÁN</text>
  <g stroke="${C.ink}" stroke-width="5" stroke-linecap="round">
    <line x1="532" y1="92" x2="532" y2="258"/><rect x="510" y="115" width="46" height="123" fill="${C.orangeLite}"/>
    <line x1="610" y1="60" x2="610" y2="204"/><rect x="588" y="85" width="46" height="98" fill="${C.orange}"/>
    <line x1="687" y1="28" x2="687" y2="148"/><rect x="665" y="48" width="46" height="80" fill="${C.orange}"/>
  </g>
  <text x="24" y="320" ${font} font-size="210" fill="${C.ink}">phố</text>
  <rect x="20" y="420" width="730" height="107" fill="${C.yellow}"/>
  <text x="36" y="500" ${font} font-size="200" fill="${C.orange}" textLength="700" lengthAdjust="spacingAndGlyphs">Việt Hưng</text>
  <path d="M22 568 Q 400 590 800 556" fill="none" stroke="${C.teal}" stroke-width="7" stroke-linecap="round"/>
  <path d="M766 534 L 802 556 L 770 584" fill="none" stroke="${C.teal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

/** Favicon SVG đứng riêng (không phụ thuộc font) */
export function faviconSvg() {
  return logoCandles('').replace('<svg class=""', '<svg');
}

// ---------- Con đường hành trình (section 3) ----------
// Toạ độ mốc theo % — phải khớp với CSS (.journey-pc .stop-N)
export const JOURNEY_X = [14, 30, 48, 66, 82];
export function journeyRoadPC() {
  const W = 1000, H = 120;
  const xs = JOURNEY_X.map((p) => (p / 100) * W);
  const ys = [40, 80, 40, 80, 40];
  // đường cong đi qua các mốc, có đoạn xuất phát và đoạn đích
  const pts = [[0, 60], ...xs.map((x, i) => [x, ys[i]]), [W, 60]];
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return `<svg class="road road-pc" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${C.road}" stroke-width="34" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="${d}" fill="none" stroke="${C.paper}" stroke-width="3" stroke-dasharray="14 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}
export function journeyRoadMobile() {
  // đường dọc uốn lượn; preserveAspectRatio none để kéo dài theo chiều cao danh sách
  const d = 'M 30 0 C 10 80, 50 120, 30 200 S 10 320, 30 400 S 50 520, 30 600 S 10 720, 30 800 S 50 920, 30 1000';
  return `<svg class="road road-mobile" viewBox="0 0 60 1000" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${C.road}" stroke-width="22" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="${d}" fill="none" stroke="${C.paper}" stroke-width="2.5" stroke-dasharray="10 10" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// ---------- Ảnh tạm (placeholder) ----------
/** Ảnh bìa video tạm 9:16 */
export function posterPlaceholder(label, i = 0) {
  const W = 360, H = 640;
  const fills = [C.noteYellow, C.peach, '#F3EBDD'];
  return svg(W, H, [
    S.rect(0, 0, W, H, { fill: fills[i % 3], stroke: 'none', roughness: 0 }),
    S.rect(40, 120, 280, 300, { fill: C.white, strokeWidth: 2.4, seed: 30 + i }),
    S.line(70, 170, 290, 170, { seed: 40 + i }), S.line(70, 210, 250, 210, { seed: 41 + i }),
    S.path('M70 380 L 130 330 L 180 350 L 240 270 L 290 230', { stroke: C.teal, strokeWidth: 4, seed: 50 + i }),
  ], {
    extra: `<text x="${W / 2}" y="520" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#6B6B6B">video sắp cập nhật</text>`,
    attrs: `width="${W}" height="${H}"`,
  });
}

/** Ảnh feedback tạm: khung tin nhắn Zalo đã che tên */
export function feedbackPlaceholder(i) {
  const W = 400;
  const nMsg = 2 + (i * 7) % 4;
  let y = 70;
  const items = [S.rect(0, 0, W, 56, { fill: '#0068FF', stroke: 'none', roughness: 0 }), S.circle(34, 28, 30, { fill: '#9DB8E8', stroke: 'none', roughness: 0 })];
  for (let k = 0; k < nMsg; k++) {
    const lines = 1 + ((i + k * 3) % 3);
    const h = 22 + lines * 22;
    const mine = k % 3 === 2;
    const w = 180 + ((i * 31 + k * 47) % 150);
    const x = mine ? W - w - 16 : 16;
    items.push(S.rect(x, y, w, h, { fill: mine ? '#D6E9FF' : C.white, stroke: '#D0D0D0', strokeWidth: 1, roughness: 0.3, seed: i * 10 + k }));
    for (let l = 0; l < lines; l++) {
      items.push(S.line(x + 14, y + 22 + l * 22, x + w - 14 - (l === lines - 1 ? 50 : 0), y + 22 + l * 22, { stroke: '#9A9A9A', strokeWidth: 6, roughness: 0.2, seed: i * 100 + k * 10 + l }));
    }
    y += h + 14;
  }
  const H = y + 10;
  return svg(W, H, [S.rect(0, 0, W, H, { fill: '#E9EEF4', stroke: 'none', roughness: 0 }), ...items], {
    extra: `<rect x="64" y="18" width="110" height="20" fill="#1F1F1F"/><text x="${W - 14}" y="${H - 12}" text-anchor="end" font-family="sans-serif" font-size="14" fill="#6B6B6B">ảnh mẫu</text>`,
    attrs: `width="${W}" height="${H}"`,
  });
}

/** Ảnh chia sẻ OG tạm thời không cần — xem scripts/make-og.mjs */
export const roughLib = { S, svg };
