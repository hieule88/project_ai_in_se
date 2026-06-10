/**
 * KHO COMPONENT UI cho Code RAG (Bước 3).
 *
 * Mỗi component = 1 snippet HTML/CSS THUẦN, tự chứa (CSS trong <style>, class có tiền tố
 * riêng để không đụng nhau). Đây là tri thức được truy xuất top-k và nhồi vào prompt
 * của Code Agent để model TÁI SỬ DỤNG đúng phong cách.
 *
 * Mỗi entry:
 *   id          duy nhất (dùng làm khóa trong vector store)
 *   name        tên ngắn gọn
 *   description mô tả giàu từ khóa (Việt + Anh) — text này được EMBED để truy xuất
 *   tags        nhãn phân loại
 *   brand       (tùy chọn) gắn brand để cá nhân hóa ở Bước 7; '' = dùng chung
 *   code        snippet HTML
 *
 * Văn bản đem đi embed = `${name}. ${description}. tags: ${tags}` (xem buildEmbedText).
 */

export const components = [
  {
    id: 'navbar-simple',
    name: 'Navbar đơn giản',
    description:
      'Thanh điều hướng header đơn giản gồm logo bên trái và các liên kết menu bên phải. Navigation bar, header, menu, logo, links.',
    tags: ['navbar', 'header', 'navigation'],
    code: `<header class="nav-s">
  <a class="nav-s__logo" href="#">Brand</a>
  <nav class="nav-s__links">
    <a href="#features">Tính năng</a>
    <a href="#pricing">Bảng giá</a>
    <a href="#contact">Liên hệ</a>
  </nav>
</header>
<style>
.nav-s{display:flex;justify-content:space-between;align-items:center;padding:16px 32px;border-bottom:1px solid #eee;font-family:system-ui,sans-serif}
.nav-s__logo{font-weight:700;font-size:20px;text-decoration:none;color:#111}
.nav-s__links a{margin-left:24px;text-decoration:none;color:#555;font-size:15px}
.nav-s__links a:hover{color:#111}
</style>`,
  },
  {
    id: 'navbar-cta',
    name: 'Navbar có nút CTA',
    description:
      'Thanh điều hướng có logo, menu giữa và nút kêu gọi hành động (Đăng ký / Bắt đầu) bên phải. Navbar with call to action button, sign up.',
    tags: ['navbar', 'header', 'cta'],
    code: `<header class="nav-c">
  <a class="nav-c__logo" href="#">◆ Brand</a>
  <nav class="nav-c__links">
    <a href="#">Sản phẩm</a><a href="#">Giải pháp</a><a href="#">Giá</a>
  </nav>
  <a class="nav-c__btn" href="#">Bắt đầu</a>
</header>
<style>
.nav-c{display:flex;align-items:center;gap:32px;padding:14px 32px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06);font-family:system-ui,sans-serif}
.nav-c__logo{font-weight:700;color:#4f46e5;text-decoration:none;font-size:19px}
.nav-c__links{display:flex;gap:24px;margin-left:auto}
.nav-c__links a{color:#444;text-decoration:none;font-size:15px}
.nav-c__btn{background:#4f46e5;color:#fff;padding:9px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}
</style>`,
  },
  {
    id: 'hero-centered',
    name: 'Hero canh giữa',
    description:
      'Khu vực hero canh giữa với tiêu đề lớn, đoạn mô tả phụ và nút hành động. Centered hero section, headline, subtitle, primary button.',
    tags: ['hero', 'landing', 'cta'],
    code: `<section class="hero-c">
  <h1 class="hero-c__title">Tiêu đề chính thật ấn tượng</h1>
  <p class="hero-c__sub">Một câu mô tả ngắn gọn giá trị sản phẩm mang lại cho người dùng.</p>
  <div class="hero-c__actions">
    <a class="hero-c__btn" href="#">Dùng thử miễn phí</a>
    <a class="hero-c__btn hero-c__btn--ghost" href="#">Tìm hiểu thêm</a>
  </div>
</section>
<style>
.hero-c{text-align:center;padding:96px 24px;font-family:system-ui,sans-serif}
.hero-c__title{font-size:46px;max-width:680px;margin:0 auto 16px;line-height:1.15;color:#0f172a}
.hero-c__sub{color:#64748b;max-width:560px;margin:0 auto 28px;font-size:18px}
.hero-c__actions{display:flex;gap:14px;justify-content:center}
.hero-c__btn{background:#0f172a;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:600}
.hero-c__btn--ghost{background:transparent;color:#0f172a;border:1px solid #cbd5e1}
</style>`,
  },
  {
    id: 'hero-split',
    name: 'Hero chia đôi (chữ + ảnh)',
    description:
      'Hero bố cục hai cột: nội dung văn bản bên trái, hình ảnh minh họa bên phải. Split hero, two columns, text and image, responsive.',
    tags: ['hero', 'landing', 'split'],
    code: `<section class="hero-sp">
  <div class="hero-sp__text">
    <h1>Sản phẩm giúp bạn làm việc nhanh hơn</h1>
    <p>Mô tả ngắn về lợi ích chính, đủ thuyết phục người dùng nhấn nút.</p>
    <a class="hero-sp__btn" href="#">Bắt đầu ngay</a>
  </div>
  <div class="hero-sp__media"><img src="https://placehold.co/520x360" alt="minh hoạ"></div>
</section>
<style>
.hero-sp{display:flex;align-items:center;gap:48px;flex-wrap:wrap;padding:72px 32px;max-width:1100px;margin:0 auto;font-family:system-ui,sans-serif}
.hero-sp__text{flex:1 1 320px}
.hero-sp__text h1{font-size:40px;line-height:1.15;margin:0 0 16px;color:#111}
.hero-sp__text p{color:#666;font-size:18px;margin:0 0 24px}
.hero-sp__btn{background:#2563eb;color:#fff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600}
.hero-sp__media{flex:1 1 320px}
.hero-sp__media img{width:100%;border-radius:14px}
</style>`,
  },
  {
    id: 'hero-gradient',
    name: 'Hero nền gradient',
    description:
      'Hero nổi bật với nền chuyển màu gradient, tiêu đề và nút sáng. Gradient background hero, vibrant, modern landing.',
    tags: ['hero', 'gradient', 'landing'],
    code: `<section class="hero-g">
  <h1>Khởi chạy ý tưởng của bạn hôm nay</h1>
  <p>Nền gradient hiện đại tạo ấn tượng mạnh ngay từ cái nhìn đầu tiên.</p>
  <a class="hero-g__btn" href="#">Tạo tài khoản</a>
</section>
<style>
.hero-g{text-align:center;padding:110px 24px;background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);color:#fff;font-family:system-ui,sans-serif}
.hero-g h1{font-size:48px;margin:0 auto 16px;max-width:700px;line-height:1.1}
.hero-g p{font-size:18px;opacity:.92;max-width:560px;margin:0 auto 30px}
.hero-g__btn{background:#fff;color:#6d28d9;padding:14px 30px;border-radius:999px;text-decoration:none;font-weight:700}
</style>`,
  },
  {
    id: 'features-3col',
    name: 'Tính năng 3 cột',
    description:
      'Khối liệt kê 3 tính năng dạng lưới 3 cột, mỗi mục có biểu tượng, tiêu đề và mô tả. Features section, three columns, icon, grid.',
    tags: ['features', 'grid', 'section'],
    code: `<section class="feat3">
  <h2 class="feat3__h">Vì sao chọn chúng tôi</h2>
  <div class="feat3__grid">
    <div class="feat3__item"><div class="feat3__ic">⚡</div><h3>Nhanh chóng</h3><p>Tối ưu hiệu năng, tải tức thì.</p></div>
    <div class="feat3__item"><div class="feat3__ic">🔒</div><h3>An toàn</h3><p>Bảo mật dữ liệu theo chuẩn cao.</p></div>
    <div class="feat3__item"><div class="feat3__ic">💛</div><h3>Dễ dùng</h3><p>Giao diện thân thiện, trực quan.</p></div>
  </div>
</section>
<style>
.feat3{padding:72px 24px;max-width:1080px;margin:0 auto;font-family:system-ui,sans-serif;text-align:center}
.feat3__h{font-size:32px;margin:0 0 40px;color:#111}
.feat3__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px}
.feat3__item{padding:28px;border:1px solid #eee;border-radius:14px}
.feat3__ic{font-size:34px;margin-bottom:12px}
.feat3__item h3{margin:0 0 8px;color:#111}
.feat3__item p{color:#666;margin:0}
</style>`,
  },
  {
    id: 'features-iconlist',
    name: 'Danh sách tính năng có icon',
    description:
      'Danh sách tính năng dạng cột với dấu tích, phù hợp liệt kê quyền lợi. Feature list with checkmarks, benefits, bullet points.',
    tags: ['features', 'list', 'benefits'],
    code: `<section class="featl">
  <h2>Bạn nhận được gì</h2>
  <ul class="featl__list">
    <li>✔ Không giới hạn dự án</li>
    <li>✔ Hỗ trợ 24/7</li>
    <li>✔ Cập nhật miễn phí trọn đời</li>
    <li>✔ Xuất dữ liệu bất cứ lúc nào</li>
  </ul>
</section>
<style>
.featl{max-width:640px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.featl h2{font-size:30px;margin:0 0 24px;color:#111}
.featl__list{list-style:none;padding:0;margin:0;display:grid;gap:14px}
.featl__list li{font-size:17px;color:#374151;padding:12px 16px;background:#f8fafc;border-radius:10px}
</style>`,
  },
  {
    id: 'pricing-3tier',
    name: 'Bảng giá 3 gói',
    description:
      'Bảng giá so sánh ba gói dịch vụ, gói giữa được làm nổi bật. Pricing table, three plans, tiers, popular plan, subscription.',
    tags: ['pricing', 'plans', 'section'],
    code: `<section class="price">
  <h2 class="price__h">Bảng giá</h2>
  <div class="price__grid">
    <div class="price__card"><h3>Cơ bản</h3><div class="price__amt">0đ</div><p>Cho cá nhân</p><a href="#">Chọn</a></div>
    <div class="price__card price__card--hot"><span class="price__badge">Phổ biến</span><h3>Pro</h3><div class="price__amt">199k<span>/tháng</span></div><p>Cho nhóm nhỏ</p><a href="#">Chọn</a></div>
    <div class="price__card"><h3>Doanh nghiệp</h3><div class="price__amt">Liên hệ</div><p>Tùy chỉnh</p><a href="#">Chọn</a></div>
  </div>
</section>
<style>
.price{padding:72px 24px;max-width:1000px;margin:0 auto;text-align:center;font-family:system-ui,sans-serif}
.price__h{font-size:32px;margin:0 0 40px}
.price__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}
.price__card{border:1px solid #e5e7eb;border-radius:16px;padding:32px 24px;position:relative}
.price__card--hot{border-color:#4f46e5;box-shadow:0 12px 30px rgba(79,70,229,.15);transform:scale(1.04)}
.price__badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#4f46e5;color:#fff;font-size:12px;padding:4px 12px;border-radius:999px}
.price__amt{font-size:36px;font-weight:700;margin:14px 0;color:#111}
.price__amt span{font-size:14px;color:#999;font-weight:400}
.price__card a{display:inline-block;margin-top:16px;background:#111;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none}
</style>`,
  },
  {
    id: 'testimonial-cards',
    name: 'Đánh giá khách hàng (thẻ)',
    description:
      'Khối hiển thị nhiều lời chứng thực của khách hàng dạng thẻ có avatar. Testimonials, customer reviews, quotes, social proof cards.',
    tags: ['testimonial', 'reviews', 'social-proof'],
    code: `<section class="testi">
  <h2 class="testi__h">Khách hàng nói gì</h2>
  <div class="testi__grid">
    <figure class="testi__card"><blockquote>"Sản phẩm tuyệt vời, tiết kiệm rất nhiều thời gian."</blockquote><figcaption><img src="https://placehold.co/44" alt=""> An Nguyễn</figcaption></figure>
    <figure class="testi__card"><blockquote>"Giao diện đẹp, dễ dùng, hỗ trợ nhiệt tình."</blockquote><figcaption><img src="https://placehold.co/44" alt=""> Bình Trần</figcaption></figure>
  </div>
</section>
<style>
.testi{padding:72px 24px;max-width:980px;margin:0 auto;text-align:center;font-family:system-ui,sans-serif}
.testi__h{font-size:32px;margin:0 0 36px}
.testi__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.testi__card{background:#f8fafc;border-radius:16px;padding:28px;margin:0;text-align:left}
.testi__card blockquote{margin:0 0 16px;font-size:17px;color:#334155;line-height:1.5}
.testi__card figcaption{display:flex;align-items:center;gap:10px;font-weight:600;color:#111}
.testi__card img{border-radius:50%}
</style>`,
  },
  {
    id: 'cta-banner',
    name: 'Banner kêu gọi hành động',
    description:
      'Dải banner nổi bật cuối trang kêu gọi người dùng đăng ký hoặc bắt đầu. Call to action banner, conversion, sign up strip.',
    tags: ['cta', 'banner', 'conversion'],
    code: `<section class="ctab">
  <h2>Sẵn sàng bắt đầu chưa?</h2>
  <p>Tham gia cùng hàng nghìn người dùng ngay hôm nay.</p>
  <a class="ctab__btn" href="#">Tạo tài khoản miễn phí</a>
</section>
<style>
.ctab{background:#0f172a;color:#fff;text-align:center;padding:64px 24px;font-family:system-ui,sans-serif}
.ctab h2{font-size:32px;margin:0 0 10px}
.ctab p{opacity:.8;margin:0 0 24px}
.ctab__btn{background:#22d3ee;color:#0f172a;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700}
</style>`,
  },
  {
    id: 'footer-simple',
    name: 'Footer đơn giản',
    description:
      'Chân trang gọn gàng với tên thương hiệu, vài liên kết và dòng bản quyền. Simple footer, copyright, links.',
    tags: ['footer'],
    code: `<footer class="foot-s">
  <div class="foot-s__brand">Brand</div>
  <nav><a href="#">Điều khoản</a><a href="#">Bảo mật</a><a href="#">Liên hệ</a></nav>
  <small>© 2026 Brand. Bản quyền đã được bảo hộ.</small>
</footer>
<style>
.foot-s{text-align:center;padding:40px 24px;background:#f8fafc;font-family:system-ui,sans-serif;color:#64748b}
.foot-s__brand{font-weight:700;color:#111;margin-bottom:10px}
.foot-s nav a{margin:0 10px;color:#64748b;text-decoration:none;font-size:14px}
.foot-s small{display:block;margin-top:14px;font-size:13px}
</style>`,
  },
  {
    id: 'footer-columns',
    name: 'Footer nhiều cột',
    description:
      'Chân trang nhiều cột chia nhóm liên kết: sản phẩm, công ty, hỗ trợ, mạng xã hội. Multi-column footer, sitemap links.',
    tags: ['footer', 'columns'],
    code: `<footer class="foot-c">
  <div class="foot-c__cols">
    <div><h4>Sản phẩm</h4><a href="#">Tính năng</a><a href="#">Bảng giá</a></div>
    <div><h4>Công ty</h4><a href="#">Về chúng tôi</a><a href="#">Tuyển dụng</a></div>
    <div><h4>Hỗ trợ</h4><a href="#">Trợ giúp</a><a href="#">Liên hệ</a></div>
  </div>
  <small>© 2026 Brand</small>
</footer>
<style>
.foot-c{background:#111827;color:#cbd5e1;padding:56px 32px 28px;font-family:system-ui,sans-serif}
.foot-c__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:32px;max-width:980px;margin:0 auto}
.foot-c__cols h4{color:#fff;margin:0 0 14px;font-size:15px}
.foot-c__cols a{display:block;color:#9ca3af;text-decoration:none;font-size:14px;margin-bottom:8px}
.foot-c small{display:block;text-align:center;margin-top:36px;color:#6b7280}
</style>`,
  },
  {
    id: 'contact-form',
    name: 'Form liên hệ',
    description:
      'Biểu mẫu liên hệ gồm họ tên, email, nội dung và nút gửi. Contact form, name email message, get in touch.',
    tags: ['form', 'contact'],
    code: `<section class="cform">
  <h2>Liên hệ với chúng tôi</h2>
  <form onsubmit="event.preventDefault();alert('Đã gửi!')">
    <input type="text" placeholder="Họ và tên" required>
    <input type="email" placeholder="Email" required>
    <textarea rows="4" placeholder="Nội dung" required></textarea>
    <button type="submit">Gửi</button>
  </form>
</section>
<style>
.cform{max-width:520px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.cform h2{font-size:30px;margin:0 0 24px;text-align:center}
.cform form{display:grid;gap:14px}
.cform input,.cform textarea{padding:13px 16px;border:1px solid #d1d5db;border-radius:10px;font-size:15px;font-family:inherit}
.cform button{background:#2563eb;color:#fff;border:0;padding:14px;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer}
</style>`,
  },
  {
    id: 'newsletter-signup',
    name: 'Đăng ký nhận tin',
    description:
      'Khối đăng ký nhận bản tin email với ô nhập và nút đăng ký. Newsletter signup, email subscribe, inline form.',
    tags: ['newsletter', 'form', 'subscribe'],
    code: `<section class="news">
  <h2>Nhận tin mới nhất</h2>
  <p>Đăng ký để không bỏ lỡ cập nhật.</p>
  <form class="news__form" onsubmit="event.preventDefault();alert('Đã đăng ký!')">
    <input type="email" placeholder="Email của bạn" required>
    <button>Đăng ký</button>
  </form>
</section>
<style>
.news{text-align:center;padding:64px 24px;background:#f0f9ff;font-family:system-ui,sans-serif}
.news h2{font-size:28px;margin:0 0 8px}
.news p{color:#64748b;margin:0 0 22px}
.news__form{display:flex;gap:10px;max-width:420px;margin:0 auto;flex-wrap:wrap}
.news__form input{flex:1 1 200px;padding:13px 16px;border:1px solid #bae6fd;border-radius:10px}
.news__form button{background:#0284c7;color:#fff;border:0;padding:13px 24px;border-radius:10px;font-weight:600;cursor:pointer}
</style>`,
  },
  {
    id: 'faq-accordion',
    name: 'FAQ dạng accordion',
    description:
      'Mục câu hỏi thường gặp dạng đóng/mở bằng thẻ details. FAQ, frequently asked questions, accordion, collapsible.',
    tags: ['faq', 'accordion'],
    code: `<section class="faq">
  <h2>Câu hỏi thường gặp</h2>
  <details><summary>Tôi có thể dùng thử miễn phí không?</summary><p>Có, bạn được dùng thử 14 ngày.</p></details>
  <details><summary>Có hợp đồng ràng buộc không?</summary><p>Không, bạn hủy bất cứ lúc nào.</p></details>
  <details><summary>Hỗ trợ thanh toán nào?</summary><p>Thẻ, chuyển khoản và ví điện tử.</p></details>
</section>
<style>
.faq{max-width:680px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.faq h2{font-size:30px;margin:0 0 24px;text-align:center}
.faq details{border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;margin-bottom:12px}
.faq summary{font-weight:600;cursor:pointer;color:#111}
.faq p{color:#666;margin:12px 0 0}
</style>`,
  },
  {
    id: 'stats-counter',
    name: 'Khối số liệu thống kê',
    description:
      'Dải hiển thị các con số nổi bật: số khách hàng, dự án, đánh giá. Stats, numbers, metrics, counters, achievements.',
    tags: ['stats', 'metrics'],
    code: `<section class="stats">
  <div class="stats__item"><div class="stats__num">10K+</div><div class="stats__lbl">Người dùng</div></div>
  <div class="stats__item"><div class="stats__num">99.9%</div><div class="stats__lbl">Uptime</div></div>
  <div class="stats__item"><div class="stats__num">4.9★</div><div class="stats__lbl">Đánh giá</div></div>
  <div class="stats__item"><div class="stats__num">24/7</div><div class="stats__lbl">Hỗ trợ</div></div>
</section>
<style>
.stats{display:flex;flex-wrap:wrap;justify-content:center;gap:48px;padding:56px 24px;background:#0f172a;color:#fff;font-family:system-ui,sans-serif}
.stats__num{font-size:38px;font-weight:700;color:#38bdf8}
.stats__lbl{color:#94a3b8;margin-top:4px}
.stats__item{text-align:center}
</style>`,
  },
  {
    id: 'team-grid',
    name: 'Lưới thành viên đội ngũ',
    description:
      'Phần giới thiệu đội ngũ dạng lưới với ảnh, tên và chức danh. Team section, members grid, avatar, role.',
    tags: ['team', 'about', 'grid'],
    code: `<section class="team">
  <h2>Đội ngũ của chúng tôi</h2>
  <div class="team__grid">
    <div class="team__card"><img src="https://placehold.co/120" alt=""><h3>Lan Phạm</h3><p>CEO</p></div>
    <div class="team__card"><img src="https://placehold.co/120" alt=""><h3>Nam Lê</h3><p>CTO</p></div>
    <div class="team__card"><img src="https://placehold.co/120" alt=""><h3>Hà Vũ</h3><p>Design</p></div>
  </div>
</section>
<style>
.team{max-width:920px;margin:0 auto;padding:64px 24px;text-align:center;font-family:system-ui,sans-serif}
.team h2{font-size:30px;margin:0 0 36px}
.team__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px}
.team__card img{border-radius:50%;width:120px;height:120px;object-fit:cover}
.team__card h3{margin:14px 0 2px}
.team__card p{color:#888;margin:0}
</style>`,
  },
  {
    id: 'gallery-grid',
    name: 'Thư viện ảnh dạng lưới',
    description:
      'Lưới hình ảnh thư viện ảnh portfolio responsive. Image gallery, photo grid, portfolio, masonry-like.',
    tags: ['gallery', 'images', 'portfolio'],
    code: `<section class="gal">
  <h2>Thư viện</h2>
  <div class="gal__grid">
    <img src="https://placehold.co/300x220" alt=""><img src="https://placehold.co/300x220" alt="">
    <img src="https://placehold.co/300x220" alt=""><img src="https://placehold.co/300x220" alt="">
    <img src="https://placehold.co/300x220" alt=""><img src="https://placehold.co/300x220" alt="">
  </div>
</section>
<style>
.gal{max-width:1000px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.gal h2{font-size:30px;margin:0 0 24px;text-align:center}
.gal__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.gal__grid img{width:100%;border-radius:10px;display:block}
</style>`,
  },
  {
    id: 'logo-cloud',
    name: 'Dải logo đối tác',
    description:
      'Dải hiển thị logo các đối tác/khách hàng để tăng uy tín. Logo cloud, trusted by, partners, brands strip.',
    tags: ['logos', 'social-proof'],
    code: `<section class="logos">
  <p class="logos__t">Được tin dùng bởi</p>
  <div class="logos__row">
    <img src="https://placehold.co/110x36?text=Logo" alt=""><img src="https://placehold.co/110x36?text=Logo" alt="">
    <img src="https://placehold.co/110x36?text=Logo" alt=""><img src="https://placehold.co/110x36?text=Logo" alt="">
  </div>
</section>
<style>
.logos{text-align:center;padding:48px 24px;font-family:system-ui,sans-serif}
.logos__t{color:#94a3b8;letter-spacing:.5px;text-transform:uppercase;font-size:13px;margin:0 0 20px}
.logos__row{display:flex;flex-wrap:wrap;justify-content:center;gap:36px;align-items:center;opacity:.7}
</style>`,
  },
  {
    id: 'about-split',
    name: 'Giới thiệu chia đôi',
    description:
      'Khối giới thiệu công ty bố cục ảnh và văn bản hai cột. About us section, company story, image and text.',
    tags: ['about', 'split', 'section'],
    code: `<section class="about">
  <img class="about__img" src="https://placehold.co/440x320" alt="">
  <div class="about__txt">
    <h2>Về chúng tôi</h2>
    <p>Chúng tôi xây dựng sản phẩm giúp công việc của bạn dễ dàng hơn mỗi ngày, với sự tận tâm và chất lượng.</p>
    <a href="#">Tìm hiểu thêm →</a>
  </div>
</section>
<style>
.about{display:flex;gap:48px;align-items:center;flex-wrap:wrap;max-width:1040px;margin:0 auto;padding:72px 32px;font-family:system-ui,sans-serif}
.about__img{flex:1 1 320px;width:100%;border-radius:16px}
.about__txt{flex:1 1 320px}
.about__txt h2{font-size:32px;margin:0 0 16px}
.about__txt p{color:#666;font-size:17px;line-height:1.6;margin:0 0 16px}
.about__txt a{color:#2563eb;text-decoration:none;font-weight:600}
</style>`,
  },
  {
    id: 'steps-howitworks',
    name: 'Các bước hoạt động',
    description:
      'Khối mô tả quy trình theo các bước được đánh số. How it works, steps, process, numbered, onboarding.',
    tags: ['steps', 'process', 'how-it-works'],
    code: `<section class="steps">
  <h2>Cách hoạt động</h2>
  <div class="steps__row">
    <div class="steps__item"><div class="steps__n">1</div><h3>Đăng ký</h3><p>Tạo tài khoản miễn phí.</p></div>
    <div class="steps__item"><div class="steps__n">2</div><h3>Thiết lập</h3><p>Cấu hình theo nhu cầu.</p></div>
    <div class="steps__item"><div class="steps__n">3</div><h3>Bắt đầu</h3><p>Tận hưởng kết quả.</p></div>
  </div>
</section>
<style>
.steps{max-width:960px;margin:0 auto;padding:64px 24px;text-align:center;font-family:system-ui,sans-serif}
.steps h2{font-size:30px;margin:0 0 40px}
.steps__row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px}
.steps__n{width:44px;height:44px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;margin:0 auto 14px}
.steps__item h3{margin:0 0 6px}
.steps__item p{color:#666;margin:0}
</style>`,
  },
  {
    id: 'product-card',
    name: 'Thẻ sản phẩm',
    description:
      'Thẻ hiển thị sản phẩm thương mại điện tử với ảnh, tên, giá và nút mua. Product card, ecommerce, price, add to cart.',
    tags: ['product', 'ecommerce', 'card'],
    code: `<div class="pcard">
  <img class="pcard__img" src="https://placehold.co/260x200" alt="">
  <div class="pcard__body">
    <h3 class="pcard__name">Tên sản phẩm</h3>
    <div class="pcard__price">299.000đ</div>
    <button class="pcard__btn" onclick="alert('Đã thêm vào giỏ')">Thêm vào giỏ</button>
  </div>
</div>
<style>
.pcard{width:260px;border:1px solid #eee;border-radius:14px;overflow:hidden;font-family:system-ui,sans-serif}
.pcard__img{width:100%;display:block}
.pcard__body{padding:16px}
.pcard__name{margin:0 0 6px;font-size:16px}
.pcard__price{color:#e11d48;font-weight:700;margin-bottom:12px}
.pcard__btn{width:100%;background:#111;color:#fff;border:0;padding:11px;border-radius:8px;cursor:pointer;font-weight:600}
</style>`,
  },
  {
    id: 'product-grid',
    name: 'Lưới sản phẩm',
    description:
      'Lưới danh sách sản phẩm cho trang cửa hàng. Product grid, shop listing, ecommerce catalog, store.',
    tags: ['product', 'ecommerce', 'grid'],
    code: `<section class="pgrid">
  <h2>Sản phẩm nổi bật</h2>
  <div class="pgrid__row">
    <article class="pgrid__c"><img src="https://placehold.co/240x180" alt=""><h3>Sản phẩm A</h3><span>199.000đ</span></article>
    <article class="pgrid__c"><img src="https://placehold.co/240x180" alt=""><h3>Sản phẩm B</h3><span>259.000đ</span></article>
    <article class="pgrid__c"><img src="https://placehold.co/240x180" alt=""><h3>Sản phẩm C</h3><span>329.000đ</span></article>
  </div>
</section>
<style>
.pgrid{max-width:1040px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.pgrid h2{font-size:30px;margin:0 0 28px;text-align:center}
.pgrid__row{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
.pgrid__c{border:1px solid #eee;border-radius:12px;padding:12px;text-align:center}
.pgrid__c img{width:100%;border-radius:8px;margin-bottom:10px}
.pgrid__c h3{font-size:15px;margin:0 0 4px}
.pgrid__c span{color:#e11d48;font-weight:700}
</style>`,
  },
  {
    id: 'blog-list',
    name: 'Danh sách bài viết blog',
    description:
      'Danh sách bài viết blog với ảnh thumbnail, tiêu đề và trích đoạn. Blog list, articles, posts, news feed.',
    tags: ['blog', 'articles', 'list'],
    code: `<section class="blog">
  <h2>Bài viết mới</h2>
  <div class="blog__list">
    <article class="blog__post"><img src="https://placehold.co/200x130" alt=""><div><h3>Tiêu đề bài viết</h3><p>Trích đoạn ngắn giới thiệu nội dung bài viết...</p><small>08/06/2026</small></div></article>
    <article class="blog__post"><img src="https://placehold.co/200x130" alt=""><div><h3>Một bài viết khác</h3><p>Trích đoạn ngắn giới thiệu nội dung bài viết...</p><small>05/06/2026</small></div></article>
  </div>
</section>
<style>
.blog{max-width:760px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.blog h2{font-size:30px;margin:0 0 24px}
.blog__post{display:flex;gap:18px;padding:16px 0;border-bottom:1px solid #eee}
.blog__post img{border-radius:10px;flex-shrink:0}
.blog__post h3{margin:0 0 6px}
.blog__post p{color:#666;margin:0 0 6px}
.blog__post small{color:#aaa}
</style>`,
  },
  {
    id: 'menu-list',
    name: 'Thực đơn quán ăn / cà phê',
    description:
      'Danh sách thực đơn món ăn đồ uống kèm giá, phù hợp nhà hàng quán cà phê. Restaurant menu, food drink list, prices, cafe.',
    tags: ['menu', 'restaurant', 'cafe', 'food'],
    code: `<section class="menu">
  <h2>Thực đơn</h2>
  <ul class="menu__list">
    <li><span>Cà phê sữa</span><span class="menu__dots"></span><b>29.000đ</b></li>
    <li><span>Bạc xỉu</span><span class="menu__dots"></span><b>35.000đ</b></li>
    <li><span>Trà đào</span><span class="menu__dots"></span><b>39.000đ</b></li>
    <li><span>Bánh mì</span><span class="menu__dots"></span><b>25.000đ</b></li>
  </ul>
</section>
<style>
.menu{max-width:560px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.menu h2{font-size:30px;margin:0 0 24px;text-align:center;color:#6b4f3a}
.menu__list{list-style:none;padding:0;margin:0}
.menu__list li{display:flex;align-items:baseline;gap:8px;padding:12px 0;font-size:17px}
.menu__dots{flex:1;border-bottom:1px dotted #cbb;}
.menu__list b{color:#6b4f3a}
</style>`,
  },
  {
    id: 'booking-form',
    name: 'Form đặt bàn / đặt lịch',
    description:
      'Biểu mẫu đặt bàn đặt lịch hẹn với ngày giờ và số người. Booking form, reservation, date time, appointment, table.',
    tags: ['form', 'booking', 'reservation'],
    code: `<section class="book">
  <h2>Đặt bàn</h2>
  <form class="book__form" onsubmit="event.preventDefault();alert('Đã đặt bàn!')">
    <input type="text" placeholder="Tên" required>
    <input type="tel" placeholder="Số điện thoại" required>
    <input type="date" required>
    <input type="time" required>
    <input type="number" min="1" placeholder="Số người" required>
    <button>Xác nhận</button>
  </form>
</section>
<style>
.book{max-width:480px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif}
.book h2{font-size:30px;margin:0 0 22px;text-align:center;color:#6b4f3a}
.book__form{display:grid;gap:12px}
.book__form input{padding:12px 14px;border:1px solid #d6cabb;border-radius:10px;font-family:inherit}
.book__form button{background:#6b4f3a;color:#fff;border:0;padding:13px;border-radius:10px;font-weight:600;cursor:pointer}
</style>`,
  },
  {
    id: 'services-cards',
    name: 'Thẻ dịch vụ',
    description:
      'Khối liệt kê các dịch vụ cung cấp dạng thẻ có mô tả. Services section, offerings, cards with description.',
    tags: ['services', 'cards', 'section'],
    code: `<section class="srv">
  <h2>Dịch vụ của chúng tôi</h2>
  <div class="srv__grid">
    <div class="srv__c"><h3>Thiết kế</h3><p>Giao diện đẹp, hiện đại, chuẩn UX.</p></div>
    <div class="srv__c"><h3>Phát triển</h3><p>Code sạch, hiệu năng cao, bảo trì dễ.</p></div>
    <div class="srv__c"><h3>Tư vấn</h3><p>Đồng hành cùng bạn từ ý tưởng tới sản phẩm.</p></div>
  </div>
</section>
<style>
.srv{max-width:1000px;margin:0 auto;padding:64px 24px;text-align:center;font-family:system-ui,sans-serif}
.srv h2{font-size:30px;margin:0 0 36px}
.srv__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.srv__c{padding:28px;border-radius:14px;background:#f8fafc;text-align:left}
.srv__c h3{margin:0 0 10px}
.srv__c p{color:#666;margin:0}
</style>`,
  },
  {
    id: 'banner-promo',
    name: 'Banner khuyến mãi',
    description:
      'Dải banner thông báo khuyến mãi giảm giá ở đầu trang. Promo banner, sale, discount announcement, top bar.',
    tags: ['banner', 'promo', 'sale'],
    code: `<div class="promo">🎉 Giảm 30% cho đơn đầu tiên — dùng mã <b>WELCOME30</b> <a href="#">Mua ngay</a></div>
<style>
.promo{background:#fde047;color:#713f12;text-align:center;padding:12px 16px;font-family:system-ui,sans-serif;font-size:15px}
.promo a{color:#713f12;font-weight:700;margin-left:8px}
</style>`,
  },
  {
    id: 'hero-search',
    name: 'Hero có ô tìm kiếm',
    description:
      'Hero với tiêu đề và ô tìm kiếm lớn, phù hợp trang dịch vụ hoặc tìm kiếm. Hero with search bar, find, directory, marketplace.',
    tags: ['hero', 'search'],
    code: `<section class="hsearch">
  <h1>Tìm thứ bạn cần</h1>
  <form class="hsearch__bar" onsubmit="event.preventDefault();alert('Tìm kiếm...')">
    <input type="text" placeholder="Nhập từ khóa...">
    <button>Tìm</button>
  </form>
</section>
<style>
.hsearch{text-align:center;padding:96px 24px;background:#eef2ff;font-family:system-ui,sans-serif}
.hsearch h1{font-size:40px;margin:0 0 28px;color:#312e81}
.hsearch__bar{display:flex;max-width:520px;margin:0 auto;background:#fff;border-radius:999px;padding:6px;box-shadow:0 8px 24px rgba(49,46,129,.12)}
.hsearch__bar input{flex:1;border:0;padding:12px 18px;font-size:16px;outline:none;background:transparent}
.hsearch__bar button{background:#4f46e5;color:#fff;border:0;padding:12px 28px;border-radius:999px;font-weight:600;cursor:pointer}
</style>`,
  },
  {
    id: 'feature-highlight',
    name: 'Tính năng nổi bật (chữ + ảnh)',
    description:
      'Khối làm nổi bật một tính năng với mô tả chi tiết và ảnh minh họa xen kẽ. Feature highlight, alternating text and image, detail.',
    tags: ['features', 'split', 'highlight'],
    code: `<section class="fhl">
  <div class="fhl__txt"><span class="fhl__tag">MỚI</span><h2>Tự động hóa mọi quy trình</h2><p>Tiết kiệm hàng giờ mỗi tuần nhờ luồng công việc thông minh và linh hoạt.</p></div>
  <img class="fhl__img" src="https://placehold.co/460x300" alt="">
</section>
<style>
.fhl{display:flex;align-items:center;gap:48px;flex-wrap:wrap;max-width:1040px;margin:0 auto;padding:72px 32px;font-family:system-ui,sans-serif}
.fhl__txt{flex:1 1 320px}
.fhl__tag{display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:12px}
.fhl__txt h2{font-size:32px;margin:0 0 14px}
.fhl__txt p{color:#666;font-size:17px;line-height:1.6;margin:0}
.fhl__img{flex:1 1 320px;width:100%;border-radius:16px}
</style>`,
  },
  {
    id: 'social-footer',
    name: 'Footer có mạng xã hội',
    description:
      'Chân trang kèm các biểu tượng mạng xã hội và bản quyền. Footer with social media icons, follow us, links.',
    tags: ['footer', 'social'],
    code: `<footer class="sfoot">
  <div class="sfoot__brand">Brand</div>
  <div class="sfoot__social"><a href="#">𝕏</a><a href="#">f</a><a href="#">in</a><a href="#">▶</a></div>
  <small>© 2026 Brand — Made with ♥</small>
</footer>
<style>
.sfoot{text-align:center;padding:44px 24px;background:#0f172a;color:#cbd5e1;font-family:system-ui,sans-serif}
.sfoot__brand{font-weight:700;color:#fff;font-size:18px;margin-bottom:14px}
.sfoot__social a{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border:1px solid #334155;border-radius:50%;color:#cbd5e1;text-decoration:none;margin:0 5px}
.sfoot small{display:block;margin-top:18px;color:#64748b}
</style>`,
  },
  // ----- Component gắn BRAND (Bước 7) — chỉ xuất hiện khi truy xuất kèm brandId tương ứng -----
  {
    id: 'acme-navbar',
    name: 'Navbar Acme Coffee',
    description:
      'Thanh điều hướng theo nhận diện Acme Coffee: tông nâu ấm, font serif, logo ☕. Coffee shop branded navbar, warm brown, serif.',
    tags: ['navbar', 'header', 'brand', 'cafe'],
    brand: 'acme-coffee',
    code: `<header class="acme-nav">
  <a class="acme-nav__logo" href="#">☕ Acme Coffee</a>
  <nav><a href="#menu">Thực đơn</a><a href="#about">Về chúng tôi</a><a href="#book">Đặt bàn</a></nav>
</header>
<style>
.acme-nav{display:flex;justify-content:space-between;align-items:center;padding:18px 32px;background:#f3e9df;font-family:Georgia,serif;border-bottom:1px solid #e2d2bf}
.acme-nav__logo{font-weight:700;font-size:21px;color:#6b4f3a;text-decoration:none}
.acme-nav nav a{margin-left:22px;color:#7a5d46;text-decoration:none}
</style>`,
  },
  {
    id: 'acme-hero',
    name: 'Hero Acme Coffee',
    description:
      'Khu hero theo nhận diện Acme Coffee: nền nâu kem gradient, font serif, nút đặt bàn nâu đậm. Coffee shop branded hero, warm tone, serif, booking button.',
    tags: ['hero', 'landing', 'brand', 'cafe'],
    brand: 'acme-coffee',
    code: `<section class="acme-hero">
  <h1>Cà phê thủ công, mỗi sáng một niềm vui</h1>
  <p>Hạt rang mộc, pha bằng tâm huyết — chào mừng đến với Acme Coffee.</p>
  <a class="acme-hero__btn" href="#book">Đặt bàn ngay</a>
</section>
<style>
.acme-hero{text-align:center;padding:104px 24px;background:linear-gradient(135deg,#f3e9df,#e8d6c3);font-family:Georgia,serif;color:#2a1d16}
.acme-hero h1{font-size:44px;max-width:640px;margin:0 auto 16px}
.acme-hero p{color:#6b5a4a;max-width:520px;margin:0 auto 28px;font-size:18px}
.acme-hero__btn{background:#6b4f3a;color:#fff;padding:13px 30px;border-radius:999px;text-decoration:none;font-weight:600}
</style>`,
  },
];

/** Văn bản dùng để embed 1 component (gộp tên + mô tả + tags để truy xuất tốt hơn). */
export function buildEmbedText(c) {
  return `${c.name}. ${c.description}. tags: ${(c.tags || []).join(', ')}`;
}
