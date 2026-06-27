/**
 * EVAL CONSISTENCY — chứng minh RAG bằng TÍNH NHẤT QUÁN PHONG CÁCH giữa nhiều trang cùng site.
 * Chạy:  cd server && npm run eval:consistency
 *
 * Kịch bản (brand DBEE):
 *   Trang 1 = trang chủ; Trang 2 = trang lịch trình khóa học.
 *   Sinh cả 2 ở RAG ON và RAG OFF (đều kèm brand DBEE).
 *
 * Lập luận:
 *   - Brand (màu/font) được nhồi prompt BẤT KỂ RAG → màu thương hiệu giống nhau ở cả ON/OFF.
 *   - RAG mới làm 2 trang DÙNG CHUNG bộ component → cấu trúc/class CSS trùng nhau (như cùng 1 site).
 *     RAG OFF: mỗi trang tự bịa markup → cùng màu nhưng bố cục lệch → KHÔNG nhất quán.
 *
 * Chỉ số (chỉ dùng metric có trong tài liệu):
 *   - Text similarity (token overlap, kiểu token-set/Jaccard) [article] = |c1 ∩ c2| / |c1 ∪ c2| trên tập class CSS.
 *   - Faithfulness (RAGAS): #component kho dùng lại ở CẢ 2 trang (chung "bộ khung" header/footer/card…).
 *
 * Ngoài ra lưu 4 file HTML ra server/eval-consistency/ để CHỤP MÀN HÌNH so sánh trực quan.
 *
 * ⚠️ Cần MOCK_MODE=0 (model thật) và brand "dbee" tồn tại (server/brands.json).
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';
import { getBrand } from '../src/brands.js';
import { components as builtin } from '../src/rag/components.js';
import { listUserComponents } from '../src/rag/userComponents.js';

const BRAND_ID = 'dbee';
const PAGES = [
  { key: 'home', desc: 'Trang chủ website cho trung tâm dạy lập trình DBEE: header có logo + menu, hero giới thiệu, các khóa học nổi bật, cảm nhận học viên, footer.' },
  { key: 'schedule', desc: 'Trang lịch trình khóa học của trung tâm DBEE: header có logo + menu, danh sách lịch khai giảng theo từng khóa, nút đăng ký, footer.' },
];

const LIBRARY = [...builtin, ...listUserComponents()];
const OUT_DIR = fileURLToPath(new URL('../eval-consistency/', import.meta.url));

function classTokens(html) {
  const out = new Set();
  const re = /class\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) for (const t of m[1].split(/\s+/)) if (t.length >= 3) out.add(t);
  return out;
}
function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
/** component "dùng lại" trong 1 trang: >=2 class đặc trưng của nó có trong trang. */
function reusedSet(outClasses) {
  const ids = new Set();
  for (const c of LIBRARY) {
    const cs = classTokens(c.code);
    let inter = 0;
    for (const t of cs) if (outClasses.has(t)) inter++;
    if (inter >= 2) ids.add(c.id);
  }
  return ids;
}

async function genPage(desc) {
  const r = await runGenerate({ description: desc, language: 'vi', brandId: BRAND_ID });
  const idx = r.files.find((f) => f.path === '/index.html') || r.files[0];
  return idx ? idx.content : '';
}

async function runMode(ragOn, brand) {
  process.env.RAG_ENABLED = ragOn ? '1' : '0';
  const label = ragOn ? 'on' : 'off';
  const htmls = {};
  for (const p of PAGES) {
    process.stdout.write(`  [${label}] sinh ${p.key}… `);
    htmls[p.key] = await genPage(p.desc);
    writeFileSync(`${OUT_DIR}${label}-${p.key}.html`, htmls[p.key]);
    process.stdout.write('xong\n');
  }
  const c1 = classTokens(htmls.home);
  const c2 = classTokens(htmls.schedule);
  const r1 = reusedSet(c1);
  const r2 = reusedSet(c2);
  const sharedComps = [...r1].filter((id) => r2.has(id));

  return {
    jaccard: jaccard(c1, c2) * 100, // Text similarity (token overlap) [article]
    reusedHome: r1.size,
    reusedSchedule: r2.size,
    sharedComps: sharedComps.length, // Faithfulness — component dùng chung cả 2 trang
    sharedIds: sharedComps,
  };
}

async function main() {
  if (process.env.MOCK_MODE === '1') {
    console.log('⚠️  MOCK: output cố định → 2 chế độ giống nhau. Cần MOCK_MODE=0 để có ý nghĩa.');
  }
  const brand = getBrand(BRAND_ID);
  if (!brand) {
    console.error(`❌ Không thấy brand "${BRAND_ID}" trong brands.json. Tạo brand này trước (UI hoặc POST /api/brands).`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n=== EVAL CONSISTENCY · brand "${brand.name}" · ${process.env.QWEN_MODEL || 'mock'} ===`);
  console.log(`Trang 1: trang chủ | Trang 2: lịch trình khóa học | màu brand: ${brand.colors?.primary}\n`);

  console.log('[RAG ON]');
  const on = await runMode(true, brand);
  console.log('[RAG OFF]');
  const off = await runMode(false, brand);

  const pad = (s, w) => String(s).padEnd(w);
  const f = (v) => `${v.toFixed(v % 1 === 0 ? 0 : 1)}`;
  const rows = [
    ['Text similarity — trùng class CSS (Jaccard)', f(on.jaccard) + '%', f(off.jaccard) + '%'],
    ['Faithfulness — component dùng chung CẢ 2 trang', f(on.sharedComps), f(off.sharedComps)],
    ['Faithfulness — component tái dùng (chủ / lịch trình)', `${on.reusedHome}/${on.reusedSchedule}`, `${off.reusedHome}/${off.reusedSchedule}`],
  ];
  console.log('\n' + `${pad('Chỉ số (nhất quán giữa 2 trang)', 44)}${pad('RAG ON', 10)}RAG OFF`);
  console.log('─'.repeat(64));
  for (const [k, a, b] of rows) console.log(`${pad(k, 44)}${pad(a, 10)}${b}`);

  console.log('\nKết luận mong đợi:');
  console.log('  • Text similarity (Jaccard) & Faithfulness (component-chung) CAO ở RAG ON, THẤP ở OFF');
  console.log('    → RAG tạo nhất quán giao diện giữa các trang (theo metric tài liệu).');
  if (on.sharedIds.length) console.log(`  • Component dùng chung (ON): ${on.sharedIds.join(', ')}`);
  console.log(`\n📂 Mở 4 file trong server/eval-consistency/ để chụp màn hình so sánh trực quan:`);
  console.log('   on-home.html · on-schedule.html · off-home.html · off-schedule.html');

  writeFileSync(
    fileURLToPath(new URL('../eval-consistency-results.json', import.meta.url)),
    JSON.stringify({ when: new Date().toISOString(), brand: brand.name, model: process.env.QWEN_MODEL, ragOn: on, ragOff: off }, null, 2)
  );
}

main().catch((err) => {
  console.error('[eval:consistency] ❌ lỗi:', err.message);
  process.exit(1);
});
