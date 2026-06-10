/**
 * EMBEDDING LOCAL — chạy hẳn trong Node, KHÔNG gọi API, KHÔNG tốn tiền.
 *
 * Dùng @xenova/transformers (Transformers.js) với model ĐA NGÔN NGỮ
 * paraphrase-multilingual-MiniLM-L12-v2:
 *   - 384 chiều, hỗ trợ TIẾNG VIỆT tốt (quan trọng vì truy vấn chủ yếu tiếng Việt).
 *   - Lần chạy ĐẦU TIÊN sẽ tải model từ HuggingFace về cache máy, sau đó offline.
 *   - Đổi model qua env EMBED_MODEL nếu muốn (nhớ build:rag lại; phải cùng số chiều).
 *
 * (Trước đây dùng all-MiniLM-L6-v2 tiếng Anh → truy xuất tiếng Việt kém, đã thay.)
 *
 * Vector trả về đã được CHUẨN HÓA (normalize) → cosine similarity = tích vô hướng.
 */

export const MODEL = process.env.EMBED_MODEL || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const EMBED_DIM = 384;

let _embedderPromise = null;

/** Tải model 1 lần rồi tái dùng (lazy + cache trong tiến trình). */
async function getEmbedder() {
  if (!_embedderPromise) {
    // import động để không kéo thư viện nặng khi MOCK không cần RAG.
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // chỉ tải từ hub rồi cache
    _embedderPromise = pipeline('feature-extraction', MODEL);
  }
  return _embedderPromise;
}

/** Embed một mảng text -> mảng vector (number[][]). */
export async function embedTexts(texts) {
  const embedder = await getEmbedder();
  const vectors = [];
  for (const text of texts) {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    vectors.push(Array.from(output.data));
  }
  return vectors;
}

/** Embed một text -> 1 vector (number[]). */
export async function embedText(text) {
  const [v] = await embedTexts([text]);
  return v;
}
