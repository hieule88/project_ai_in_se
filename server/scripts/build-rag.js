/**
 * BUILD RAG — nạp kho component vào vector store (chạy 1 lần, hoặc khi đổi kho).
 * Chạy:  cd server && npm run build:rag
 *
 * Quy trình: đọc components.js -> embed local (miễn phí) -> addAll vào store
 * (memory: ghi rag-index.json | chroma: upsert collection).
 *
 * KHÔNG gọi model sinh code, KHÔNG tốn tiền.
 */
import 'dotenv/config';
import { components, buildEmbedText } from '../src/rag/components.js';
import { embedTexts, MODEL } from '../src/rag/embed.js';
import { getStore, storeKind } from '../src/rag/store.js';
import { listUserComponents } from '../src/rag/userComponents.js';

async function main() {
  // Gộp kho tĩnh + component do end-user thêm (để không bị mất khi build lại).
  const userComps = listUserComponents();
  const all = [...components, ...userComps];
  console.log(
    `[build:rag] store = ${storeKind()} | model = ${MODEL} | ${all.length} component (built-in ${components.length} + user ${userComps.length})`
  );
  console.log('[build:rag] đang embed (lần đầu sẽ tải model về cache, chờ chút)...');

  const texts = all.map(buildEmbedText);
  const t0 = Date.now();
  const embeddings = await embedTexts(texts);
  console.log(`[build:rag] embed xong ${embeddings.length} vector (${embeddings[0].length} chiều) trong ${Date.now() - t0}ms`);

  const store = getStore();
  const n = await store.addAll(all, embeddings);
  console.log(`[build:rag] ✅ đã nạp ${n} component vào store "${storeKind()}".`);
  if (storeKind() === 'memory') {
    console.log('[build:rag] index lưu tại server/rag-index.json — sẵn sàng truy xuất.');
  }
}

main().catch((err) => {
  console.error('[build:rag] ❌ lỗi:', err.message);
  if (storeKind() === 'chroma') {
    console.error('Gợi ý: đảm bảo Chroma đang chạy (chroma run --path ./chroma_db) và CHROMA_URL đúng.');
  }
  process.exit(1);
});
