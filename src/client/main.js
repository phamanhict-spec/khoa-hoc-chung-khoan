// Trang chủ
import { SITE, track, initRough, initReveal, initZaloTracking, initPrivacy, reduceMotion } from './common.js';
import { initForm } from './form.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

// Lưu tham số UTM (để form biết khách đến từ quảng cáo nào)
(function saveUtm() {
  try {
    const q = new URLSearchParams(location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((k) => q.get(k) && (utm[k] = q.get(k).slice(0, 100)));
    if (Object.keys(utm).length) sessionStorage.setItem('utm', JSON.stringify(utm));
  } catch (_) {}
})();

// ---------------- Thanh đầu trang ----------------
function initHeader() {
  const h = $('.site-header');
  if (!h) return;
  const on = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
  on();
  window.addEventListener('scroll', on, { passive: true });
}

// ---------------- Nút "Đăng ký ngay" ----------------
function initCta() {
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-cta]');
    if (!a) return;
    ev.preventDefault();
    track('click_dang_ky');
    const target = $('#dang-ky');
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    const name = $('#f-name');
    // đặt con trỏ vào ô Họ tên sau khi cuộn xong
    const focus = () => name && name.focus({ preventScroll: true });
    if ('onscrollend' in window && !reduceMotion) {
      let done = false;
      const f = () => { if (!done) { done = true; focus(); } };
      window.addEventListener('scrollend', f, { once: true });
      setTimeout(f, 1200);
    } else setTimeout(focus, reduceMotion ? 0 : 700);
    history.replaceState(null, '', '#dang-ky');
  });
}

// ---------------- Thanh đăng ký dính đáy (mobile) ----------------
function initStickyBar() {
  const bar = $('[data-sticky-bar]');
  const form = $('#reg-form');
  const hero = $('.hero');
  if (!bar || !form) return;
  let formVisible = false, heroVisible = true;
  const update = () => {
    const show = !formVisible && !heroVisible;
    bar.classList.toggle('is-shown', show);
    document.body.classList.toggle('has-sticky-bar', show);
  };
  // Ẩn khi khu vực đăng ký (thẻ học phí + form) đang trên màn hình, để không che nút gửi
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }, { threshold: 0 }).observe(document.getElementById('dang-ky') || form);
  // Thanh hiện khi đã cuộn qua nút đăng ký ở màn hình đầu
  const heroBtn = $('.hero .btn-primary') || hero;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(heroBtn);
}

// ---------------- Dải video ----------------
function initCarousel() {
  const box = $('[data-carousel]');
  if (!box) return;
  const track = $('[data-track]', box);
  const items = $$('.vcard', track);
  const dots = $('[data-dots]', box);
  const prev = $('.car-prev', box), next = $('.car-next', box);
  dots.innerHTML = items.map(() => '<span></span>').join('');
  const dotEls = $$('span', dots);
  const step = () => (items[0]?.getBoundingClientRect().width || 200) + parseFloat(getComputedStyle(track).columnGap || 16);
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const overflow = max > 4;
    box.classList.toggle('is-overflow', overflow);
    prev.hidden = next.hidden = !overflow || isMobile();
    dots.hidden = !overflow;
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= max - 4;
    const idx = Math.round(track.scrollLeft / step());
    dotEls.forEach((d, i) => d.classList.toggle('on', i === Math.min(idx, items.length - 1)));
  };
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  update();
}

// ---------------- Popup dùng chung ----------------
let lastFocus = null;
function openOverlay(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.documentElement.classList.add('no-scroll');
  requestAnimationFrame(() => el.classList.add('is-open'));
  $('[data-close]', el)?.focus();
}
function closeOverlay(el, after) {
  el.classList.remove('is-open');
  document.documentElement.classList.remove('no-scroll');
  el.hidden = true;
  after && after();
  lastFocus && lastFocus.focus({ preventScroll: true });
}

// ---------------- Video phóng to ----------------
function initVideos() {
  const modal = $('[data-video-modal]');
  if (!modal) return;
  const boxEl = $('[data-video-box]', modal);
  const clear = () => boxEl.replaceChildren();
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-video]');
    if (!btn) return;
    const v = (SITE.videos || [])[+btn.dataset.video];
    if (!v) return;
    // Dựng phần tử bằng DOM (không ghép chuỗi HTML) để chữ trong cấu hình không thể chèn mã
    let node;
    if (v.type === 'youtube' && /^[\w-]{11}$/.test(v.id)) {
      node = document.createElement('iframe');
      node.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
      node.title = v.label;
      node.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      node.allowFullscreen = true;
      node.referrerPolicy = 'strict-origin-when-cross-origin';
    } else if (v.type === 'mp4' && /^\/assets\//.test(v.src)) {
      node = document.createElement('video');
      Object.assign(node, { src: v.src, controls: true, autoplay: true, playsInline: true, preload: 'auto' });
      if (v.poster) node.poster = v.poster;
    } else {
      node = document.createElement('div');
      node.className = 'video-empty';
      const p1 = document.createElement('p');
      p1.textContent = `Video “${v.label}” đang được cập nhật.`;
      const p2 = document.createElement('p');
      p2.textContent = 'Quay lại sau ít hôm nhé!';
      node.append(p1, p2);
    }
    boxEl.replaceChildren(node);
    openOverlay(modal);
    track('play_video', { content_name: v.label });
  });
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.closest('[data-close]')) closeOverlay(modal, clear);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !modal.hidden) closeOverlay(modal, clear);
  });
}

// ---------------- Xem ảnh phóng to (vuốt trái/phải) ----------------
function initLightbox() {
  const lb = $('[data-lightbox]');
  if (!lb) return;
  const img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb);
  let list = [], idx = 0;
  const show = (i) => {
    idx = (i + list.length) % list.length;
    const it = list[idx];
    img.src = it.full;
    img.alt = it.alt;
    cap.textContent = `${idx + 1} / ${list.length}`;
    lb.classList.toggle('single', list.length < 2);
  };
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-gallery]');
    if (!b) return;
    list = (SITE.galleries || {})[b.dataset.gallery] || [];
    if (!list.length) return;
    show(+b.dataset.index);
    openOverlay(lb);
  });
  $('[data-prev]', lb).addEventListener('click', () => show(idx - 1));
  $('[data-next]', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (ev) => {
    if (ev.target === lb || ev.target.closest('[data-close]') || ev.target.classList.contains('lb-figure')) closeOverlay(lb);
  });
  document.addEventListener('keydown', (ev) => {
    if (lb.hidden) return;
    if (ev.key === 'Escape') closeOverlay(lb);
    if (ev.key === 'ArrowLeft') show(idx - 1);
    if (ev.key === 'ArrowRight') show(idx + 1);
  });
  let x0 = null, y0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

// ---------------- Bảng ghim phản hồi (masonry) ----------------
function initMasonry() {
  const wrap = $('[data-masonry]');
  if (!wrap) return;
  const pins = $$('.pin', wrap);
  const moreBtn = $('[data-more]');
  const fade = $('[data-fade]');
  const colsFor = () => (window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 3 : 4);
  const batch = () => (isMobile() ? 8 : 12);
  let shown = Math.min(batch(), pins.length);
  let cols = 0;

  const layout = () => {
    const n = colsFor();
    cols = n;
    const colEls = Array.from({ length: n }, () => {
      const c = document.createElement('div');
      c.className = 'mcol';
      c.setAttribute('role', 'presentation');
      return c;
    });
    const heights = new Array(n).fill(0);
    pins.forEach((p, i) => {
      p.hidden = i >= shown;
      if (p.hidden) return;
      const img = p.querySelector('img');
      const ratio = img.height / img.width || 1.5;
      let k = heights.indexOf(Math.min(...heights));
      colEls[k].appendChild(p);
      heights[k] += ratio + 0.08;
    });
    // ảnh ẩn để cuối cột đầu cho gọn DOM
    pins.forEach((p) => p.hidden && colEls[0].appendChild(p));
    wrap.replaceChildren(...colEls);
    const all = shown >= pins.length;
    moreBtn.parentElement.hidden = all;
    fade.hidden = all;
  };
  layout();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => colsFor() !== cols && layout(), 150);
  });
  moreBtn?.addEventListener('click', () => {
    shown = Math.min(shown + batch(), pins.length);
    layout();
  });
}

initHeader();
initCta();
initStickyBar();
initCarousel();
initVideos();
initLightbox();
initMasonry();
initForm();
initPrivacy();
initZaloTracking();
initRough();
initReveal();
