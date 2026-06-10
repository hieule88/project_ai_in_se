/**
 * TEST BRAND (Bước 7) — kiểm tra ưu tiên component theo brand khi truy xuất.
 * Chạy:  cd server && npm run test:brand
 * Yêu cầu: đã `npm run build:rag` SAU khi thêm component brand.
 *
 * KHÔNG gọi model, KHÔNG tốn tiền.
 */
import 'dotenv/config';
import { retrieveComponents } from '../src/rag/retrieve.js';

const QUERY = 'landing page quán cà phê có hero và menu';
const BRAND = 'acme-coffee';

function show(title, hits) {
  console.log(title);
  for (const h of hits) {
    const tag = h.id.startsWith('acme-') ? ' ⭐brand' : '';
    console.log(`   ${(h.score ?? 0).toFixed(3)}  ${h.id}${tag}`);
  }
  console.log('');
}

async function main() {
  const without = await retrieveComponents({ description: QUERY });
  const withBrand = await retrieveComponents({ description: QUERY, brandId: BRAND });

  console.log(`🔎 "${QUERY}"\n`);
  show('— KHÔNG brand (chỉ component dùng chung):', without);
  show(`— CÓ brand "${BRAND}" (ưu tiên component brand):`, withBrand);

  const noBrandLeak = !without.some((h) => h.id.startsWith('acme-'));
  const brandSurfaced = withBrand.some((h) => h.id.startsWith('acme-'));

  console.log(`${noBrandLeak ? '✓' : '✗'} Không rò component brand khi không chọn brand`);
  console.log(`${brandSurfaced ? '✓' : '✗'} Component brand được ưu tiên khi chọn brand`);

  const ok = noBrandLeak && brandSurfaced;
  console.log(`\n${ok ? '✅ OK' : '❌ FAIL'}`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('[test:brand] ❌ lỗi:', err.message);
  process.exit(1);
});
