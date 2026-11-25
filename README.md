# Landing page — Khoá học tìm cổ phiếu sóng thần

Website 1 trang + trang cảm ơn cho **Chứng khoán phố Việt Hưng**. Phong cách "sổ tay vẽ tay", ưu tiên mobile.
Chủ shop đọc **[HUONG-DAN.md](HUONG-DAN.md)** (sửa cấu hình, thêm ảnh/video, cài Google Sheet, gắn tên miền, kiểm tra pixel).

## Công nghệ

- Trang tĩnh, build bằng Node (`scripts/build.mjs`), không framework, không cơ sở dữ liệu.
- **Một file cấu hình duy nhất:** `config.jsonc` (JSON có chú thích tiếng Việt).
- Hình vẽ tay: [Rough.js](https://roughjs.com) — icon/hình minh hoạ vẽ sẵn lúc build (SVG tĩnh), khung viền vẽ lúc chạy để co giãn theo nội dung.
- Font tự host (Patrick Hand + Be Vietnam Pro 400/600, chỉ bộ Latin + tiếng Việt, `font-display: swap`).
- Ảnh trong `assets/feedback`, `assets/ket-qua`, ảnh bìa video → tự nén WebP (sharp), lazy load.
- Form → Google Apps Script Web App (`apps-script/Code.gs`) → Google Sheet.

## Chạy trên máy

```bash
npm install
```

```bash
npm run dev
```

Mở http://localhost:4321 — sửa file trong `src/`, `assets/` hoặc `config.jsonc` là trang tự build lại (tải lại trình duyệt để xem).

```bash
npm run build
```

Kết quả nằm trong `dist/`.

## Deploy

| Nền tảng | Cài đặt |
|---|---|
| Vercel | Import repo GitHub → tự nhận `vercel.json` (build `npm run build`, output `dist`) |
| Netlify | Import repo → tự nhận `netlify.toml` |
| Cloudflare Pages | Build command `npm run build`, output `dist`, biến môi trường `NODE_VERSION=20` |

Link xem thử có ngay sau khi deploy. URL tuyệt đối cho ảnh chia sẻ lấy từ `config.jsonc → site.url`, nếu trống thì tự lấy URL của nền tảng.

## Cấu trúc

```
config.jsonc            ← cấu hình (giá, link, video, pixel, SEO)
assets/                 ← logo, ảnh chia sẻ, ảnh feedback, ảnh app, ảnh bìa video
apps-script/Code.gs     ← code dán vào Google Apps Script
src/pages.mjs           ← HTML 8 section + trang cảm ơn + chính sách dữ liệu
src/doodles.mjs         ← hình vẽ tay (icon, minh hoạ, logo)
src/styles.css          ← giao diện
src/client/*.js         ← JS trình duyệt: khung vẽ tay, video, xem ảnh, form, pixel
scripts/build.mjs       ← build ra dist/
scripts/make-og.mjs     ← tạo lại assets/og-image.png (cần Playwright)
```

## Bảo mật

| Lớp | Biện pháp |
|---|---|
| HTTP header | `X-Frame-Options: DENY` + `frame-ancestors 'none'` (chống nhúng trang lừa bấm), `nosniff`, `Referrer-Policy`, `Permissions-Policy` (tắt camera/micro/vị trí/thanh toán), HSTS, `COOP`. Khai báo ở `vercel.json` và `dist/_headers` (Netlify/Cloudflare) — sửa thì sửa cả hai (`SECURITY_HEADERS` trong `scripts/build.mjs`). |
| CSP | Thẻ `<meta>` Content-Security-Policy sinh lúc build: chỉ chạy script của trang + script inline của pixel đã bật (băm SHA-256), chỉ gọi mạng tới Apps Script và tên miền pixel đã bật, chỉ nhúng iframe YouTube. Bật **GTM** thì CSP buộc phải nới lỏng (build có cảnh báo). |
| Chống XSS | Mọi chữ từ cấu hình được escape khi sinh HTML; JS trình duyệt dựng phần tử bằng DOM (`textContent`), không ghép chuỗi HTML; cấu hình trình duyệt nằm trong `<script type="application/json">`. |
| Cấu hình | Build từ chối link không phải `https://` (chặn `javascript:`…) và đường dẫn ảnh/video ngoài `/assets/`. Mã pixel phải đúng định dạng. |
| Form / Apps Script | Kiểm tra lại toàn bộ dữ liệu phía máy chủ; chặn chèn công thức bảng tính; "Biết đến qua" chỉ nhận giá trị trong danh sách; honeypot; chặn trùng SĐT/mã đăng ký; giới hạn 30 đăng ký / 10 phút; khoá ghi tránh xung đột. |
| Dữ liệu cá nhân | Không gửi họ tên/SĐT/email lên pixel; không đặt lên URL; Sheet riêng tư, trình duyệt chỉ biết URL Web App (chỉ ghi, không đọc được). |
| Phát triển | Máy chủ xem thử chỉ mở trên `127.0.0.1`, chặn đọc file ngoài `dist/`; `.env` bị loại khỏi git; Dependabot đề xuất cập nhật thư viện hằng tháng. |

## Ghi chú kỹ thuật

- Trang cảm ơn `/cam-on/` có `noindex`; họ tên/SĐT chuyển qua `sessionStorage` (không nằm trên URL nên không lọt vào pixel).
- Sự kiện Lead/SubmitForm có `event_id` = mã đăng ký, chỉ bắn 1 lần/lượt gửi.
- Chống spam: ô honeypot + chặn gửi lại 30 giây (trình duyệt) + chặn trùng SĐT 30 giây (Apps Script).
- Apps Script chặn chèn công thức bảng tính (`=`, `+`, `-`, `@` ở đầu ô).
- `prefers-reduced-motion` tắt mọi hiệu ứng.
