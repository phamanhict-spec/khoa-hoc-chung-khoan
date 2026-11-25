// Trang cảm ơn: hiện tên + SĐT, bắn sự kiện đăng ký thành công đúng 1 lần.
import { track, initRough, initReveal, initZaloTracking } from './common.js';

(function () {
  let dk = null;
  try { dk = JSON.parse(sessionStorage.getItem('dk') || 'null'); } catch (_) {}
  if (dk && dk.ten) {
    const p = document.querySelector('[data-thanks-msg]');
    const name = document.createElement('strong');
    name.textContent = dk.ten;
    const phone = document.createElement('strong');
    phone.textContent = dk.sdt;
    p.replaceChildren('Cảm ơn ', name, '. Tôi sẽ nhắn Zalo cho bạn qua số ', phone, ' để xác nhận lịch học. Muốn trao đổi ngay? Nhắn cho tôi trước nhé.');
  }
  // Chỉ bắn khi có lượt gửi thật và chưa bắn cho lượt đó (tải lại trang không bắn lại)
  if (dk && dk.id) {
    let fired = [];
    try { fired = JSON.parse(localStorage.getItem('dk_fired') || '[]'); } catch (_) {}
    if (!fired.includes(dk.id)) {
      track('lead', { eventId: dk.id, content_name: 'Khoá học tìm cổ phiếu sóng thần' });
      fired.push(dk.id);
      try { localStorage.setItem('dk_fired', JSON.stringify(fired.slice(-20))); } catch (_) {}
    }
  }
})();

initZaloTracking();
initRough();
initReveal();
