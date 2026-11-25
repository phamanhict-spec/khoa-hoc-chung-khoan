# Hướng dẫn sử dụng website (dành cho chủ shop)

Mọi thay đổi thường gặp đều làm trên GitHub, ngay trên trình duyệt: mở file → bấm biểu tượng ✏️ (Edit) → sửa → bấm **Commit changes**. Khoảng 1–2 phút sau, Vercel/Netlify tự cập nhật website.

## 1. Sửa giá, link Zalo, TikTok, quyền lợi, pixel…

Mở file **`config.jsonc`**. Mỗi dòng đều có ghi chú tiếng Việt phía trên. Lưu ý:

- Giữ nguyên dấu ngoặc kép `"..."` và dấu phẩy `,` cuối dòng.
- Học phí chỉ ghi số: `"hocPhi": 12000000` → trang tự hiện `12.000.000đ` ở mọi nơi (thẻ học phí, thanh đăng ký dưới đáy).
- Pixel: dán mã vào `"tiktok"`, `"facebook"`, `"ga4"`; để trống `""` thì pixel đó không chạy.

Nếu sửa sai cú pháp, bản build sẽ báo lỗi kèm **số dòng** và website giữ nguyên bản cũ — sửa lại dòng đó là được.

## 2. Thêm ảnh phản hồi học viên

Vào thư mục **`assets/feedback/`** → **Add file → Upload files** → kéo ảnh vào → Commit.
Ảnh phải che tên và ảnh đại diện trước khi tải lên. Website tự nén ảnh, tự xếp lên bảng ghim và tự đếm "[N]+ phản hồi".

Ảnh chụp app báo lãi: làm tương tự với thư mục **`assets/ket-qua/`**.

## 3. Thêm video show danh mục

1. Tải video dọc lên YouTube dạng **Shorts**, chế độ **Không công khai (Unlisted)**.
2. Copy link video (vd `https://youtube.com/shorts/abc123XYZ`).
3. Mở `config.jsonc`, thêm 1 dòng vào mục `"videos"`:
   ```
   { "youtube": "https://youtube.com/shorts/abc123XYZ", "anhBia": "", "nhan": "Danh mục tháng 11/2026" },
   ```
   Video mới nhất nên để trên cùng. Muốn ảnh bìa đẹp hơn ảnh YouTube tự tạo: tải ảnh dọc 9:16 vào `assets/video/` rồi ghi `"anhBia": "/assets/video/ten-anh.jpg"`.

## 4. Cài (hoặc cài lại) Google Sheet nhận đăng ký

1. Tạo một Google Sheet mới (đứng tên tài khoản Google của bạn, **không chia sẻ công khai**).
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Xoá hết code mẫu, dán toàn bộ nội dung file **`apps-script/Code.gs`**.
3. Muốn nhận email khi có đăng ký mới: sửa dòng `var NOTIFY_EMAIL = '';` thành `var NOTIFY_EMAIL = 'email-cua-ban@gmail.com';`
4. Bấm 💾 Lưu. Chọn hàm **`setup`** ở thanh trên → bấm **▶ Chạy** → cấp quyền khi Google hỏi (chọn tài khoản → Nâng cao → Đi tới dự án → Cho phép).
   Sheet sẽ có tab "Đăng ký" với đủ cột và danh sách chọn Trạng thái (Mới · Đã liên hệ · Đã chốt · Không mua).
5. **Triển khai → Tùy chọn triển khai mới** → loại **Ứng dụng web**:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
   → Triển khai → copy **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
6. Dán URL đó vào `config.jsonc` → `"appsScriptUrl": "..."` → Commit.
7. Thử: mở website, gửi 1 đăng ký → kiểm tra dòng mới trong Sheet.

> Khi sửa code Apps Script sau này: **Triển khai → Quản lý các bản triển khai → ✏️ → Phiên bản: Mới → Triển khai** (giữ nguyên URL).
> Người lạ chỉ thấy được URL Web App (chỉ nhận dữ liệu), **không** xem được Sheet.
> Nếu đổi danh sách "Biết đến qua đâu" trong `config.jsonc`, sửa cả dòng `var SOURCES = [...]` trong Apps Script cho giống (lựa chọn lạ sẽ được ghi thành "Khác").

## 4b. Lưu ý an toàn

- **Không chia sẻ Google Sheet công khai** và không dán link Sheet lên website. Chỉ chia sẻ cho người phụ trách tư vấn.
- Bật **xác minh 2 bước** cho tài khoản Google, GitHub và Vercel/Netlify — ai vào được các tài khoản này là sửa được website hoặc đọc được dữ liệu khách.
- Chỉ cấp quyền **Google Tag Manager** cho người tin cậy: GTM có thể chèn mã bất kỳ vào trang.
- Khi GitHub gửi đề xuất cập nhật thư viện (Dependabot), nhờ coder xem và gộp.

## 5. Gắn tên miền

**Vercel:** Project → Settings → Domains → nhập `tenmien.vn` → làm theo hướng dẫn thêm bản ghi DNS ở nơi mua tên miền. Thêm cả `www.tenmien.vn` và chọn **Redirect to tenmien.vn** để chỉ còn 1 bản. HTTPS tự bật.
**Netlify:** Site configuration → Domain management → Add a domain (www tự chuyển hướng về tên miền chính).

Sau đó mở `config.jsonc`, điền `"url": "https://tenmien.vn"` để ảnh chia sẻ link hiển thị đúng.

## 6. Kiểm tra pixel đã chạy

- **TikTok:** cài tiện ích Chrome *TikTok Pixel Helper*, mở website → thấy `PageView`; bấm "Đăng ký ngay" → `ClickButton`; bấm Play video → `ViewContent`; bấm Zalo → `Contact`; gửi form → ở trang cảm ơn thấy `SubmitForm`.
- **Facebook:** tiện ích *Meta Pixel Helper* → `PageView`, `ViewContent`, `Contact`, `Lead`.
- **GA4:** Google Analytics → Quản trị → **DebugView** (bật tiện ích *Google Analytics Debugger*) → thấy `page_view`, `click_dang_ky`, `play_video`, `click_zalo`, `generate_lead`.

Sự kiện đăng ký chỉ bắn 1 lần cho mỗi lượt gửi; tải lại trang cảm ơn không bắn lại. Họ tên, SĐT, email không bao giờ được gửi lên pixel.

## 7. Thay logo bằng file gốc

Tải file `logo-pho-viet-hung-transparent.png` vào thư mục **`assets/`**. Website tự dùng file này thay cho logo vẽ lại.
Ảnh chân dung cho màn hình đầu (tuỳ chọn): tải vào `assets/` rồi điền `"anhChanDung": "/assets/ten-anh.jpg"` trong `config.jsonc`.
