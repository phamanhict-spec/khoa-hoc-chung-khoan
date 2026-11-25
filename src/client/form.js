// Form đăng ký: kiểm tra hợp lệ, chống spam, gửi tới Google Apps Script.
import { SITE } from './common.js';

const COOLDOWN_MS = 30_000;
const MSG = {
  name: 'Bạn nhập giúp họ và tên (ít nhất 2 ký tự) nhé.',
  nameChars: 'Họ tên chỉ nên có chữ cái và khoảng trắng.',
  year: (min, max) => `Năm sinh gồm 4 chữ số, trong khoảng ${min}–${max}.`,
  email: 'Email chưa đúng định dạng, bạn kiểm tra lại giúp nhé (ví dụ: ten@gmail.com).',
  phone: 'Số điện thoại chưa đúng, bạn kiểm tra lại giúp nhé.',
  source: 'Bạn chọn giúp một mục nhé.',
  agree: 'Bạn cần tích đồng ý để gửi đăng ký.',
  cooldown: (s) => `Bạn vừa gửi đăng ký. Vui lòng đợi ${s} giây rồi thử lại nhé.`,
  fail: 'Chưa gửi được, bạn thử lại hoặc nhắn Zalo trực tiếp.',
};

/** Chuẩn hoá SĐT: bỏ khoảng trắng/dấu chấm/gạch, +84 / 84 → 0 */
export function normalizePhone(v) {
  let s = String(v).replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (/^84\d{9}$/.test(s)) s = '0' + s.slice(2);
  return s;
}
const PHONE_RE = /^0(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}\p{M} .'\-]+$/u;

function device() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768 ? 'mobile' : 'PC';
}

export function initForm() {
  const form = document.getElementById('reg-form');
  if (!form) return;
  const el = (id) => form.querySelector('#' + id);
  const f = {
    name: el('f-name'), year: el('f-year'), email: el('f-email'), phone: el('f-phone'),
    source: el('f-source'), agree: el('f-agree'), hp: el('f-web'),
  };
  const errFor = { name: 'e-name', year: 'e-year', email: 'e-email', phone: 'e-phone', source: 'e-source', agree: 'e-agree' };
  const submitBtn = form.querySelector('[data-submit]');
  const msgEl = form.querySelector('[data-form-msg]');
  const minY = +f.year.dataset.min, maxY = +f.year.dataset.max;

  const checks = {
    name: () => {
      const v = f.name.value.trim().replace(/\s+/g, ' ');
      if (v.length < 2) return MSG.name;
      if (!NAME_RE.test(v)) return MSG.nameChars;
      return '';
    },
    year: () => {
      const v = f.year.value.trim();
      return /^\d{4}$/.test(v) && +v >= minY && +v <= maxY ? '' : MSG.year(minY, maxY);
    },
    email: () => (EMAIL_RE.test(f.email.value.trim()) ? '' : MSG.email),
    phone: () => (PHONE_RE.test(normalizePhone(f.phone.value)) ? '' : MSG.phone),
    source: () => (f.source.value ? '' : MSG.source),
    agree: () => (f.agree.checked ? '' : MSG.agree),
  };

  const setErr = (k, text) => {
    const input = f[k];
    const p = form.querySelector('#' + errFor[k]);
    p.textContent = text;
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    input.closest('.field').classList.toggle('has-err', !!text);
  };
  const validate = (k) => {
    const e = checks[k]();
    setErr(k, e);
    return !e;
  };

  // Chỉ cho gõ số ở ô năm sinh
  f.year.addEventListener('input', () => (f.year.value = f.year.value.replace(/\D/g, '').slice(0, 4)));
  // Kiểm tra khi rời ô; khi đang có lỗi thì kiểm tra lại ngay lúc gõ để lỗi biến mất
  Object.keys(checks).forEach((k) => {
    const input = f[k];
    const evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'blur';
    input.addEventListener(evt, () => validate(k));
    input.addEventListener('input', () => input.getAttribute('aria-invalid') === 'true' && validate(k));
  });
  f.phone.addEventListener('blur', () => {
    const n = normalizePhone(f.phone.value);
    if (PHONE_RE.test(n)) f.phone.value = n;
  });

  const showMsg = (html) => {
    msgEl.innerHTML = html;
    msgEl.hidden = !html;
  };

  let sending = false;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (sending) return;
    showMsg('');
    const bad = Object.keys(checks).filter((k) => !validate(k));
    if (bad.length) {
      f[bad[0]].focus();
      return;
    }
    // Chống gửi lại trong 30 giây
    let last = 0;
    try { last = +localStorage.getItem('dk_last') || 0; } catch (_) {}
    const wait = COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) {
      showMsg(MSG.cooldown(Math.ceil(wait / 1000)));
      return;
    }

    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
    let utm = {};
    try { utm = JSON.parse(sessionStorage.getItem('utm') || '{}'); } catch (_) {}
    const data = {
      id,
      hoTen: f.name.value.trim().replace(/\s+/g, ' '),
      namSinh: f.year.value.trim(),
      email: f.email.value.trim(),
      sdt: normalizePhone(f.phone.value),
      bietDenQua: f.source.value,
      utmSource: utm.utm_source || '',
      utmCampaign: utm.utm_campaign || '',
      thietBi: device(),
      website: f.hp.value, // honeypot: người thật để trống
    };

    // Bot điền ô ẩn → giả vờ thành công, không gửi
    if (data.website) {
      location.href = '/cam-on/';
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi…';
    try {
      if (SITE.formUrl) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        // Gửi dạng form (simple request) để không bị chặn CORS bởi Apps Script
        const res = await fetch(SITE.formUrl, {
          method: 'POST',
          body: new URLSearchParams(data),
          signal: ctrl.signal,
          redirect: 'follow',
        });
        clearTimeout(timer);
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || 'send failed');
      } else {
        console.warn('[form] Chưa cấu hình appsScriptUrl — chế độ thử, không lưu dữ liệu.');
      }
      try {
        localStorage.setItem('dk_last', String(Date.now()));
        sessionStorage.setItem('dk', JSON.stringify({ id, ten: data.hoTen, sdt: data.sdt }));
      } catch (_) {}
      location.href = '/cam-on/';
    } catch (err) {
      sending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi đăng ký';
      showMsg(`${MSG.fail} <a class="btn btn-zalo" href="${SITE.zalo}" target="_blank" rel="noopener" data-zalo>Nhắn Zalo</a>`);
    }
  });
}
