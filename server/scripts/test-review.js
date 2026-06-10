/**
 * TEST REVIEW — kiểm tra bộ validate HTML của Review Agent (KHÔNG gọi model, KHÔNG tốn tiền).
 * Chạy:  cd server && npm run test:review
 *
 * Khẳng định: HTML hợp lệ -> ok; các HTML lỗi -> bắt đúng loại error.
 * Cũng soát luôn project mẫu MOCK để chắc nó "sạch".
 */
import { validateHtml, reviewProject } from '../src/review.js';
import { mockProjectRaw } from '../src/prompts/codegen.js';
import { parseProject } from '../src/parser.js';

let passed = 0;
let failed = 0;

function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

const GOOD = `<!doctype html><html lang="vi"><head><title>X</title><style>body{margin:0}</style></head>
<body><h1>Xin chào</h1><p>${'nội dung '.repeat(20)}</p><script>console.log(1)</script></body></html>`;

console.log('1) HTML hợp lệ');
check('không có error', validateHtml(GOOD).filter((i) => i.level === 'error').length === 0);

console.log('2) HTML bị cắt cụt (thiếu </html>)');
check('bắt được error cắt cụt', validateHtml(GOOD.replace(/<\/html>\s*$/, '')).some((i) => i.level === 'error'));

console.log('3) Thiếu <body>');
check('bắt được thiếu body', validateHtml('<!doctype html><html><head></head></html>').some((i) => /body/i.test(i.message)));

console.log('4) <script> lệch (mở không đóng)');
check('bắt được script lệch', validateHtml(GOOD.replace('</script>', '')).some((i) => /script/i.test(i.message)));

console.log('5) Còn sót TODO');
check('cảnh báo TODO', validateHtml(GOOD.replace('<h1>', '<h1>TODO ')).some((i) => i.level === 'warning' && /TODO/i.test(i.message)));

console.log('6) Ảnh placehold.co KHÔNG bị nhầm là placeholder');
check('không cảnh báo nhầm', !validateHtml(GOOD.replace('<h1>', '<img src="https://placehold.co/100"><h1>')).some((i) => /placeholder/i.test(i.message)));

console.log('7) Project mẫu MOCK phải sạch');
const mockReview = reviewProject(parseProject(mockProjectRaw));
check('mock ok = true', mockReview.ok === true);

console.log(`\n${failed === 0 ? '✅' : '❌'} passed ${passed}, failed ${failed}`);
process.exit(failed === 0 ? 0 : 1);
