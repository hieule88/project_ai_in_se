/**
 * DBEE_THEME — "design tokens + CSS chuẩn" của DBEE, là NGUỒN STYLE DUY NHẤT.
 *
 * Để ổn định vibe: thay vì để model tự vẽ lại CSS mỗi lần (gây lệch cỡ chữ navbar, bo góc,
 * footer…), ta nhồi NGUYÊN VĂN khối CSS này và yêu cầu model CHỈ ráp HTML dùng các class
 * `dbee-*`, KHÔNG định nghĩa lại. Pipeline cũng chèn lại khối này vào output để chắc chắn.
 *
 * Marker `--dbee-primary` dùng để kiểm tra theme đã có trong HTML hay chưa.
 */
export const DBEE_THEME = `
:root{--dbee-primary:#f2db45;--dbee-primary-dark:#d4bf3a;--dbee-ink:#1f2937;--dbee-muted:#6b7280;--dbee-soft:#fffdf3;--dbee-line:#eee7cf;--dbee-radius:14px;--dbee-font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box}body{margin:0;font-family:var(--dbee-font);color:var(--dbee-ink);background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}ul{list-style:none;margin:0;padding:0}img{max-width:100%;display:block}

/* Nút */
.dbee-btn{display:inline-block;background:var(--dbee-primary);color:var(--dbee-ink);font-weight:700;padding:12px 26px;border-radius:999px;text-decoration:none;border:0;cursor:pointer;font-size:15px}
.dbee-btn:hover{background:var(--dbee-primary-dark)}
.dbee-btn--ghost{background:#fff;border:1.5px solid var(--dbee-ink)}
.dbee-btn--dark{background:var(--dbee-ink);color:#fff}

/* Navbar */
.dbee-nav{display:flex;align-items:center;gap:28px;padding:16px 40px;background:#fff;border-bottom:1px solid var(--dbee-line);position:sticky;top:0;z-index:50}
.dbee-nav__logo{font-weight:900;font-size:24px;letter-spacing:.5px;color:var(--dbee-ink);border-radius:8px}
.dbee-nav__menu{display:flex;gap:24px;margin-left:auto}
.dbee-nav__menu a{color:#374151;font-weight:600;font-size:15px}
.dbee-nav__menu a:hover{color:#bda01f}

/* Section + tiêu đề + lưới */
.dbee-section{max-width:1080px;margin:0 auto;padding:72px 24px}
.dbee-h2{font-size:32px;color:var(--dbee-ink);text-align:center;margin:0 0 40px}
.dbee-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}

/* Hero */
.dbee-hero{background:linear-gradient(180deg,var(--dbee-soft),#fff);padding:96px 24px;text-align:center}
.dbee-hero__inner{max-width:760px;margin:0 auto}
.dbee-tag{display:inline-block;background:var(--dbee-primary);color:var(--dbee-ink);font-weight:700;font-size:13px;padding:6px 14px;border-radius:999px;margin-bottom:18px}
.dbee-hero__title{font-size:46px;line-height:1.12;margin:0 0 16px}
.dbee-hero__sub{font-size:19px;color:var(--dbee-muted);margin:0 0 30px}
.dbee-hero__cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}

/* Thẻ khóa học */
.dbee-card{border:1px solid var(--dbee-line);border-radius:var(--dbee-radius);padding:26px;background:#fff}
.dbee-card__badge{display:inline-block;background:var(--dbee-soft);border:1px solid var(--dbee-primary);color:#bda01f;font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:12px}
.dbee-card h3{margin:0 0 8px}.dbee-card p{color:var(--dbee-muted);margin:0 0 14px}
.dbee-card__meta{color:#bda01f;font-weight:700;font-size:14px}

/* Bảng lịch */
.dbee-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--dbee-line);border-radius:var(--dbee-radius);overflow:hidden}
.dbee-table th{background:var(--dbee-soft);text-align:left;padding:14px 18px;border-bottom:2px solid var(--dbee-primary);font-size:14px}
.dbee-table td{padding:14px 18px;border-bottom:1px solid #f3eeda;color:#374151}

/* Lộ trình */
.dbee-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}
.dbee-step{text-align:center}
.dbee-step__n{width:48px;height:48px;border-radius:50%;background:var(--dbee-primary);color:var(--dbee-ink);font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.dbee-step h3{margin:0 0 6px}.dbee-step p{color:var(--dbee-muted);margin:0}

/* Tính năng */
.dbee-feature{background:var(--dbee-soft);border:1px solid var(--dbee-line);border-radius:var(--dbee-radius);padding:28px;text-align:center}
.dbee-feature__ic{font-size:36px;margin-bottom:12px}
.dbee-feature h3{margin:0 0 8px}.dbee-feature p{color:var(--dbee-muted);margin:0}

/* Số liệu */
.dbee-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:48px;padding:56px 24px;background:var(--dbee-ink)}
.dbee-stat{text-align:center}
.dbee-stat__num{font-size:38px;font-weight:900;color:var(--dbee-primary)}
.dbee-stat__lbl{color:#cbd5e1;margin-top:4px}

/* Giảng viên */
.dbee-person{text-align:center}
.dbee-person img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid var(--dbee-primary);margin:0 auto}
.dbee-person h3{margin:14px 0 2px}.dbee-person p{color:var(--dbee-muted);margin:0;font-size:14px}

/* Cảm nhận */
.dbee-quote{background:#fff;border:1px solid var(--dbee-line);border-radius:var(--dbee-radius);padding:26px;margin:0}
.dbee-quote blockquote{margin:0 0 16px;color:#374151}
.dbee-quote figcaption{display:flex;align-items:center;gap:10px;font-weight:700}
.dbee-quote img{border-radius:50%}

/* Học phí */
.dbee-price{border:1px solid var(--dbee-line);border-radius:16px;padding:30px 24px;text-align:center;position:relative;background:#fff}
.dbee-price--hot{border-color:var(--dbee-primary);box-shadow:0 12px 30px rgba(242,219,69,.25)}
.dbee-price__tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--dbee-primary);color:var(--dbee-ink);font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px}
.dbee-price__amt{font-size:34px;font-weight:900;margin:12px 0}.dbee-price p{color:var(--dbee-muted);margin:0 0 16px}

/* FAQ */
.dbee-faq{border:1px solid var(--dbee-line);border-radius:12px;padding:16px 18px;margin-bottom:12px;background:#fff}
.dbee-faq summary{font-weight:700;cursor:pointer}.dbee-faq p{color:var(--dbee-muted);margin:12px 0 0}

/* CTA */
.dbee-cta{background:var(--dbee-primary);text-align:center;padding:64px 24px}
.dbee-cta h2{font-size:32px;margin:0 0 10px}.dbee-cta p{color:#5b5320;margin:0 0 24px}

/* Form */
.dbee-form{display:grid;gap:14px}
.dbee-form input,.dbee-form select,.dbee-form textarea{padding:13px 16px;border:1px solid #e3dcc2;border-radius:10px;font-size:15px;font-family:inherit}

/* Gallery */
.dbee-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.dbee-gallery img{width:100%;border-radius:12px;border:1px solid var(--dbee-line)}

/* Giới thiệu */
.dbee-about{display:flex;gap:48px;align-items:center;flex-wrap:wrap;max-width:1040px;margin:0 auto;padding:72px 24px}
.dbee-about__img{flex:1 1 320px;border-radius:16px}.dbee-about__txt{flex:1 1 320px}
.dbee-about__txt p{color:var(--dbee-muted);font-size:17px;line-height:1.7;margin:0 0 20px}

/* Footer */
.dbee-footer{background:var(--dbee-ink);color:#cbd5e1;padding:56px 32px 28px}
.dbee-footer__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px;max-width:1000px;margin:0 auto}
.dbee-footer__brand{font-weight:900;font-size:22px;color:var(--dbee-primary);margin-bottom:8px}
.dbee-footer h4{color:#fff;margin:0 0 12px;font-size:15px}
.dbee-footer a{display:block;color:#9ca3af;font-size:14px;margin-bottom:8px}
.dbee-footer a:hover{color:var(--dbee-primary)}
.dbee-footer small{display:block;text-align:center;margin-top:36px;color:#6b7280}
`.trim();

/** HTML có chứa theme chưa? (dựa trên marker biến CSS) */
export function hasTheme(html) {
  return /--dbee-primary/.test(String(html));
}
