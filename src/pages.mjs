// Mẫu HTML các trang. Nội dung chữ lấy nguyên văn từ bản yêu cầu.
import { icons, heroIllustration, logoSvg } from './doodles.mjs';

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const formatVnd = (n) => `${Number(n).toLocaleString('de-DE')}đ`;

const tag = (text) => `<p class="tag"><span>${text}</span></p>`;
const hl = (text) => `<mark class="hl">${text}</mark>`;

// ---------------- Khung trang ----------------
export function layout(ctx, { title, description, path, body, noindex = false, scripts = '', bodyClass = '' }) {
  const { cfg, siteUrl, assets } = ctx;
  const abs = (p) => (siteUrl ? siteUrl + p : p);
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${esc(ctx.csp)}">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${esc(abs(path))}">`}
<meta name="theme-color" content="#FAF6EE">
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="${esc(cfg.site.thuongHieu)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
<meta property="og:image" content="${esc(abs(cfg.seo.anhChiaSe))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${ctx.fontPreloads}
<link rel="stylesheet" href="${assets.css}">
<script type="application/json" id="site-data">${JSON.stringify(ctx.clientConfig).replace(/</g, '\\u003c')}</script>
${ctx.pixelHead}
</head>
<body class="${bodyClass}">
${ctx.pixelBody}
${body}
${scripts}
</body>
</html>`;
}

function logo(ctx, cls = '') {
  return ctx.logoFile
    ? `<img class="logo-img ${cls}" src="${ctx.logoFile.src}" width="${ctx.logoFile.w}" height="${ctx.logoFile.h}" alt="${esc(ctx.cfg.site.thuongHieu)}">`
    : `<span class="logo-wrap ${cls}">${logoSvg('logo-svg')}</span>`;
}

const ctaButton = (label = 'Đăng ký ngay', cls = '') =>
  `<a class="btn btn-primary ${cls}" href="#dang-ky" data-cta>${label}</a>`;

// ---------------- Trang chủ ----------------
export function indexPage(ctx) {
  const { cfg } = ctx;
  const body = `
<a class="skip" href="#noi-dung">Bỏ qua tới nội dung</a>
${header(ctx)}
<main id="noi-dung">
${hero(ctx)}
${proof(ctx)}
${journey()}
${practice()}
${notFor()}
${feedback(ctx)}
${register(ctx)}
</main>
${footer(ctx)}
${floating(ctx)}
${modals()}
${privacyDialog(ctx)}`;
  return layout(ctx, {
    title: cfg.seo.tieuDe,
    description: cfg.seo.moTa,
    path: '/',
    body,
    scripts: `<script type="module" src="${ctx.assets.mainJs}"></script>`,
    bodyClass: 'page-home',
  });
}

function header(ctx) {
  return `<header class="site-header" id="dau-trang">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${esc(ctx.cfg.site.thuongHieu)} — về đầu trang">${logo(ctx)}</a>
    ${ctaButton('Đăng ký ngay', 'btn-sm')}
  </div>
</header>`;
}

function hero(ctx) {
  const { cfg } = ctx;
  const chips = cfg.khoaHoc.nhanNhanh.map((t) => `<li class="chip">${esc(t)}</li>`).join('');
  const portrait = ctx.portrait
    ? `<figure class="polaroid" data-rough="ink" data-rough-r="4"><img src="${ctx.portrait.src}" width="${ctx.portrait.w}" height="${ctx.portrait.h}" alt="Chân dung người giảng dạy" fetchpriority="high"></figure>`
    : `<figure class="chart-card">${heroIllustration()}<figcaption>Hình minh hoạ phương pháp — không phải dữ liệu của một mã cụ thể</figcaption></figure>`;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="container hero-grid">
    <div class="hero-text">
      ${tag('KHOÁ HỌC')}
      <h1 id="hero-title" class="hero-title">Khoá học tìm cổ phiếu ${hl('sóng thần')}</h1>
      <p class="hero-sub">Phương pháp tìm những cổ phiếu tăng trưởng vượt trội — từ đọc hiểu doanh nghiệp đến chọn đúng thời điểm.</p>
      <ul class="chips" aria-label="Thông tin nhanh">${chips}</ul>
      <div class="hero-actions">
        ${ctaButton('Đăng ký ngay', 'btn-lg')}
        <a class="btn-link" href="#bang-chung">Xem danh mục thực tế ${icons.arrowDown()}</a>
      </div>
    </div>
    <div class="hero-art-wrap">${portrait}</div>
  </div>
</section>`;
}

function proof(ctx) {
  const cards = ctx.videos
    .map(
      (v, i) => `<li class="vcard">
      <button type="button" class="vcard-btn" data-video="${i}" aria-label="Xem video: ${esc(v.nhan)}">
        <span class="vcard-frame">
          <img src="${v.poster}" alt="" width="360" height="640" loading="lazy" decoding="async">
          <span class="vcard-play">${icons.play()}</span>
        </span>
        <span class="vcard-label">${esc(v.nhan)}</span>
      </button>
    </li>`
    )
    .join('');
  const shots = ctx.results.length
    ? `<ul class="shots" aria-label="Ảnh chụp app">${ctx.results
        .map(
          (r, i) => `<li><button type="button" class="shot" data-gallery="ket-qua" data-index="${i}" aria-label="Phóng to ảnh ${i + 1}">
          <img src="${r.thumb}" width="${r.w}" height="${r.h}" alt="Ảnh chụp app báo lãi ${i + 1}" loading="lazy" decoding="async"></button></li>`
        )
        .join('')}</ul>`
    : '';
  return `<section class="section proof" id="bang-chung" aria-labelledby="proof-title">
  <div class="container">
    ${tag('BẰNG CHỨNG')}
    <h2 id="proof-title" class="section-title">Đừng nghe phân tích. Hãy xem danh mục.</h2>
    <div class="proof-intro">
      <p class="lead">Mọi lời phân tích hoa mỹ đều vô giá trị nếu không đi kèm một danh mục đầu tư vượt trội. Dưới đây là những video tôi mở app và show ${hl('danh mục thật')} của mình.</p>
      <aside class="note note-yellow tilt-r"><p>Trước khi theo học bất kỳ ai, hãy để người đó chứng minh năng lực bằng chính danh mục của họ.</p></aside>
    </div>
    <div class="carousel" data-carousel>
      <button type="button" class="car-arrow car-prev" aria-label="Video trước" hidden>${icons.chevron('left')}</button>
      <ul class="vtrack" data-track>${cards}</ul>
      <button type="button" class="car-arrow car-next" aria-label="Video tiếp theo" hidden>${icons.chevron('right')}</button>
      <div class="dots" data-dots aria-hidden="true"></div>
    </div>
    ${shots}
    <p class="disclaimer-line">Kết quả trong quá khứ không đảm bảo kết quả tương lai.</p>
  </div>
</section>`;
}

const JOURNEY = [
  {
    icon: 'globeFactory',
    title: 'Từ vĩ mô đến từng doanh nghiệp',
    text: 'Phương pháp luận đi từ bức tranh kinh tế xuống tận cách một doanh nghiệp vận hành. Bạn thấy được toàn cảnh, và thấy rõ doanh nghiệp đang kiếm tiền như thế nào.',
  },
  {
    icon: 'funnelClock',
    title: 'Lọc cổ phiếu và chọn thời điểm',
    text: 'Lọc ra những mã có cơ hội tăng trưởng vượt trội, và hoạch định thời điểm vào để ít phải chờ đợi nhất.',
  },
  {
    icon: 'magnifierReport',
    title: 'Đọc báo cáo tài chính nâng cao',
    text: 'Mọi cơn sóng tăng trưởng mạnh đều để lại dấu vết trên báo cáo tài chính. Nhìn ra dấu vết đó là điều phân biệt nhà đầu tư trung bình với nhà đầu tư đẳng cấp.',
  },
  {
    icon: 'robot',
    title: 'Dùng AI để phân tích nhanh gấp nhiều lần',
    big: true,
    text: 'Một báo cáo phân tích cổ phiếu từng mất cả tuần, nay tôi làm trong 20 phút. Dùng AI như đứng trên vai người khổng lồ — bạn sẽ học cách hỏi, cách học ngược từ chính AI, và thấy rằng dùng AI cũng là một nghệ thuật.',
  },
  {
    icon: 'binocularsWave',
    title: 'Đánh giá kỳ vọng tương lai',
    sticker: 'QUAN TRỌNG NHẤT',
    text: 'Cách đánh giá kỳ vọng tương lai của một cổ phiếu — và phân biệt một cổ phiếu tầm thường với một cổ phiếu sóng thần.',
  },
];

function journey() {
  const card = (s, i) => `<article class="jcard jcard-${i + 1}${i === 4 ? ' note note-yellow' : ''}">
      ${s.sticker ? `<span class="sticker">${s.sticker}</span>` : ''}
      <div class="jcard-head">${icons[s.icon]()}<h3><span class="sr-only">Nội dung ${i + 1}: </span>${s.title}</h3></div>
      ${s.big ? `<p class="bignum"><span>1 tuần</span>${icons.arrowRight('#E4561A')}<span>20 phút</span></p>` : ''}
      <p>${s.text}</p>
    </article>`;
  return `<section class="section journey" id="noi-dung-khoa-hoc" aria-labelledby="journey-title">
  <div class="container">
    ${tag('BẠN SẼ NHẬN ĐƯỢC')}
    <h2 id="journey-title" class="section-title">Một tư duy đầu tư dùng được cho mọi tài sản</h2>
    <div class="journey-intro">
      <p class="lead">Khoá học xây trên bản chất của đầu tư giá trị: ${hl('thuyết kỳ vọng tương lai')}. Tư duy này áp dụng được cho bất động sản, vàng hay cổ phiếu — và khoá học đi sâu vào cổ phiếu với 5 nội dung:</p>
      <div class="asset-icons">${icons.house()}${icons.gold()}${icons.candles(true)}</div>
    </div>
    <ol class="timeline">${JOURNEY.map((s, i) => `<li class="tl-item tl-${i + 1}"><span class="tl-num" aria-hidden="true">${i + 1}</span>${card(s, i)}</li>`).join('')}</ol>
  </div>
</section>`;
}

function practice() {
  return `<section class="section practice" id="thuc-chien" aria-labelledby="practice-title">
  <div class="container">
    ${tag('THỰC CHIẾN')}
    <h2 id="practice-title" class="section-title">Không chỉ dừng lại ở một khoá học</h2>
    <p class="lead narrow">Lý thuyết chỉ là lý thuyết nếu bạn chưa va chạm với case study thực tế. Vì vậy tôi phân tích cả hai loại cổ phiếu:</p>
    <div class="compare">
      <div class="compare-col compare-yes">
        ${icons.check()}
        <h3>Cổ phiếu sóng thần thật</h3>
        <p>Vì sao nó tăng vượt trội, và dấu hiệu nào đã báo trước.</p>
      </div>
      <div class="compare-vs">${icons.vs()}</div>
      <div class="compare-col compare-no">
        ${icons.cross()}
        <h3>Cổ phiếu “trông có vẻ” sóng thần</h3>
        <p>Vì sao tôi không chọn, và cái bẫy nằm ở đâu.</p>
      </div>
      <aside class="note note-peach tilt-l compare-note"><p>Biết vì sao không chọn một mã cũng quan trọng như biết vì sao chọn nó. Đó là con đường nhanh nhất để thẩm thấu toàn bộ lý thuyết.</p></aside>
    </div>
  </div>
</section>`;
}

function notFor() {
  return `<section class="section notfor" id="luu-y" aria-labelledby="notfor-title">
  <div class="container">
    <div class="notfor-box" data-rough="orange" data-rough-r="14" data-rough-w="2">
      ${tag('LƯU Ý TRƯỚC KHI ĐĂNG KÝ')}
      <h2 id="notfor-title" class="section-title">Khoá học này không dành cho bạn nếu…</h2>
      <ul class="marks">
        <li>${icons.cross()}<span>Bạn chưa từng đầu tư chứng khoán.</span></li>
        <li>${icons.cross()}<span>Bạn chưa nắm các khái niệm cơ bản trong báo cáo tài chính (doanh thu, lợi nhuận, tài sản, nợ vay…).</span></li>
      </ul>
      <aside class="note note-yellow tilt-r"><p>Kiến thức cơ bản có rất nhiều trên YouTube, miễn phí. Bạn không cần trả tiền cho phần đó — khoá học dành toàn bộ thời gian cho phần nâng cao.</p></aside>
      <p class="fit">${icons.check()}<span><strong>Phù hợp với bạn nếu:</strong> đã đầu tư, đã biết đọc sơ bộ báo cáo tài chính, và muốn một phương pháp bài bản để tìm cổ phiếu tăng trưởng vượt trội.</span></p>
    </div>
  </div>
</section>`;
}

function feedback(ctx) {
  const items = ctx.feedback
    .map(
      (f, i) => `<div class="pin" role="listitem" style="--r:${f.rot}deg"${i >= 12 ? ' hidden' : ''}>
      <button type="button" class="pin-btn" data-gallery="feedback" data-index="${i}" aria-label="Phóng to phản hồi ${i + 1}">
        <img src="${f.thumb}" width="${f.w}" height="${f.h}" alt="Ảnh chụp tin nhắn phản hồi của học viên ${i + 1}" loading="lazy" decoding="async">
      </button></div>`
    )
    .join('');
  const count = ctx.feedbackIsSample
    ? ''
    : `<span class="count-badge" aria-label="${ctx.feedback.length} phản hồi trở lên">${ctx.feedback.length}+ phản hồi</span>`;
  return `<section class="section feedback" id="phan-hoi" aria-labelledby="fb-title">
  <div class="container">
    ${tag('HỌC VIÊN NÓI GÌ')}
    <div class="title-row"><h2 id="fb-title" class="section-title">Phản hồi thật từ học viên</h2>${count}</div>
    <p class="lead">Ảnh chụp tin nhắn Zalo, giữ nguyên nội dung — chỉ che tên và ảnh đại diện để bảo vệ học viên.</p>
    <div class="board" data-board>
      <div class="masonry" role="list" data-masonry>${items}</div>
      <div class="board-fade" data-fade></div>
    </div>
    <div class="board-more"><button type="button" class="btn btn-ghost" data-more>Xem thêm phản hồi</button></div>
  </div>
</section>`;
}

function register(ctx) {
  const { cfg } = ctx;
  const year = new Date().getFullYear();
  const options = cfg.form.nguonBietDen.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
  const benefits = cfg.khoaHoc.quyenLoi.map((b) => `<li>${icons.check()}<span>${esc(b)}</span></li>`).join('');
  return `<section class="section register" id="dang-ky" aria-labelledby="reg-title">
  <div class="container">
    ${tag('ĐĂNG KÝ')}
    <h2 id="reg-title" class="section-title">Đăng ký khoá học</h2>
    <div class="reg-grid">
      <div class="price-card" data-rough="ink" data-rough-r="14" data-rough-w="1.8">
        <p class="price-head">${esc(cfg.khoaHoc.ten).toUpperCase()}</p>
        <p class="price"><span class="price-num">${formatVnd(cfg.khoaHoc.hocPhi)}</span> <span class="price-unit">${esc(cfg.khoaHoc.donViGia)}</span></p>
        <ul class="benefits">${benefits}</ul>
      </div>
      <form class="reg-form" id="reg-form" novalidate>
        <div class="field">
          <label for="f-name">Họ và tên <span class="req" aria-hidden="true">*</span></label>
          <input id="f-name" name="hoTen" type="text" autocomplete="name" required minlength="2" maxlength="80" aria-describedby="e-name">
          <p class="err" id="e-name" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="f-year">Năm sinh <span class="req" aria-hidden="true">*</span></label>
          <input id="f-year" name="namSinh" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="bday-year" required placeholder="Ví dụ: 1990" data-min="1940" data-max="${year - 16}" aria-describedby="e-year">
          <p class="err" id="e-year" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="f-email">Email <span class="req" aria-hidden="true">*</span></label>
          <input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="120" aria-describedby="e-email">
          <p class="err" id="e-email" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="f-phone">Số điện thoại (Zalo) <span class="req" aria-hidden="true">*</span></label>
          <input id="f-phone" name="sdt" type="tel" inputmode="tel" autocomplete="tel" required maxlength="16" placeholder="Ví dụ: 0912 345 678" aria-describedby="e-phone">
          <p class="err" id="e-phone" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="f-source">Bạn biết đến khoá học qua đâu? <span class="req" aria-hidden="true">*</span></label>
          <div class="select-wrap"><select id="f-source" name="bietDenQua" required aria-describedby="e-source">
            <option value="">— Chọn một mục —</option>${options}
          </select></div>
          <p class="err" id="e-source" aria-live="polite"></p>
        </div>
        <div class="hp" aria-hidden="true"><label for="f-web">Website</label><input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="field field-check">
          <label class="check">
            <input id="f-agree" name="dongY" type="checkbox" required aria-describedby="e-agree">
            <span class="box" aria-hidden="true"></span>
            <span>Tôi đồng ý để ${esc(cfg.site.thuongHieu)} lưu và sử dụng thông tin trên để liên hệ tư vấn khoá học, theo <a href="/chinh-sach-bao-ve-du-lieu/" data-privacy>Chính sách bảo vệ dữ liệu cá nhân</a>.</span>
          </label>
          <p class="err" id="e-agree" aria-live="polite"></p>
        </div>
        <button class="btn btn-primary btn-block" type="submit" data-submit>Gửi đăng ký</button>
        <p class="form-msg" data-form-msg role="alert" hidden></p>
        <p class="form-foot">Sau khi nhận đăng ký, tôi sẽ liên hệ bạn qua Zalo để xác nhận lịch học.</p>
      </form>
    </div>
  </div>
</section>`;
}

export function disclaimerText(cfg) {
  return `<p><strong>Miễn trừ trách nhiệm.</strong> Nội dung trên trang này và trong khoá học chỉ nhằm mục đích giáo dục, chia sẻ phương pháp và kinh nghiệm cá nhân; không phải khuyến nghị mua, bán hay nắm giữ bất kỳ chứng khoán nào. Các kết quả đầu tư được trình bày là kết quả trong quá khứ của cá nhân người giảng dạy, không đảm bảo cho kết quả tương lai và không phải cam kết lợi nhuận đối với học viên. Đầu tư chứng khoán luôn có rủi ro, kể cả rủi ro mất vốn; mỗi người tự chịu trách nhiệm với quyết định đầu tư của mình. ${esc(cfg.site.thuongHieu)} không nhận quản lý tài khoản hay uỷ thác đầu tư.</p>`;
}

function footer(ctx, { withDisclaimer = true } = {}) {
  const { cfg } = ctx;
  return `<footer class="site-footer">
  <div class="container">
    ${withDisclaimer ? `<div class="disclaimer">${disclaimerText(cfg)}</div>` : ''}
    <div class="foot-row">
      <a class="foot-logo" href="/">${logo(ctx, 'logo-sm')}</a>
      <nav class="foot-links" aria-label="Liên kết chân trang">
        <a href="${esc(cfg.lienHe.zalo)}" target="_blank" rel="noopener" data-zalo>Zalo</a>
        <a href="${esc(cfg.lienHe.tiktok)}" target="_blank" rel="noopener">Kênh TikTok</a>
        <a href="/chinh-sach-bao-ve-du-lieu/" data-privacy>Chính sách bảo vệ dữ liệu cá nhân</a>
      </nav>
      <p class="copy">© ${cfg.site.namBanQuyen} ${esc(cfg.site.thuongHieu)}</p>
    </div>
  </div>
</footer>`;
}

function floating(ctx) {
  const { cfg } = ctx;
  return `<a class="zalo-float" href="${esc(cfg.lienHe.zalo)}" target="_blank" rel="noopener" data-zalo aria-label="Nhắn Zalo">${icons.zalo()}</a>
<div class="sticky-bar" data-sticky-bar>
  <p class="sticky-info"><strong>${formatVnd(cfg.khoaHoc.hocPhi)}</strong>${esc(cfg.khoaHoc.tomTatThanhDangKy)}</p>
  ${ctaButton('Đăng ký ngay', 'btn-sm')}
</div>`;
}

function modals() {
  return `<div class="overlay" data-video-modal hidden role="dialog" aria-modal="true" aria-label="Video danh mục">
  <button type="button" class="overlay-close" data-close aria-label="Đóng">${icons.close()}</button>
  <div class="video-box" data-video-box></div>
</div>
<div class="overlay" data-lightbox hidden role="dialog" aria-modal="true" aria-label="Xem ảnh phóng to">
  <button type="button" class="overlay-close" data-close aria-label="Đóng">${icons.close()}</button>
  <button type="button" class="lb-nav lb-prev" data-prev aria-label="Ảnh trước">${icons.chevron('left')}</button>
  <figure class="lb-figure"><img data-lb-img alt=""><figcaption data-lb-cap></figcaption></figure>
  <button type="button" class="lb-nav lb-next" data-next aria-label="Ảnh tiếp theo">${icons.chevron('right')}</button>
</div>`;
}

// ---------------- Chính sách dữ liệu ----------------
export function privacyContent(cfg) {
  const b = esc(cfg.site.thuongHieu);
  return `<h2>Chính sách bảo vệ dữ liệu cá nhân</h2>
<p class="muted">Áp dụng theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</p>
<h3>1. Chúng tôi thu thập gì</h3>
<p>Khi bạn đăng ký khoá học: họ và tên, năm sinh, email, số điện thoại (Zalo), nguồn bạn biết đến khoá học. Kèm theo đó là thông tin kỹ thuật không định danh: loại thiết bị (điện thoại/máy tính) và mã chiến dịch quảng cáo trên đường link (nếu có).</p>
<h3>2. Để làm gì</h3>
<p>Chỉ để liên hệ tư vấn, xác nhận lịch học và hỗ trợ bạn trong khoá học. ${b} không bán, không cho thuê và không chia sẻ dữ liệu của bạn cho bên thứ ba vì mục đích thương mại.</p>
<h3>3. Lưu ở đâu</h3>
<p>Dữ liệu được lưu trong một bảng tính Google Sheet riêng tư thuộc sở hữu của ${b}, không chia sẻ công khai. Chỉ người phụ trách tư vấn khoá học được truy cập.</p>
<h3>4. Lưu bao lâu</h3>
<p>Tối đa 24 tháng kể từ ngày bạn đăng ký, hoặc đến khi bạn yêu cầu xoá — tuỳ điều kiện nào đến trước.</p>
<h3>5. Quyền của bạn</h3>
<p>Bạn có quyền xem, sửa hoặc yêu cầu xoá dữ liệu của mình, và rút lại sự đồng ý bất kỳ lúc nào. Chỉ cần nhắn Zalo cho chúng tôi: <a href="${esc(cfg.lienHe.zalo)}" target="_blank" rel="noopener">${esc(cfg.lienHe.zalo)}</a>. Chúng tôi xử lý yêu cầu trong vòng 72 giờ.</p>
<h3>6. Công cụ đo lường</h3>
<p>Trang có thể dùng công cụ đo lường quảng cáo (TikTok, Facebook, Google Analytics) để biết số người truy cập và hiệu quả quảng cáo. Họ tên, số điện thoại và email của bạn không được gửi tới các công cụ này.</p>`;
}

function privacyDialog(ctx) {
  return `<dialog class="privacy-dialog" data-privacy-dialog aria-labelledby="pv-title">
  <div class="privacy-body" id="pv-title">${privacyContent(ctx.cfg)}</div>
  <form method="dialog"><button class="btn btn-primary" value="close">Đã hiểu</button></form>
</dialog>`;
}

export function privacyPage(ctx) {
  const body = `${simpleHeader(ctx)}
<main class="container page-narrow privacy-page">${privacyContent(ctx.cfg)}
<p><a class="btn btn-ghost" href="/">← Quay lại trang chủ</a></p></main>
${footer(ctx, { withDisclaimer: false })}`;
  return layout(ctx, {
    title: `Chính sách bảo vệ dữ liệu cá nhân — ${ctx.cfg.site.thuongHieu}`,
    description: 'Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin đăng ký khoá học của bạn.',
    path: '/chinh-sach-bao-ve-du-lieu/',
    body,
    scripts: `<script type="module" src="${ctx.assets.mainJs}"></script>`,
  });
}

function simpleHeader(ctx) {
  return `<header class="site-header is-static"><div class="container header-inner"><a class="brand" href="/">${logo(ctx)}</a></div></header>`;
}

// ---------------- Trang cảm ơn ----------------
export function thanksPage(ctx) {
  const { cfg } = ctx;
  const body = `${simpleHeader(ctx)}
<main class="container page-narrow thanks">
  <div class="thanks-card">
    <div class="thanks-flag">${icons.finishFlag()}</div>
    <h1 class="section-title">Đăng ký ${hl('thành công!')}</h1>
    <p class="lead" data-thanks-msg>Cảm ơn bạn. Tôi sẽ nhắn Zalo cho bạn qua số điện thoại bạn đã để lại để xác nhận lịch học. Muốn trao đổi ngay? Nhắn cho tôi trước nhé.</p>
    <a class="btn btn-primary btn-lg btn-block" href="${esc(cfg.lienHe.zalo)}" target="_blank" rel="noopener" data-zalo>Nhắn Zalo ngay</a>
    <div class="thanks-links">
      <a class="btn btn-ghost" href="${esc(cfg.lienHe.tiktok)}" target="_blank" rel="noopener">${icons.tiktok()} Xem kênh TikTok</a>
      <a class="btn btn-ghost" href="/">Quay lại trang chủ</a>
    </div>
  </div>
</main>
${footer(ctx, { withDisclaimer: false })}`;
  return layout(ctx, {
    title: `Đăng ký thành công — ${cfg.site.thuongHieu}`,
    description: cfg.seo.moTa,
    path: '/cam-on/',
    body,
    noindex: true,
    scripts: `<script type="module" src="${ctx.assets.thanksJs}"></script>`,
    bodyClass: 'page-thanks',
  });
}

export function notFoundPage(ctx) {
  const body = `${simpleHeader(ctx)}
<main class="container page-narrow thanks"><div class="thanks-card">
<h1 class="section-title">Không tìm thấy trang</h1><p class="lead">Trang bạn tìm không tồn tại hoặc đã được chuyển.</p>
<a class="btn btn-primary" href="/">Về trang chủ</a></div></main>`;
  return layout(ctx, { title: `Không tìm thấy trang — ${ctx.cfg.site.thuongHieu}`, description: ctx.cfg.seo.moTa, path: '/404', body, noindex: true, scripts: `<script type="module" src="${ctx.assets.mainJs}"></script>` });
}
