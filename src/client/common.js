// Phần dùng chung cho mọi trang: khung vẽ tay Rough.js, hiệu ứng khi cuộn tới, đo lường.
import rough from 'roughjs/bin/rough.js';

// Cấu hình nằm trong <script type="application/json"> (không thực thi được) → hợp với CSP
function readSite() {
  try {
    return JSON.parse(document.getElementById('site-data')?.textContent || '{}');
  } catch (_) {
    return {};
  }
}
export const SITE = readSite();
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- Đo lường (pixel) ----------------
const EVENTS = {
  click_dang_ky: { tt: 'ClickButton', fb: null, ga: 'click_dang_ky' },
  play_video: { tt: 'ViewContent', fb: 'ViewContent', ga: 'play_video' },
  click_zalo: { tt: 'Contact', fb: 'Contact', ga: 'click_zalo' },
  lead: { tt: 'SubmitForm', fb: 'Lead', ga: 'generate_lead' },
};

/** Bắn sự kiện cho các pixel đang bật. Không bao giờ gửi họ tên/SĐT/email. */
export function track(name, { eventId, ...params } = {}) {
  const e = EVENTS[name];
  if (!e) return;
  try {
    if (window.ttq && e.tt) window.ttq.track(e.tt, params, eventId ? { event_id: eventId } : undefined);
    if (window.fbq && e.fb) window.fbq('track', e.fb, params, eventId ? { eventID: eventId } : undefined);
    if (window.gtag && e.ga) window.gtag('event', e.ga, params);
    if (SITE.gtm && window.dataLayer) window.dataLayer.push({ event: e.ga, ...params });
  } catch (_) {
    /* pixel lỗi không được làm hỏng trang */
  }
  if (SITE.debug) console.info('[track]', name, params);
}

export function initZaloTracking() {
  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-zalo]')) track('click_zalo');
  });
}

// ---------------- Khung vẽ tay ----------------
const COLORS = { ink: '#1F1F1F', orange: '#E4561A', orangeLite: '#F6C3A8', teal: '#2E8B82' };
const SVGNS = 'http://www.w3.org/2000/svg';

function roundedRect(w, h, r, i) {
  const x = i, y = i, W = w - i * 2, H = h - i * 2;
  r = Math.min(r, W / 2, H / 2);
  return `M${x + r} ${y} L${x + W - r} ${y} Q${x + W} ${y} ${x + W} ${y + r} L${x + W} ${y + H - r} Q${x + W} ${y + H} ${x + W - r} ${y + H} L${x + r} ${y + H} Q${x} ${y + H} ${x} ${y + H - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

let seedN = 1;
function drawFrame(el) {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w || !h) return;
  if (el._roughSize === `${w}x${h}`) return;
  el._roughSize = `${w}x${h}`;
  el._roughSeed = el._roughSeed || (seedN++ * 7) % 997;
  let svg = el.querySelector(':scope > svg.rough-frame');
  if (!svg) {
    svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'rough-frame');
    svg.setAttribute('aria-hidden', 'true');
    el.prepend(svg);
  }
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.innerHTML = '';
  const strokeWidth = parseFloat(el.dataset.roughW || '2');
  const r = parseFloat(el.dataset.roughR || '18');
  const rc = rough.svg(svg);
  const node = rc.path(roundedRect(w, h, r, strokeWidth + 1), {
    stroke: COLORS[el.dataset.rough] || COLORS.ink,
    strokeWidth,
    roughness: w > 500 ? 1.1 : 0.9,
    bowing: 0.6,
    seed: el._roughSeed,
    disableMultiStroke: false,
  });
  svg.appendChild(node);
  if (!reduceMotion && !el.classList.contains('is-drawn')) {
    node.querySelectorAll('path').forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = el.classList.contains('is-in') ? '0' : `${len}`;
    });
  }
}

export function initRough(root = document) {
  const els = [...root.querySelectorAll('[data-rough]')];
  const ro = new ResizeObserver((entries) => entries.forEach((e) => drawFrame(e.target)));
  els.forEach((el) => {
    drawFrame(el);
    ro.observe(el);
  });
  // vẽ lại sau khi font tải xong (kích thước chữ thay đổi)
  document.fonts?.ready.then(() => els.forEach(drawFrame));
}

// ---------------- Hiệu ứng khi cuộn tới ----------------
export function initReveal() {
  const targets = document.querySelectorAll('[data-rough], .hl, .note, .sticker');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in', 'is-drawn'));
    return;
  }
  document.documentElement.classList.add('anim');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-in');
        el.querySelectorAll(':scope > svg.rough-frame path').forEach((p) => (p.style.strokeDashoffset = '0'));
        setTimeout(() => el.classList.add('is-drawn'), 700);
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
  );
  targets.forEach((t) => io.observe(t));
}

// ---------------- Popup chính sách dữ liệu ----------------
export function initPrivacy() {
  const dlg = document.querySelector('[data-privacy-dialog]');
  if (!dlg || typeof dlg.showModal !== 'function') return; // trình duyệt cũ → mở trang riêng
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-privacy]');
    if (!a) return;
    ev.preventDefault();
    dlg.showModal();
  });
  dlg.addEventListener('click', (ev) => {
    if (ev.target === dlg) dlg.close();
  });
}
