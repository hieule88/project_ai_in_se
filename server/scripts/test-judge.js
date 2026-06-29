/**
 * PRE-FLIGHT GIÁM KHẢO — kiểm tra JUDGE_* (key + slug + quyền) bằng ĐÚNG 1 call nhỏ,
 * TRƯỚC khi chạy eval:models, để khỏi tốn token free của các model dự thi nếu judge hỏng.
 * Chạy:  cd server && npm run test:judge
 */
import 'dotenv/config';
import { qwenChat } from '../src/qwenClient.js';
import { JUDGE } from '../eval-models.config.js';

if (!JUDGE) {
  console.error('❌ Chưa cấu hình giám khảo. Thêm JUDGE_API_KEY (+ JUDGE_BASE_URL/JUDGE_MODEL) vào server/.env');
  process.exit(1);
}
console.log(`Kiểm tra giám khảo: ${JUDGE.label}`);
console.log(`  baseUrl=${JUDGE.baseUrl}  model=${JUDGE.model}  jsonMode=${!!JUDGE.jsonMode}`);

const html = '<!doctype html><html><body><h1>DBEE</h1><button class="dbee-btn">Đăng ký</button></body></html>';
const messages = [
  { role: 'system', content: 'Bạn là giám khảo web. Chỉ trả về DUY NHẤT một JSON.' },
  {
    role: 'user',
    content:
      `Chấm 1–5 trang sau, trả JSON: {"relevance":n,"design":n,"codeQuality":n,"overall":n,"reason":"<1 câu>"}\n` +
      `Yêu cầu: trang đăng ký DBEE.\nHTML:\n${html}`,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function callWithRetry() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await qwenChat(messages, { ...JUDGE, temperature: 0 }); // dùng JUDGE.maxTokens (đủ rộng cho reasoning)
    } catch (e) {
      if (attempt < 3 && /429|503|rate|unavailable|overload|high demand|temporarily|too[ _]?many/i.test(e.message)) {
        const sec = Number((e.message.match(/retry_after_seconds"?\s*:?\s*(\d+)/i) || [])[1]) || 30;
        console.log(`⏳ 429 tạm thời (free model busy) — chờ ${sec + 2}s rồi thử lại (${attempt + 1}/3)...`);
        await sleep((sec + 2) * 1000);
        continue;
      }
      throw e;
    }
  }
}

try {
  const out = await callWithRetry();
  console.log('\n✅ Gọi giám khảo OK. Phản hồi thô (cắt 500 ký tự):\n' + (out || '').slice(0, 500));
  const m = out && out.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]);
      console.log('\n✅ Bóc & parse được JSON:', JSON.stringify(o));
      console.log('→ Sẵn sàng. Chạy: npm run eval:models');
    } catch {
      console.log('\n⚠️  Có khối {...} nhưng parse lỗi — eval vẫn chạy, cột Judge có thể trống. Cân nhắc đổi JUDGE_MODEL.');
    }
  } else {
    console.log('\n⚠️  Không thấy JSON trong phản hồi — eval vẫn chạy nhưng cột Judge sẽ trống. Thử bật JUDGE_JSON_MODE=1 hoặc đổi model.');
  }
} catch (e) {
  console.error('\n❌ Giám khảo LỖI:', e.message);
  if (/not_found|404|does not exist|no endpoints/i.test(e.message)) {
    console.error(`\n→ Lấy danh sách model khả dụng tại ${JUDGE.baseUrl}/models ...`);
    try {
      const r = await fetch(`${JUDGE.baseUrl}/models`, { headers: { Authorization: `Bearer ${JUDGE.apiKey}` } });
      const j = await r.json();
      const ids = (j.data || j.models || []).map((m) => m.id || m.name).filter(Boolean).sort();
      console.error('   Model khả dụng:\n   - ' + (ids.length ? ids.join('\n   - ') : '(rỗng)'));
      console.error('\n   → Chọn 1 id TRUNG LẬP (KHÔNG phải gpt-oss/qwen/gemini) dán vào JUDGE_MODEL.');
    } catch (e2) {
      console.error('   (không lấy được danh sách: ' + e2.message + ')');
    }
  } else {
    console.error('   • "No endpoints / data policy" → https://openrouter.ai/settings/privacy bật model free.');
    console.error('   • 401/403 → sai JUDGE_API_KEY.');
  }
  process.exit(1);
}
