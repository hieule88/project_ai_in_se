/**
 * REVIEW AGENT (Bước 6) — kiểm tra tĩnh chất lượng HTML do Code Agent sinh ra.
 *
 * "Lint nhẹ" KHÔNG cần thư viện ngoài, KHÔNG gọi model (miễn phí):
 * phát hiện HTML bị cắt cụt, thiếu khung, thẻ <script>/<style> lệch, còn TODO...
 *
 * Mỗi vấn đề: { level: 'error'|'warning', message, file }.
 *   - error   → đáng để gọi model sửa lại 1 vòng (pipeline tự lo).
 *   - warning → chỉ ghi chú, không chặn.
 *
 * pipeline.js dùng: reviewProject(project) -> { ok, errors, warnings, issues }.
 */

/** Đếm số lần xuất hiện 1 pattern (cờ g). */
function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

/** Kiểm tra 1 file HTML, trả về mảng issue. */
export function validateHtml(content, file = '/index.html') {
  const issues = [];
  const html = String(content || '');
  const add = (level, message) => issues.push({ level, message, file });

  if (html.trim().length < 200) {
    add('error', 'Nội dung quá ngắn — có thể model trả thiếu hoặc rỗng.');
  }
  // Bị cắt cụt: HTML hoàn chỉnh phải kết thúc bằng </html>.
  if (!/<\/html\s*>\s*$/i.test(html.trim())) {
    add('error', 'Không kết thúc bằng </html> — HTML có thể bị cắt cụt (tăng QWEN_MAX_TOKENS?).');
  }
  // Khung cơ bản.
  if (!/<!doctype html>/i.test(html)) add('warning', 'Thiếu <!doctype html>.');
  if (!/<html[\s>]/i.test(html)) add('error', 'Thiếu thẻ <html>.');
  if (!/<head[\s>]/i.test(html)) add('warning', 'Thiếu thẻ <head>.');
  if (!/<body[\s>]/i.test(html)) add('error', 'Thiếu thẻ <body>.');
  if (!/<\/body\s*>/i.test(html)) add('error', 'Thiếu thẻ đóng </body>.');

  // Thẻ <script> / <style> phải cân (mở = đóng).
  const scriptOpen = countMatches(html, /<script[\s>]/gi);
  const scriptClose = countMatches(html, /<\/script\s*>/gi);
  if (scriptOpen !== scriptClose) {
    add('error', `Số <script> (${scriptOpen}) không khớp </script> (${scriptClose}).`);
  }
  const styleOpen = countMatches(html, /<style[\s>]/gi);
  const styleClose = countMatches(html, /<\/style\s*>/gi);
  if (styleOpen !== styleClose) {
    add('error', `Số <style> (${styleOpen}) không khớp </style> (${styleClose}).`);
  }

  // Còn sót placeholder/đánh dấu chưa hoàn thiện (tránh nhầm "placehold.co" của ảnh demo).
  if (/\bTODO\b|\bFIXME\b|lorem ipsum|YOUR_[A-Z_]+|\bXXX\b/i.test(html)) {
    add('warning', 'Còn sót TODO/FIXME/placeholder chưa hoàn thiện.');
  }
  // Ràng buộc kiến trúc: KHÔNG dùng CDN / thư viện ngoài.
  if (/<script[^>]+src\s*=\s*["']https?:/i.test(html) || /<link[^>]+href\s*=\s*["']https?:\/\/[^"']*\.css/i.test(html)) {
    add('warning', 'Có vẻ nạp script/CSS từ CDN ngoài — yêu cầu là HTML tự chứa, không CDN.');
  }

  return issues;
}

/**
 * Soát toàn bộ project.
 * @returns {{ ok:boolean, errors:Array, warnings:Array, issues:Array }}
 */
export function reviewProject(project) {
  const issues = [];

  const index = project.files.find((f) => f.path === '/index.html') || project.files[0];
  if (!index) {
    issues.push({ level: 'error', message: 'Project không có file nào.', file: '-' });
  } else {
    if (project.entry !== '/index.html') {
      issues.push({ level: 'warning', message: `entry = "${project.entry}" (nên là "/index.html").`, file: project.entry });
    }
    issues.push(...validateHtml(index.content, index.path));
  }

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  return { ok: errors.length === 0, errors, warnings, issues };
}

/** Gộp issue thành 1 chuỗi ngắn cho agentStep / prompt sửa lỗi. */
export function summarizeIssues(issues) {
  if (!issues.length) return 'không có lỗi';
  return issues.map((i) => `[${i.level}] ${i.message}`).join(' · ');
}
