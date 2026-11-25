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

// ---------- Icon: nét mực đen + 1 điểm nhấn cam, không tô pastel ----------
const L = (o = {}) => ({ roughness: 0.55, bowing: 0.6, strokeWidth: 1.8, ...o });
const ic = (items, label, cls = 'doodle') => svg(64, 64, items, { cls, label });
const O = C.orange;

export const icons = {
  house: () =>
    ic([
      S.rect(16, 30, 32, 24, L()),
      S.poly([[10, 32], [32, 12], [54, 32]], L()),
      S.rect(28, 40, 8, 14, L({ stroke: O })),
    ], 'Bất động sản'),
  gold: () =>
    ic([
      S.poly([[10, 48], [17, 28], [47, 28], [54, 48]], L()),
      S.line(22, 34, 30, 34, L({ stroke: O })),
    ], 'Vàng'),
  candles: (circled = false) =>
    ic([
      S.line(18, 30, 18, 54, L()), S.rect(14, 36, 8, 12, L()),
      S.line(32, 18, 32, 46, L()), S.rect(28, 24, 8, 14, L()),
      S.line(46, 8, 46, 40, L()), S.rect(42, 12, 8, 20, L({ fill: O, stroke: C.ink })),
      ...(circled ? [S.ellipse(32, 32, 62, 60, L({ stroke: O, strokeWidth: 2.2, roughness: 1.1 }))] : []),
    ], 'Cổ phiếu'),
  globeFactory: () =>
    ic([
      S.circle(18, 20, 24, L()),
      S.ellipse(18, 20, 10, 24, L({ strokeWidth: 1.3 })),
      S.line(6, 20, 30, 20, L({ strokeWidth: 1.3 })),
      S.path('M26 34 Q 31 42 38 40', L({ stroke: O })),
      S.line(38, 40, 33, 37, L({ stroke: O })), S.line(38, 40, 35, 35, L({ stroke: O })),
      S.poly([[28, 58], [28, 48], [36, 43], [36, 48], [44, 43], [44, 48], [52, 43], [52, 58]], L()),
      S.line(48, 30, 48, 44, L()),
    ], 'Từ vĩ mô đến doanh nghiệp'),
  funnelClock: () =>
    ic([
      S.poly([[6, 10], [42, 10], [28, 30], [28, 50], [20, 54], [20, 30]], L()),
      S.circle(46, 44, 24, L({ stroke: O })),
      S.line(46, 44, 46, 37, L({ stroke: O })), S.line(46, 44, 51, 47, L({ stroke: O })),
    ], 'Lọc cổ phiếu và chọn thời điểm'),
  magnifierReport: () =>
    ic([
      S.rect(8, 6, 32, 46, L()),
      S.line(14, 16, 32, 16, L({ strokeWidth: 1.3 })), S.line(14, 24, 34, 24, L({ strokeWidth: 1.3 })),
      S.line(14, 32, 24, 32, L({ strokeWidth: 1.3 })),
      S.circle(38, 38, 20, L({ stroke: O, strokeWidth: 2.2 })),
      S.line(45, 45, 57, 57, L({ stroke: O, strokeWidth: 3 })),
    ], 'Đọc báo cáo tài chính'),
  robot: () =>
    svg(64, 64, [
      S.rect(14, 14, 36, 36, L()),
      ...[22, 32, 42].flatMap((x) => [S.line(x, 6, x, 14, L({ strokeWidth: 1.4 })), S.line(x, 50, x, 58, L({ strokeWidth: 1.4 }))]),
      ...[22, 32, 42].flatMap((y) => [S.line(6, y, 14, y, L({ strokeWidth: 1.4 })), S.line(50, y, 58, y, L({ strokeWidth: 1.4 }))]),
    ], {
      cls: 'doodle',
      label: 'Trí tuệ nhân tạo',
      extra: `<text x="32" y="38" text-anchor="middle" font-family="'Be Vietnam Pro',sans-serif" font-weight="800" font-size="15" fill="${O}">AI</text>`,
    }),
  binocularsWave: () =>
    ic([
      S.circle(20, 24, 18, L()), S.circle(44, 24, 18, L()),
      S.line(29, 24, 35, 24, L()),
      S.path('M4 52 Q 14 40 24 50 T 44 48 T 60 42', L({ stroke: O, strokeWidth: 2.4 })),
    ], 'Đánh giá kỳ vọng tương lai'),
  finishFlag: () =>
    svg(80, 80, [
      S.circle(40, 40, 64, L({ stroke: C.teal, strokeWidth: 2.4 })),
      S.path('M26 41 L 36 51 L 56 29', L({ stroke: C.teal, strokeWidth: 4 })),
    ], { cls: 'doodle', label: 'Hoàn tất' }),
  play: () =>
    svg(72, 72, [
      S.circle(36, 36, 58, { fill: O, stroke: 'none', roughness: 0.3, fillStyle: 'solid' }),
      S.poly([[30, 25], [49, 36], [30, 47]], { fill: '#fff', stroke: 'none', roughness: 0.2, fillStyle: 'solid' }),
    ], { cls: 'doodle play-icon' }),
  check: (color = C.teal) =>
    svg(40, 40, [S.path('M7 21 L 16 30 L 33 10', { stroke: color, strokeWidth: 3.4, roughness: 0.8 })], { cls: 'mark mark-check' }),
  cross: (color = O) =>
    svg(40, 40, [
      S.line(10, 10, 30, 30, { stroke: color, strokeWidth: 3.4, roughness: 0.8 }),
      S.line(30, 10, 10, 30, { stroke: color, strokeWidth: 3.4, roughness: 0.8 }),
    ], { cls: 'mark mark-cross' }),
  arrowRight: (color = C.ink) =>
    svg(60, 24, [
      S.path('M4 13 Q 28 9 52 12', { stroke: color, strokeWidth: 2.6 }),
      S.line(52, 12, 42, 4, { stroke: color, strokeWidth: 2.6 }),
      S.line(52, 12, 43, 21, { stroke: color, strokeWidth: 2.6 }),
    ], { cls: 'arrow arrow-right' }),
  arrowDown: () =>
    svg(24, 40, [
      S.path('M12 4 Q 10 20 12 34', { strokeWidth: 2 }),
      S.line(12, 34, 6, 26, { strokeWidth: 2 }),
      S.line(12, 34, 18, 27, { strokeWidth: 2 }),
    ], { cls: 'arrow arrow-down' }),
  vs: () => `<span class="vs-text" aria-label="so với">vs</span>`,
  zalo: () => `<span class="zalo-icon" aria-hidden="true">Zalo</span>`,
  close: () =>
    svg(32, 32, [S.line(8, 8, 24, 24, { strokeWidth: 2.6, stroke: '#fff', roughness: 0.3 }), S.line(24, 8, 8, 24, { strokeWidth: 2.6, stroke: '#fff', roughness: 0.3 })], { cls: 'close-icon' }),
  chevron: (dir = 'right') =>
    svg(32, 32, dir === 'right'
      ? [S.path('M12 7 L 21 16 L 12 25', { strokeWidth: 2.6, roughness: 0.3 })]
      : [S.path('M20 7 L 11 16 L 20 25', { strokeWidth: 2.6, roughness: 0.3 })], { cls: 'chev' }),
  tiktok: () =>
    svg(32, 32, [
      S.path('M18 5 L 18 21 Q 18 27 12 27 Q 6 27 6 21 Q 6 15 13 15', { strokeWidth: 2.4, roughness: 0.4 }),
      S.path('M18 5 Q 20 11 26 12', { strokeWidth: 2.4, roughness: 0.4 }),
    ], { cls: 'tt-icon' }),
};

// ---------- Hình đầu trang: biểu đồ nến có chú thích viết tay (như trang phân tích) ----------
function candleData() {
  // tích luỹ đi ngang → bứt phá → sóng tăng mạnh (giá trị minh hoạ, không phải dữ liệu thật)
  const closes = [42, 40, 43, 41, 39, 42, 44, 41, 40, 43, 42, 45, 52, 50, 57, 63, 60, 68, 76, 72, 83, 92];
  let prev = 41;
  return closes.map((c, i) => {
    const o = i === 0 ? 41 : prev;
    const hi = Math.max(o, c) + 1.5 + ((i * 7) % 4) * 0.6;
    const lo = Math.min(o, c) - 1.5 - ((i * 5) % 3) * 0.6;
    prev = c;
    const vol = c > o ? (i > 11 ? 14 + ((i * 3) % 8) : 6 + ((i * 3) % 4)) : 5 + ((i * 5) % 4);
    return { o, c, hi, lo, vol };
  });
}

export function heroIllustration() {
  const W = 520, H = 420;
  const px0 = 40, px1 = 500, py0 = 40, py1 = 320; // khung giá
  const data = candleData();
  const min = 34, max = 98;
  const y = (v) => py1 - ((v - min) / (max - min)) * (py1 - py0);
  const step = (px1 - px0) / data.length;
  const x = (i) => px0 + step * (i + 0.5);
  let g = '';
  // lưới mờ
  for (let k = 0; k <= 4; k++) {
    const yy = py0 + ((py1 - py0) / 4) * k;
    g += `<line x1="${px0}" y1="${yy}" x2="${px1}" y2="${yy}" stroke="#E8E0D2" stroke-width="1"/>`;
  }
  // nến + khối lượng
  data.forEach((d, i) => {
    const up = d.c >= d.o;
    const col = up ? C.teal : C.orange;
    const top = y(Math.max(d.o, d.c)), bot = y(Math.min(d.o, d.c));
    g += `<line x1="${x(i)}" y1="${y(d.hi)}" x2="${x(i)}" y2="${y(d.lo)}" stroke="${col}" stroke-width="1.6"/>`;
    g += `<rect x="${x(i) - step * 0.32}" y="${top}" width="${step * 0.64}" height="${Math.max(2, bot - top)}" fill="${up ? col : '#fff'}" stroke="${col}" stroke-width="1.6"/>`;
    g += `<rect x="${x(i) - step * 0.32}" y="${392 - d.vol * 3}" width="${step * 0.64}" height="${d.vol * 3}" fill="${up ? 'rgba(46,139,130,.35)' : 'rgba(228,86,26,.3)'}"/>`;
  });
  g += `<line x1="${px0}" y1="392" x2="${px1}" y2="392" stroke="${C.ink}" stroke-width="1.2"/>`;
  g += `<line x1="${px0}" y1="${py1 + 6}" x2="${px0}" y2="${py0 - 10}" stroke="${C.ink}" stroke-width="1.2"/>`;
  // chú thích viết tay (Rough), đặt ở khoảng trống phía trên-trái đường giá
  const ax = x(5.5);
  const ex = x(12), ey = y(56); // đỉnh nến bứt phá
  const ann = [
    S.ellipse(ax, y(41.5), x(11) - x(0) + 26, 52, { stroke: C.ink, strokeWidth: 1.8, roughness: 1.1, seed: 21 }),
    // điểm vào: mũi tên cong từ chữ xuống nến bứt phá
    S.path(`M${x(9.6)} ${y(66)} Q ${x(11.6)} ${y(68)} ${ex} ${ey + 4}`, { stroke: C.orange, strokeWidth: 2.2, roughness: 0.8, seed: 22 }),
    S.line(ex, ey + 4, ex - 9, ey - 3, { stroke: C.orange, strokeWidth: 2.2, roughness: 0.6, seed: 23 }),
    S.line(ex, ey + 4, ex + 5, ey - 6, { stroke: C.orange, strokeWidth: 2.2, roughness: 0.6, seed: 24 }),
    // sóng tăng: mũi tên song song phía trên-trái đường giá
    S.path(`M${x(12.2)} ${y(66)} C ${x(14)} ${y(74)}, ${x(16)} ${y(84)}, ${x(18)} ${y(94)}`, { stroke: C.orange, strokeWidth: 2.6, roughness: 0.9, seed: 25 }),
    S.line(x(18), y(94), x(18) - 4, y(94) + 15, { stroke: C.orange, strokeWidth: 2.6, roughness: 0.5, seed: 26 }),
    S.line(x(18), y(94), x(18) - 15, y(94) + 5, { stroke: C.orange, strokeWidth: 2.6, roughness: 0.5, seed: 27 }),
  ];
  const hand = `font-family="'Patrick Hand','Itim',cursive"`;
  const labels = `
    <text x="${ax}" y="${y(41.5) + 48}" text-anchor="middle" ${hand} font-size="23" fill="${C.ink}">vùng tích luỹ</text>
    <text x="${x(9.4)}" y="${y(66) + 7}" text-anchor="end" ${hand} font-size="24" fill="${C.orange}">điểm vào</text>
    <rect x="${x(15.2) - 98}" y="${y(81) - 9}" width="100" height="13" fill="${C.yellow}"/>
    <text x="${x(15.2)}" y="${y(81)}" text-anchor="end" ${hand} font-size="25" fill="${C.ink}">sóng tăng</text>`;
  const label = 'Minh hoạ biểu đồ nến: giai đoạn tích luỹ đi ngang, điểm vào khi bứt phá và sóng tăng mạnh phía sau';
  return `<svg class="hero-art" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${g.replace(/(\d+\.\d{2})\d+/g, '$1')}${ann.map(paths).join('')}${labels}</svg>`;
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
