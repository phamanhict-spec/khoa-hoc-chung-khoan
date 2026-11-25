/**
 * Nhận đăng ký từ website → ghi vào Google Sheet → (tuỳ chọn) gửi email báo chủ shop.
 * Cách cài: xem HUONG-DAN.md, mục 4.
 */

// ====== CẤU HÌNH ======
// Email nhận thông báo khi có đăng ký mới. Để trống '' = không gửi email.
var NOTIFY_EMAIL = '';
// Tên trang tính (tab) lưu đăng ký
var SHEET_NAME = 'Đăng ký';
// ======================

var HEADERS = ['Thời gian', 'Họ tên', 'Năm sinh', 'Email', 'SĐT', 'Biết đến qua', 'UTM source', 'UTM campaign', 'Thiết bị', 'Trạng thái', 'Mã đăng ký'];
var STATUSES = ['Mới', 'Đã liên hệ', 'Đã chốt', 'Không mua'];

/** Chạy hàm này 1 lần (nút ▶ Run) để tạo tab, tiêu đề cột và danh sách chọn Trạng thái. */
function setup() {
  var sheet = getSheet_();
  SpreadsheetApp.getActive().setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  return 'Đã cài xong tab "' + sheet.getName() + '"';
}

function getSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFE27A');
    sheet.setFrozenRows(1);
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
    sheet.getRange(2, 10, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  v = String(v == null ? '' : v).trim().slice(0, max || 120);
  // chặn công thức bảng tính (=, +, -, @) bị chèn vào ô
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function doGet() {
  return json_({ ok: true, message: 'Web App đang chạy' });
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  // Honeypot: người thật không điền ô này
  if (p.website) return json_({ ok: true });

  var name = clean_(p.hoTen, 80);
  var year = clean_(p.namSinh, 4);
  var email = clean_(p.email, 120);
  var phone = String(p.sdt || '').replace(/[^\d]/g, '').slice(0, 11);
  var id = clean_(p.id, 64);

  var thisYear = new Date().getFullYear();
  var valid =
    name.length >= 2 &&
    /^\d{4}$/.test(year) && +year >= 1940 && +year <= thisYear - 16 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
    /^0(3|5|7|8|9)\d{8}$/.test(phone);
  if (!valid) return json_({ ok: false, error: 'invalid' });

  // Chống gửi lặp: cùng SĐT trong 30 giây, hoặc cùng mã đăng ký
  var cache = CacheService.getScriptCache();
  if (cache.get('p' + phone) || (id && cache.get('i' + id))) return json_({ ok: true, duplicate: true });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var time = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([
      time, name, year, email, "'" + phone, clean_(p.bietDenQua, 40),
      clean_(p.utmSource, 100), clean_(p.utmCampaign, 100), clean_(p.thietBi, 10), 'Mới', id,
    ]);
  } finally {
    lock.releaseLock();
  }
  cache.put('p' + phone, '1', 30);
  if (id) cache.put('i' + id, '1', 600);

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Đăng ký mới: ' + name + ' — ' + phone,
        body:
          'Có học viên vừa đăng ký khoá học:\n\n' +
          'Họ tên: ' + name + '\nNăm sinh: ' + year + '\nEmail: ' + email + '\nSĐT (Zalo): ' + phone +
          '\nBiết đến qua: ' + clean_(p.bietDenQua, 40) + '\nUTM: ' + clean_(p.utmSource, 100) + ' / ' + clean_(p.utmCampaign, 100) +
          '\nThiết bị: ' + clean_(p.thietBi, 10) + '\n\nMở Google Sheet để cập nhật trạng thái.',
      });
    } catch (err) {
      // lỗi email không làm hỏng việc lưu đăng ký
    }
  }
  return json_({ ok: true });
}
