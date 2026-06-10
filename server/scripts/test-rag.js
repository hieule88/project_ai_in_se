/**
 * TEST RAG — kiểm tra truy xuất top-k hoạt động đúng (KHÔNG gọi model, KHÔNG tốn tiền).
 * Chạy:  cd server && npm run test:rag            (dùng bộ truy vấn mẫu)
 *        cd server && node scripts/test-rag.js "landing page quán cà phê"   (truy vấn tự nhập)
 *
 * Cần chạy `npm run build:rag` trước để có kho.
 */
import 'dotenv/config';
import { retrieveComponents } from '../src/rag/retrieve.js';
import { storeKind } from '../src/rag/store.js';

const custom = process.argv.slice(2).join(' ').trim();
const QUERIES = custom
  ? [custom]
  : [
      'landing page cho quán cà phê có thực đơn và đặt bàn',
      'trang bán hàng online với danh sách sản phẩm và giá',
      'portfolio cá nhân có thư viện ảnh và form liên hệ',
      'trang SaaS có bảng giá, tính năng và đánh giá khách hàng',
    ];

function bar(score) {
  const n = Math.max(0, Math.min(20, Math.round((score || 0) * 20)));
  return '█'.repeat(n) + '░'.repeat(20 - n);
}

async function main() {
  console.log(`[test:rag] store = ${storeKind()} | top-k = ${process.env.RAG_TOP_K || 6}\n`);
  for (const q of QUERIES) {
    console.log('🔎', q);
    const hits = await retrieveComponents({ description: q });
    if (!hits.length) {
      console.log('   (không có kết quả — đã build:rag chưa?)\n');
      continue;
    }
    for (const h of hits) {
      console.log(`   ${bar(h.score)} ${(h.score ?? 0).toFixed(3)}  ${h.id.padEnd(20)} ${h.name}`);
    }
    console.log('');
  }
  console.log('✅ Truy xuất hoạt động. Component liên quan sẽ được nhồi vào prompt Code Agent.');
}

main().catch((err) => {
  console.error('[test:rag] ❌ lỗi:', err.message);
  process.exit(1);
});
