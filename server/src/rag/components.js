/**
 * KHO COMPONENT UI cho Code RAG — "DESIGN SYSTEM của DBEE".
 *
 * MỤC TIÊU: mọi trang sinh ra đều mang CÙNG MỘT NHẬN DIỆN (vibe) của công ty DBEE.
 * Vì vậy TẤT CẢ component ở đây dùng chung:
 *   - Bảng màu: vàng thương hiệu #f2db45 (+#d4bf3a hover), chữ #1f2937, nền trắng + #fffdf3.
 *   - Font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif.
 *   - Bo góc ~12px, nút "viên thuốc" vàng chữ đậm, section thoáng.
 *   - QUY ƯỚC CLASS THỐNG NHẤT có tiền tố `dbee-` (dbee-btn, dbee-section, dbee-h2, dbee-card…)
 *     → khi nhiều component cùng xuất hiện trên 1 trang, chúng ăn khớp; khi 2 trang khác nhau
 *       cùng tái sử dụng → trùng class cao → nhìn như cùng một website.
 *
 * Các component để GENERIC (không gắn brand) nên LUÔN được truy xuất cho mọi prompt
 * → đảm bảo "lúc nào cũng cùng vibe DBEE". (Chọn brand DBEE ở UI sẽ bổ sung logo + nhấn màu.)
 *
 * Mỗi entry: { id, name, description (giàu từ khóa Việt+Anh — dùng để embed), tags, code }
 */

export const components = [
  {
    id: 'dbee-navbar',
    name: 'DBEE Navbar',
    description:
      'Thanh điều hướng DBEE: logo chữ vàng, menu, nút Đăng ký. Header navigation bar, menu, sign up button, DBEE brand.',
    tags: ['navbar', 'header', 'navigation'],
    code: `<header class="dbee-nav">
  <a class="dbee-nav__logo" href="#">DBEE</a>
  <nav class="dbee-nav__menu">
    <a href="#courses">Khóa học</a><a href="#schedule">Lịch khai giảng</a><a href="#about">Về DBEE</a><a href="#contact">Liên hệ</a>
  </nav>
  <a class="dbee-btn" href="#register">Đăng ký</a>
</header>
<style>
.dbee-nav{display:flex;align-items:center;gap:28px;padding:16px 40px;background:#fff;border-bottom:1px solid #eee7cf;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:sticky;top:0;z-index:50}
.dbee-nav__logo{font-weight:900;font-size:24px;letter-spacing:.5px;color:#1f2937;text-decoration:none}
.dbee-nav__menu{display:flex;gap:24px;margin-left:auto}
.dbee-nav__menu a{color:#374151;text-decoration:none;font-weight:600;font-size:15px}
.dbee-nav__menu a:hover{color:#bda01f}
.dbee-btn{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;padding:10px 22px;border-radius:999px;text-decoration:none;border:0;cursor:pointer}
.dbee-btn:hover{background:#d4bf3a}
</style>`,
  },
  {
    id: 'dbee-hero',
    name: 'DBEE Hero tuyển sinh',
    description:
      'Khu hero trang chủ DBEE: tiêu đề lớn, mô tả, nút Đăng ký học và Xem lộ trình, nền kem. Hero landing headline CTA admissions.',
    tags: ['hero', 'landing', 'cta'],
    code: `<section class="dbee-hero">
  <div class="dbee-hero__inner">
    <span class="dbee-tag">Trung tâm lập trình DBEE</span>
    <h1 class="dbee-hero__title">Học lập trình thực chiến, đi làm thật</h1>
    <p class="dbee-hero__sub">Lộ trình bài bản, mentor kèm sát, dự án thực tế. Cam kết đầu ra.</p>
    <div class="dbee-hero__cta">
      <a class="dbee-btn" href="#register">Đăng ký học</a>
      <a class="dbee-btn dbee-btn--ghost" href="#roadmap">Xem lộ trình</a>
    </div>
  </div>
</section>
<style>
.dbee-hero{background:linear-gradient(180deg,#fffdf3,#fff);padding:96px 24px;text-align:center;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-hero__inner{max-width:760px;margin:0 auto}
.dbee-tag{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;font-size:13px;padding:6px 14px;border-radius:999px;margin-bottom:18px}
.dbee-hero__title{font-size:46px;line-height:1.12;color:#1f2937;margin:0 0 16px}
.dbee-hero__sub{font-size:19px;color:#6b7280;margin:0 0 30px}
.dbee-hero__cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.dbee-btn{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;padding:13px 30px;border-radius:999px;text-decoration:none;border:0;cursor:pointer}
.dbee-btn:hover{background:#d4bf3a}
.dbee-btn--ghost{background:#fff;border:1.5px solid #1f2937}
</style>`,
  },
  {
    id: 'dbee-courses',
    name: 'DBEE Lưới khóa học',
    description:
      'Danh sách khóa học của DBEE dạng thẻ: tên khóa, thời lượng, mô tả, nút xem. Courses list grid cards, programs, learn to code.',
    tags: ['courses', 'grid', 'cards'],
    code: `<section class="dbee-section" id="courses">
  <h2 class="dbee-h2">Khóa học nổi bật</h2>
  <div class="dbee-grid">
    <article class="dbee-card"><div class="dbee-card__badge">Cơ bản</div><h3>Lập trình Web</h3><p>HTML, CSS, JS từ số 0 đến làm được sản phẩm.</p><span class="dbee-card__meta">3 tháng</span></article>
    <article class="dbee-card"><div class="dbee-card__badge">Nâng cao</div><h3>ReactJS</h3><p>Xây ứng dụng thực tế với React và API.</p><span class="dbee-card__meta">2 tháng</span></article>
    <article class="dbee-card"><div class="dbee-card__badge">Backend</div><h3>Node.js</h3><p>API, cơ sở dữ liệu, triển khai server.</p><span class="dbee-card__meta">2.5 tháng</span></article>
  </div>
</section>
<style>
.dbee-section{max-width:1080px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.dbee-card{border:1px solid #eee7cf;border-radius:14px;padding:26px;background:#fff}
.dbee-card__badge{display:inline-block;background:#fffdf3;border:1px solid #f2db45;color:#bda01f;font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:12px}
.dbee-card h3{margin:0 0 8px;color:#1f2937}
.dbee-card p{color:#6b7280;margin:0 0 14px}
.dbee-card__meta{color:#bda01f;font-weight:700;font-size:14px}
</style>`,
  },
  {
    id: 'dbee-schedule',
    name: 'DBEE Lịch khai giảng',
    description:
      'Bảng lịch khai giảng các khóa của DBEE: khóa học, ngày khai giảng, lịch học, nút đăng ký. Schedule table opening dates class times enroll.',
    tags: ['schedule', 'table', 'list'],
    code: `<section class="dbee-section" id="schedule">
  <h2 class="dbee-h2">Lịch khai giảng</h2>
  <table class="dbee-table">
    <thead><tr><th>Khóa học</th><th>Khai giảng</th><th>Lịch học</th><th></th></tr></thead>
    <tbody>
      <tr><td>Lập trình Web</td><td>05/07/2026</td><td>T3-T5-T7 (18h30)</td><td><a class="dbee-btn" href="#register">Đăng ký</a></td></tr>
      <tr><td>ReactJS</td><td>12/07/2026</td><td>T2-T4-T6 (19h00)</td><td><a class="dbee-btn" href="#register">Đăng ký</a></td></tr>
      <tr><td>Node.js</td><td>20/07/2026</td><td>T7-CN (9h00)</td><td><a class="dbee-btn" href="#register">Đăng ký</a></td></tr>
    </tbody>
  </table>
</section>
<style>
.dbee-section{max-width:1000px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee7cf;border-radius:14px;overflow:hidden}
.dbee-table th{background:#fffdf3;text-align:left;padding:14px 18px;color:#1f2937;border-bottom:2px solid #f2db45;font-size:14px}
.dbee-table td{padding:14px 18px;border-bottom:1px solid #f3eeda;color:#374151}
.dbee-btn{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;padding:8px 18px;border-radius:999px;text-decoration:none}
.dbee-btn:hover{background:#d4bf3a}
</style>`,
  },
  {
    id: 'dbee-roadmap',
    name: 'DBEE Lộ trình học',
    description:
      'Lộ trình học theo các bước được đánh số tại DBEE. Learning roadmap steps process from beginner to job-ready.',
    tags: ['roadmap', 'steps', 'process'],
    code: `<section class="dbee-section" id="roadmap">
  <h2 class="dbee-h2">Lộ trình học</h2>
  <div class="dbee-steps">
    <div class="dbee-step"><div class="dbee-step__n">1</div><h3>Nền tảng</h3><p>Tư duy lập trình, HTML/CSS/JS.</p></div>
    <div class="dbee-step"><div class="dbee-step__n">2</div><h3>Chuyên sâu</h3><p>Framework, API, cơ sở dữ liệu.</p></div>
    <div class="dbee-step"><div class="dbee-step__n">3</div><h3>Dự án</h3><p>Làm sản phẩm thực tế theo nhóm.</p></div>
    <div class="dbee-step"><div class="dbee-step__n">4</div><h3>Việc làm</h3><p>Luyện phỏng vấn, kết nối doanh nghiệp.</p></div>
  </div>
</section>
<style>
.dbee-section{max-width:1080px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}
.dbee-step{text-align:center}
.dbee-step__n{width:48px;height:48px;border-radius:50%;background:#f2db45;color:#1f2937;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.dbee-step h3{margin:0 0 6px;color:#1f2937}
.dbee-step p{color:#6b7280;margin:0}
</style>`,
  },
  {
    id: 'dbee-features',
    name: 'DBEE Vì sao chọn',
    description:
      'Khối lý do chọn DBEE dạng 3 cột có biểu tượng. Why choose us features benefits, mentor, cam kết đầu ra.',
    tags: ['features', 'grid', 'benefits'],
    code: `<section class="dbee-section">
  <h2 class="dbee-h2">Vì sao chọn DBEE</h2>
  <div class="dbee-grid">
    <div class="dbee-feature"><div class="dbee-feature__ic">👨‍🏫</div><h3>Mentor kèm sát</h3><p>Học viên được hỗ trợ 1-1 xuyên suốt.</p></div>
    <div class="dbee-feature"><div class="dbee-feature__ic">💼</div><h3>Cam kết đầu ra</h3><p>Hỗ trợ việc làm sau tốt nghiệp.</p></div>
    <div class="dbee-feature"><div class="dbee-feature__ic">🛠️</div><h3>Dự án thực tế</h3><p>Làm sản phẩm như đi làm thật.</p></div>
  </div>
</section>
<style>
.dbee-section{max-width:1080px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}
.dbee-feature{background:#fffdf3;border:1px solid #eee7cf;border-radius:14px;padding:28px;text-align:center}
.dbee-feature__ic{font-size:36px;margin-bottom:12px}
.dbee-feature h3{margin:0 0 8px;color:#1f2937}
.dbee-feature p{color:#6b7280;margin:0}
</style>`,
  },
  {
    id: 'dbee-stats',
    name: 'DBEE Số liệu',
    description:
      'Dải số liệu thành tích của DBEE: học viên, tỉ lệ có việc, đối tác. Stats numbers achievements students placement.',
    tags: ['stats', 'metrics'],
    code: `<section class="dbee-stats">
  <div class="dbee-stat"><div class="dbee-stat__num">5.000+</div><div class="dbee-stat__lbl">Học viên</div></div>
  <div class="dbee-stat"><div class="dbee-stat__num">92%</div><div class="dbee-stat__lbl">Có việc sau khóa</div></div>
  <div class="dbee-stat"><div class="dbee-stat__num">50+</div><div class="dbee-stat__lbl">Doanh nghiệp đối tác</div></div>
  <div class="dbee-stat"><div class="dbee-stat__num">4.9★</div><div class="dbee-stat__lbl">Đánh giá</div></div>
</section>
<style>
.dbee-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:48px;padding:56px 24px;background:#1f2937;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-stat{text-align:center}
.dbee-stat__num{font-size:38px;font-weight:900;color:#f2db45}
.dbee-stat__lbl{color:#cbd5e1;margin-top:4px}
</style>`,
  },
  {
    id: 'dbee-instructors',
    name: 'DBEE Đội ngũ giảng viên',
    description:
      'Giới thiệu giảng viên DBEE dạng lưới có ảnh, tên, chức danh. Instructors teachers team grid mentors.',
    tags: ['instructors', 'team', 'grid'],
    code: `<section class="dbee-section">
  <h2 class="dbee-h2">Đội ngũ giảng viên</h2>
  <div class="dbee-grid">
    <div class="dbee-person"><img src="https://placehold.co/120" alt=""><h3>Lê Đình Hiếu</h3><p>Founder · 10 năm kinh nghiệm</p></div>
    <div class="dbee-person"><img src="https://placehold.co/120" alt=""><h3>Trần Nam</h3><p>Senior Frontend</p></div>
    <div class="dbee-person"><img src="https://placehold.co/120" alt=""><h3>Phạm Lan</h3><p>Backend Lead</p></div>
  </div>
</section>
<style>
.dbee-section{max-width:980px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;text-align:center}
.dbee-person img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #f2db45}
.dbee-person h3{margin:14px 0 2px;color:#1f2937}
.dbee-person p{color:#6b7280;margin:0;font-size:14px}
</style>`,
  },
  {
    id: 'dbee-testimonials',
    name: 'DBEE Cảm nhận học viên',
    description:
      'Lời chứng thực của học viên DBEE dạng thẻ có avatar. Testimonials student reviews quotes social proof.',
    tags: ['testimonial', 'reviews', 'social-proof'],
    code: `<section class="dbee-section" style="background:#fffdf3">
  <h2 class="dbee-h2">Học viên nói gì</h2>
  <div class="dbee-grid">
    <figure class="dbee-quote"><blockquote>"Học xong mình đi làm fresher ngay, mentor hỗ trợ cực nhiệt tình."</blockquote><figcaption><img src="https://placehold.co/44" alt="">Minh Anh</figcaption></figure>
    <figure class="dbee-quote"><blockquote>"Lộ trình rõ ràng, dự án thực tế giúp mình tự tin phỏng vấn."</blockquote><figcaption><img src="https://placehold.co/44" alt="">Quốc Bảo</figcaption></figure>
  </div>
</section>
<style>
.dbee-section{max-width:980px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.dbee-quote{background:#fff;border:1px solid #eee7cf;border-radius:14px;padding:26px;margin:0}
.dbee-quote blockquote{margin:0 0 16px;color:#374151;line-height:1.6}
.dbee-quote figcaption{display:flex;align-items:center;gap:10px;font-weight:700;color:#1f2937}
.dbee-quote img{border-radius:50%}
</style>`,
  },
  {
    id: 'dbee-pricing',
    name: 'DBEE Học phí',
    description:
      'Bảng học phí các gói khóa học DBEE, gói giữa nổi bật. Pricing tuition plans tiers course fee.',
    tags: ['pricing', 'plans'],
    code: `<section class="dbee-section">
  <h2 class="dbee-h2">Học phí</h2>
  <div class="dbee-grid">
    <div class="dbee-price"><h3>Lẻ khóa</h3><div class="dbee-price__amt">5.900k</div><p>Một khóa bất kỳ</p><a class="dbee-btn dbee-btn--ghost" href="#register">Chọn</a></div>
    <div class="dbee-price dbee-price--hot"><span class="dbee-price__tag">Phổ biến</span><h3>Combo Web</h3><div class="dbee-price__amt">12.900k</div><p>3 khóa lộ trình full-stack</p><a class="dbee-btn" href="#register">Chọn</a></div>
    <div class="dbee-price"><h3>Doanh nghiệp</h3><div class="dbee-price__amt">Liên hệ</div><p>Đào tạo theo yêu cầu</p><a class="dbee-btn dbee-btn--ghost" href="#contact">Liên hệ</a></div>
  </div>
</section>
<style>
.dbee-section{max-width:1000px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}
.dbee-price{border:1px solid #eee7cf;border-radius:16px;padding:30px 24px;text-align:center;position:relative;background:#fff}
.dbee-price--hot{border-color:#f2db45;box-shadow:0 12px 30px rgba(242,219,69,.25)}
.dbee-price__tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#f2db45;color:#1f2937;font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px}
.dbee-price__amt{font-size:34px;font-weight:900;color:#1f2937;margin:12px 0}
.dbee-price p{color:#6b7280;margin:0 0 16px}
.dbee-btn{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;padding:11px 24px;border-radius:999px;text-decoration:none;border:0}
.dbee-btn--ghost{background:#fff;border:1.5px solid #1f2937}
</style>`,
  },
  {
    id: 'dbee-faq',
    name: 'DBEE Câu hỏi thường gặp',
    description:
      'FAQ của DBEE dạng đóng/mở. Frequently asked questions accordion về học phí, đầu ra, lịch học.',
    tags: ['faq', 'accordion'],
    code: `<section class="dbee-section" style="max-width:720px">
  <h2 class="dbee-h2">Câu hỏi thường gặp</h2>
  <details class="dbee-faq"><summary>Chưa biết gì có học được không?</summary><p>Được. Lộ trình bắt đầu từ số 0.</p></details>
  <details class="dbee-faq"><summary>Học phí đóng thế nào?</summary><p>Có thể đóng theo từng khóa hoặc trả góp.</p></details>
  <details class="dbee-faq"><summary>Có hỗ trợ việc làm không?</summary><p>Có, DBEE kết nối doanh nghiệp đối tác.</p></details>
</section>
<style>
.dbee-section{margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 32px}
.dbee-faq{border:1px solid #eee7cf;border-radius:12px;padding:16px 18px;margin-bottom:12px;background:#fff}
.dbee-faq summary{font-weight:700;color:#1f2937;cursor:pointer}
.dbee-faq p{color:#6b7280;margin:12px 0 0}
</style>`,
  },
  {
    id: 'dbee-cta',
    name: 'DBEE Banner đăng ký',
    description:
      'Dải kêu gọi đăng ký tư vấn của DBEE, nền vàng. Call to action banner register free consultation.',
    tags: ['cta', 'banner'],
    code: `<section class="dbee-cta" id="register">
  <h2>Sẵn sàng bắt đầu sự nghiệp lập trình?</h2>
  <p>Để lại thông tin, DBEE tư vấn lộ trình miễn phí cho bạn.</p>
  <a class="dbee-btn dbee-btn--dark" href="#contact">Đăng ký tư vấn</a>
</section>
<style>
.dbee-cta{background:#f2db45;text-align:center;padding:64px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-cta h2{font-size:32px;color:#1f2937;margin:0 0 10px}
.dbee-cta p{color:#5b5320;margin:0 0 24px}
.dbee-btn{display:inline-block;font-weight:700;padding:14px 32px;border-radius:999px;text-decoration:none}
.dbee-btn--dark{background:#1f2937;color:#fff}
.dbee-btn--dark:hover{background:#111}
</style>`,
  },
  {
    id: 'dbee-register-form',
    name: 'DBEE Form đăng ký/tư vấn',
    description:
      'Biểu mẫu đăng ký tư vấn DBEE: họ tên, sđt, khóa quan tâm. Registration consultation contact form name phone course.',
    tags: ['form', 'contact', 'register'],
    code: `<section class="dbee-section" id="contact" style="max-width:520px">
  <h2 class="dbee-h2">Đăng ký tư vấn</h2>
  <form class="dbee-form" onsubmit="event.preventDefault();alert('Đã gửi! DBEE sẽ liên hệ bạn.')">
    <input type="text" placeholder="Họ và tên" required>
    <input type="tel" placeholder="Số điện thoại" required>
    <select required><option value="">Khóa quan tâm</option><option>Lập trình Web</option><option>ReactJS</option><option>Node.js</option></select>
    <button class="dbee-btn" type="submit">Gửi đăng ký</button>
  </form>
</section>
<style>
.dbee-section{margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:30px;color:#1f2937;text-align:center;margin:0 0 24px}
.dbee-form{display:grid;gap:14px}
.dbee-form input,.dbee-form select{padding:13px 16px;border:1px solid #e3dcc2;border-radius:10px;font-size:15px;font-family:inherit}
.dbee-btn{background:#f2db45;color:#1f2937;font-weight:700;padding:14px;border:0;border-radius:999px;cursor:pointer;font-size:16px}
.dbee-btn:hover{background:#d4bf3a}
</style>`,
  },
  {
    id: 'dbee-gallery',
    name: 'DBEE Hình ảnh lớp học',
    description:
      'Thư viện ảnh lớp học, sự kiện của DBEE dạng lưới. Gallery photos classroom campus images grid.',
    tags: ['gallery', 'images'],
    code: `<section class="dbee-section">
  <h2 class="dbee-h2">Hình ảnh tại DBEE</h2>
  <div class="dbee-gallery">
    <img src="https://placehold.co/300x220" alt=""><img src="https://placehold.co/300x220" alt="">
    <img src="https://placehold.co/300x220" alt=""><img src="https://placehold.co/300x220" alt="">
  </div>
</section>
<style>
.dbee-section{max-width:1000px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-h2{font-size:32px;color:#1f2937;text-align:center;margin:0 0 32px}
.dbee-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.dbee-gallery img{width:100%;border-radius:12px;display:block;border:1px solid #eee7cf}
</style>`,
  },
  {
    id: 'dbee-about',
    name: 'DBEE Giới thiệu',
    description:
      'Khối giới thiệu trung tâm DBEE: ảnh + văn bản hai cột. About us company story DBEE introduction.',
    tags: ['about', 'split'],
    code: `<section class="dbee-about" id="about">
  <img class="dbee-about__img" src="https://placehold.co/440x320" alt="">
  <div class="dbee-about__txt">
    <h2 class="dbee-h2" style="text-align:left">Về DBEE</h2>
    <p>DBEE là trung tâm đào tạo lập trình thực chiến, đồng hành cùng học viên từ nền tảng đến khi đi làm, với phương châm "học thật – làm thật".</p>
    <a class="dbee-btn" href="#courses">Khám phá khóa học</a>
  </div>
</section>
<style>
.dbee-about{display:flex;gap:48px;align-items:center;flex-wrap:wrap;max-width:1040px;margin:0 auto;padding:72px 24px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-about__img{flex:1 1 320px;width:100%;border-radius:16px}
.dbee-about__txt{flex:1 1 320px}
.dbee-h2{font-size:32px;color:#1f2937;margin:0 0 14px}
.dbee-about__txt p{color:#6b7280;font-size:17px;line-height:1.7;margin:0 0 20px}
.dbee-btn{display:inline-block;background:#f2db45;color:#1f2937;font-weight:700;padding:12px 26px;border-radius:999px;text-decoration:none}
</style>`,
  },
  {
    id: 'dbee-footer',
    name: 'DBEE Footer',
    description:
      'Chân trang DBEE nhiều cột: liên hệ, khóa học, mạng xã hội, bản quyền. Footer columns contact social copyright.',
    tags: ['footer'],
    code: `<footer class="dbee-footer">
  <div class="dbee-footer__cols">
    <div><div class="dbee-footer__brand">DBEE</div><p>Trung tâm lập trình thực chiến.</p></div>
    <div><h4>Khóa học</h4><a href="#">Lập trình Web</a><a href="#">ReactJS</a><a href="#">Node.js</a></div>
    <div><h4>Liên hệ</h4><a href="#">0830 000 380</a><a href="#">hello@dbee.vn</a></div>
  </div>
  <small>© 2026 DBEE. Học thật – Làm thật.</small>
</footer>
<style>
.dbee-footer{background:#1f2937;color:#cbd5e1;padding:56px 32px 28px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dbee-footer__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px;max-width:1000px;margin:0 auto}
.dbee-footer__brand{font-weight:900;font-size:22px;color:#f2db45;margin-bottom:8px}
.dbee-footer h4{color:#fff;margin:0 0 12px;font-size:15px}
.dbee-footer a{display:block;color:#9ca3af;text-decoration:none;font-size:14px;margin-bottom:8px}
.dbee-footer a:hover{color:#f2db45}
.dbee-footer small{display:block;text-align:center;margin-top:36px;color:#6b7280}
</style>`,
  },
];

/** Văn bản dùng để embed 1 component (gộp tên + mô tả + tags để truy xuất tốt hơn). */
export function buildEmbedText(c) {
  return `${c.name}. ${c.description}. tags: ${(c.tags || []).join(', ')}`;
}
