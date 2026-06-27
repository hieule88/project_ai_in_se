/**
 * Cấu hình các MODEL để SO SÁNH (Bước đánh giá multi-model).
 *
 * TẤT CẢ đều dùng chuẩn OpenAI-compatible nên chỉ cần khai báo {label, model, baseUrl, apiKey}.
 * KHÔNG hardcode API key — đặt trong server/.env. Model nào thiếu model/key sẽ tự bị bỏ qua.
 *
 * Lấy token MIỄN PHÍ ở đâu (tự tạo key của bạn):
 *   - OpenRouter  https://openrouter.ai/keys  → nhiều model, có bản ":free". Lọc model free:
 *                 https://openrouter.ai/models?max_price=0  (COPY ĐÚNG slug rồi điền vào .env)
 *   - Groq        https://console.groq.com     (free tier, rất nhanh; baseUrl https://api.groq.com/openai/v1)
 *   - Google Gemini (free tier, endpoint OpenAI-compat):
 *                 https://generativelanguage.googleapis.com/v1beta/openai
 *   - DashScope   (đang dùng cho Qwen) — đã cấu hình sẵn ở dòng đầu.
 */
export const MODELS = [
  // 1) Qwen3-Coder-Next qua DashScope (đang dùng) — lấy từ .env hiện có
  {
    label: 'qwen3-coder-next (DashScope)',
    model: process.env.QWEN_MODEL,
    baseUrl: process.env.QWEN_BASE_URL,
    apiKey: process.env.QWEN_API_KEY,
  },

  // 2-3) OpenRouter free — điền OPENROUTER_API_KEY + slug free (OR_MODEL_A/B) vào .env
  {
    label: process.env.OR_MODEL_A || 'OpenRouter A',
    model: process.env.OR_MODEL_A, // vd: 'qwen/qwen-2.5-coder-32b-instruct:free' (TỰ KIỂM CHỨNG slug còn free)
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  {
    label: process.env.OR_MODEL_B || 'OpenRouter B',
    model: process.env.OR_MODEL_B, // vd một model free khác (Llama/DeepSeek/Gemini/GLM…)
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  },

  // 4) Groq free (tùy chọn) — điền GROQ_API_KEY + GROQ_MODEL
  {
    label: process.env.GROQ_MODEL || 'Groq',
    model: process.env.GROQ_MODEL,
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
  },
].filter((m) => m.model && m.baseUrl && m.apiKey); // bỏ model chưa cấu hình đủ
