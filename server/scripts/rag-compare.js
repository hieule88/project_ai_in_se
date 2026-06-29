/**
 * SO SÁNH TRỰC QUAN: có-RAG vs KHÔNG-RAG, dùng MODEL TỐT NHẤT (Qwen — theo kết quả eval:models).
 * KHÔNG đo chỉ số — chỉ sinh trang để CHỤP ẢNH minh họa tác dụng của RAG (đồng bộ design-system DBEE).
 * Chạy:  cd server && npm run compare:rag   (cần MOCK_MODE=0)
 *
 * Lưu ý: khi RAG tắt, pipeline không truy xuất component nên KHÔNG chèn theme DBEE
 * → trang sẽ mang "style tự do" của model, làm nổi bật khác biệt so với bản có-RAG.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';

const OUT = fileURLToPath(new URL('../rag-compare/', import.meta.url));
const PROMPTS = [
  { id: 'trang-chu', text: 'Trang chủ trung tâm dạy lập trình DBEE: giới thiệu, khóa học nổi bật, lộ trình, đăng ký tư vấn' },
  { id: 'hoc-phi', text: 'Trang học phí và các gói khóa học của DBEE' },
];

async function gen(text, ragOn) {
  process.env.RAG_ENABLED = ragOn ? '1' : '0';
  // llm mặc định = QWEN_* trong .env (model tốt nhất theo eval:models)
  const r = await runGenerate({ description: text, language: 'vi' });
  const idx = r.files.find((f) => f.path === '/index.html') || r.files[0];
  return idx ? idx.content : '';
}

async function main() {
  if (process.env.MOCK_MODE === '1') {
    console.error('⚠️  Cần MOCK_MODE=0 (model thật).');
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  console.log(`=== SO SÁNH TRỰC QUAN · có-RAG vs KHÔNG-RAG · model: ${process.env.QWEN_MODEL} ===\n`);

  for (const p of PROMPTS) {
    process.stdout.write(`[${p.id}] sinh có-RAG...`);
    const withRag = await gen(p.text, true);
    process.stdout.write(' sinh không-RAG...');
    const noRag = await gen(p.text, false);
    const dir = `${OUT}${p.id}/`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}with-rag.html`, withRag);
    writeFileSync(`${dir}no-rag.html`, noRag);
    console.log(` ✓ (có-RAG ~${withRag.length} / không-RAG ~${noRag.length} ký tự)`);
  }

  console.log(`\n📂 Mở để chụp ảnh: server/rag-compare/<prompt>/with-rag.html  vs  no-rag.html`);
  console.log('→ Chụp 2 ảnh cạnh nhau: CÓ-RAG (đúng nhận diện DBEE: vàng #f2db45, class dbee-*) vs KHÔNG-RAG (style tự do).');
}

main().catch((e) => {
  console.error('[compare:rag] ❌', e.message);
  process.exit(1);
});
