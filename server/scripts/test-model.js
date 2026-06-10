/**
 * Script test nối model thật (Bước 2).
 * Chạy:  cd server && node scripts/test-model.js
 *   (hoặc: npm run test:model)
 *
 * Nó gọi NGUYÊN pipeline (qwenClient -> parser) với 1 prompt mẫu, rồi kiểm tra:
 *   - kết nối + auth OK
 *   - model trả JSON parse được
 *   - có file /index.html tự chứa (entry đúng)
 * In ra summary, số file, độ trễ. KHÔNG ghi file gì cả.
 */
import 'dotenv/config';
import { runGenerate } from '../src/pipeline.js';

const PROMPT =
  process.argv.slice(2).join(' ') ||
  'Landing page cho quán cà phê tên "Bean There": header có logo + menu, hero với nút "Đặt bàn", phần giới thiệu, footer. Tông màu nâu ấm.';

function line() {
  console.log('─'.repeat(60));
}

async function main() {
  const mock = process.env.MOCK_MODE === '1';
  line();
  console.log(mock ? '⚠️  MOCK_MODE=1 — đang test MOCK, KHÔNG phải model thật.' : '🔌 Test MODEL THẬT');
  if (!mock) {
    console.log('   base :', process.env.QWEN_BASE_URL);
    console.log('   model:', process.env.QWEN_MODEL);
    console.log('   json :', process.env.QWEN_JSON_MODE === '1' ? 'on' : 'off');
  }
  console.log('   prompt:', PROMPT.slice(0, 80) + (PROMPT.length > 80 ? '…' : ''));
  line();

  const t0 = Date.now();
  const result = await runGenerate({ description: PROMPT, language: 'vi' });
  const ms = Date.now() - t0;

  // ---- Kiểm tra theo "hợp đồng" ----
  const errors = [];
  if (!result.summary) errors.push('thiếu summary');
  if (result.entry !== '/index.html') errors.push(`entry = "${result.entry}" (cần "/index.html")`);
  const index = result.files.find((f) => f.path === '/index.html');
  if (!index) errors.push('không có file /index.html');
  if (index && !/<\/html>/i.test(index.content)) errors.push('/index.html không có </html> (HTML không hoàn chỉnh?)');
  if (index && index.content.length < 200) errors.push('/index.html quá ngắn (có thể bị cắt cụt)');

  console.log('summary :', result.summary);
  console.log('entry   :', result.entry);
  console.log('files   :', result.files.map((f) => `${f.path} (${f.content.length} ký tự)`).join(', '));
  console.log('model   :', result.meta.model);
  console.log('latency :', ms + 'ms');
  line();

  if (errors.length) {
    console.error('❌ FAIL:\n - ' + errors.join('\n - '));
    process.exit(1);
  }
  console.log('✅ OK — model sinh được /index.html hợp lệ. Bước 2 đạt.');
}

main().catch((err) => {
  line();
  console.error('❌ Lỗi khi gọi model:\n', err.message);
  if (err.raw) console.error('\n--- Output thô của model (cắt 2000 ký tự) ---\n', err.raw);
  console.error('\nGợi ý: kiểm tra QWEN_BASE_URL / QWEN_API_KEY / QWEN_MODEL trong server/.env.');
  process.exit(1);
});
