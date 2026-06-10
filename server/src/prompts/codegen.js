/**
 * PROMPTS — sở hữu bởi P3 (Agents & Prompt).
 *
 * Quy ước output BẮT BUỘC (một phần của "hợp đồng"):
 * model trả về DUY NHẤT một khối JSON, không lời dẫn, không markdown:
 *   { "summary": string, "entry": "/index.html", "files": [ { "path", "content" } ] }
 *
 * Stack output: HTML/CSS/JS THUẦN, preview bằng iframe local (không cần internet).
 *   - /index.html phải TỰ CHỨA: CSS trong <style>, JS trong <script>.
 */

const OUTPUT_RULES = `
Bạn TRẢ VỀ DUY NHẤT một object JSON hợp lệ, KHÔNG kèm giải thích, KHÔNG markdown, KHÔNG dấu \`\`\`.
Schema:
{
  "summary": string,            // 1 câu mô tả
  "entry": "/index.html",
  "files": [ { "path": string, "content": string } ]
}
Ràng buộc kỹ thuật:
- Trang web TĨNH bằng HTML/CSS/JS thuần (vanilla). KHÔNG React, KHÔNG thư viện ngoài, KHÔNG CDN.
- Chỉ cần MỘT file "/index.html" TỰ CHỨA: CSS đặt trong thẻ <style>, JS đặt trong thẻ <script> ngay trong file.
- entry luôn là "/index.html".
- Code chạy được ngay, responsive cơ bản, KHÔNG để placeholder TODO.
`.trim();

export function buildGenerateMessages({ description, language = 'vi', retrievedComponents = [], brand = null }) {
  const ragBlock = retrievedComponents.length
    ? `\nCác component tham khảo từ kho (ưu tiên TÁI SỬ DỤNG, giữ đúng phong cách):\n${retrievedComponents
        .map((c, i) => `# Component ${i + 1}: ${c.name}\n${c.code}`)
        .join('\n\n')}\n`
    : '';

  return [
    {
      role: 'system',
      content:
        `Bạn là Code Agent của một trợ lý làm web frontend. Ngôn ngữ trao đổi: ${language}.\n` +
        OUTPUT_RULES,
    },
    { role: 'user', content: `Yêu cầu của người dùng:\n${description}\n${buildBrandBlock(brand)}${ragBlock}` },
  ];
}

/**
 * Placeholder cho logo ảnh: KHÔNG nhồi base64 vào prompt (model không chép lại nổi
 * + tốn token + dễ cắt cụt). Cho model dùng chuỗi này làm src; pipeline thay bằng
 * ảnh thật SAU khi sinh (xem pipeline.js#inlineBrandLogo).
 */
export const BRAND_LOGO_PLACEHOLDER = '__BRAND_LOGO__';

/** Khối nhận diện thương hiệu để model áp dụng xuyên suốt (màu/font/logo). */
function buildBrandBlock(brand) {
  if (!brand) return '';
  const c = brand.colors || {};
  const lines = [
    `\nÁP DỤNG NHẬN DIỆN THƯƠNG HIỆU "${brand.name}" xuyên suốt trang:`,
    `- Màu chủ đạo: ${c.primary} (dùng cho nút, link, điểm nhấn).`,
  ];
  if (c.bg) lines.push(`- Màu nền: ${c.bg}.`);
  if (c.text) lines.push(`- Màu chữ: ${c.text}.`);
  if (brand.font) lines.push(`- Font chữ: ${brand.font} (đặt cho body).`);
  if (brand.logo) {
    const isImg = /^(data:|https?:)/i.test(brand.logo);
    lines.push(
      isImg
        ? `- Logo: chèn ảnh ở header bằng <img src="${BRAND_LOGO_PLACEHOLDER}" alt="${brand.name}" style="height:40px">. ` +
          `BẮT BUỘC giữ NGUYÊN VĂN chuỗi src="${BRAND_LOGO_PLACEHOLDER}" — KHÔNG thay bằng URL/base64/đường dẫn nào khác.`
        : `- Logo: hiển thị "${brand.logo} ${brand.name}" ở header.`
    );
  }
  return lines.join('\n') + '\n';
}

export function buildEditMessages({ files, instruction, language = 'vi' }) {
  return [
    {
      role: 'system',
      content:
        `Bạn là Code Agent. Người dùng muốn CHỈNH SỬA dự án hiện có. Ngôn ngữ: ${language}.\n` +
        `Trả về TOÀN BỘ danh sách file sau khi sửa (không chỉ phần thay đổi).\n` +
        OUTPUT_RULES,
    },
    {
      role: 'user',
      content: `Dự án hiện tại:\n${JSON.stringify(files)}\n\nYêu cầu chỉnh sửa:\n${instruction}`,
    },
  ];
}

/**
 * Prompt cho Review Agent (Bước 6): yêu cầu model SỬA các lỗi đã phát hiện,
 * trả về TOÀN BỘ project theo đúng "hợp đồng" JSON.
 */
export function buildFixMessages({ files, issues, language = 'vi' }) {
  const issueText = issues.map((i, idx) => `${idx + 1}. [${i.level}] ${i.message} (${i.file})`).join('\n');
  return [
    {
      role: 'system',
      content:
        `Bạn là Review Agent. Trang web hiện tại có lỗi cần SỬA. Ngôn ngữ: ${language}.\n` +
        `Sửa ĐÚNG các lỗi được liệt kê, GIỮ NGUYÊN nội dung/thiết kế hợp lệ còn lại.\n` +
        `Trả về TOÀN BỘ danh sách file sau khi sửa.\n` +
        OUTPUT_RULES,
    },
    {
      role: 'user',
      content: `Project hiện tại:\n${JSON.stringify(files)}\n\nCác lỗi cần sửa:\n${issueText}`,
    },
  ];
}

/** Project mẫu khi MOCK_MODE=1 — HTML tự chứa, đúng định dạng "hợp đồng". */
export const mockProjectRaw = JSON.stringify({
  summary: 'Landing page mẫu (mock) — quán cà phê',
  entry: '/index.html',
  files: [
    {
      path: '/index.html',
      content: `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Acme Coffee</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: system-ui, sans-serif; color: #2a1d16; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 18px 32px; border-bottom: 1px solid #eee; }
  .logo { font-weight: 700; }
  nav a { margin-left: 20px; text-decoration: none; color: #6b4f3a; }
  .hero { text-align: center; padding: 96px 24px; background: linear-gradient(135deg,#f3e9df,#e8d6c3); }
  .hero h1 { font-size: 40px; max-width: 620px; margin: 0 auto 16px; }
  .hero p { color: #6b5a4a; max-width: 520px; margin: 0 auto 28px; }
  .cta { background: #6b4f3a; color: #fff; border: 0; padding: 12px 28px; border-radius: 999px; font-size: 16px; cursor: pointer; }
  footer { text-align: center; padding: 32px; color: #9a8a7a; font-size: 14px; }
</style>
</head>
<body>
  <header>
    <span class="logo">☕ Acme Coffee</span>
    <nav><a href="#">Menu</a><a href="#">Về chúng tôi</a><a href="#">Liên hệ</a></nav>
  </header>
  <section class="hero">
    <h1>Cà phê thủ công, mỗi sáng một niềm vui</h1>
    <p>Đây là trang mẫu do MOCK_MODE sinh ra. Bật API thật để dùng Qwen3-Coder-Next.</p>
    <button class="cta" onclick="alert('Đã đặt bàn!')">Đặt bàn</button>
  </section>
  <footer>© 2026 Acme Coffee — demo skeleton</footer>
</body>
</html>`,
    },
  ],
});
