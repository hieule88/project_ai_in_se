/**
 * RETRIEVE — truy xuất top-k component liên quan tới mô tả của người dùng.
 *
 * Đây là hàm pipeline.js gọi để thay cho `retrievedComponents = []`.
 * Kết quả được nhồi vào prompt Code Agent (xem prompts/codegen.js -> ragBlock).
 *
 * Bật/tắt bằng env RAG_ENABLED (mặc định bật). Số lượng lấy về: RAG_TOP_K (mặc định 4).
 */
import { embedText } from './embed.js';
import { getStore } from './store.js';

export function ragEnabled() {
  return process.env.RAG_ENABLED !== '0';
}

/**
 * @returns {Promise<Array<{id,name,description,tags,code,score}>>}
 *   Mảng rỗng nếu RAG tắt. Ném lỗi nếu store gặp sự cố (pipeline tự bắt & fallback).
 */
export async function retrieveComponents({ description, brandId = null, k } = {}) {
  if (!ragEnabled()) return [];
  if (!description || !description.trim()) return [];

  const topK = Number(k) || Number(process.env.RAG_TOP_K) || 6;
  const queryVec = await embedText(description);
  const store = getStore();

  // Có brand: lấy dư rồi cộng điểm ưu tiên cho component của brand, sắp lại, cắt top-k.
  const fetchK = brandId ? topK + 6 : topK;
  const BRAND_BOOST = Number(process.env.RAG_BRAND_BOOST) || 0.15;
  let hits = await store.query(queryVec, fetchK, { brand: brandId || undefined });

  if (brandId) {
    hits = hits
      .map((h) => ({ ...h, score: (h.score || 0) + (h.brand === brandId ? BRAND_BOOST : 0) }))
      .sort((a, b) => b.score - a.score);
  }
  hits = hits.slice(0, topK);

  // Chỉ giữ thông tin cần cho prompt (bỏ embedding, giữ name/code/score...).
  return hits.map((h) => ({
    id: h.id,
    name: h.name,
    description: h.description,
    tags: h.tags,
    code: h.code,
    score: h.score,
  }));
}
