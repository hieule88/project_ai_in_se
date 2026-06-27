/**
 * Cấu hình các MODEL để SO SÁNH (đánh giá multi-model).
 *
 * Tất cả gọi qua chuẩn OpenAI-compatible /chat/completions. Mỗi entry:
 *   { label, model, baseUrl, apiKey, maxTokens?, jsonMode?, tokenParam?, omitTemperature? }
 *   - maxTokens        : trần token output (mỗi model 1 mức; DeepSeek ~8192, Qwen tới 32000…)
 *   - jsonMode         : ép response_format json_object (true/false). Để undefined = theo QWEN_JSON_MODE.
 *   - tokenParam       : 'max_tokens' (mặc định) | 'max_completion_tokens' (OpenAI đời mới).
 *   - omitTemperature  : true nếu model không nhận 'temperature' (vd GPT-5 reasoning).
 *
 * ⚠️ KHÔNG hardcode API key — đặt trong server/.env. Entry nào THIẾU key/model sẽ TỰ bị bỏ qua.
 *    Nên "chỉ cần thêm API key vào .env" là chạy được model tương ứng.
 *
 * Lấy key:
 *   - Anthropic (Claude): https://console.anthropic.com  → ANTHROPIC_API_KEY
 *   - OpenAI (GPT):       https://platform.openai.com     → OPENAI_API_KEY  (+ OPENAI_MODEL = đúng id bạn có)
 *   - DashScope (Qwen):   https://bailian.console.aliyun.com  → đã dùng QWEN_* sẵn
 *   - DeepSeek:           https://platform.deepseek.com   → DEEPSEEK_API_KEY
 */
export const MODELS = [
  // 1) Claude Sonnet 4.6 — qua endpoint OpenAI-compatible của Anthropic.
  //    Anthropic compat chưa chắc hỗ trợ response_format → để jsonMode:false (parser tự bóc JSON).
  {
    label: `Claude (${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'})`,
    model: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6' : undefined,
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 16000,
    jsonMode: false,
  },

  // 2) GPT (OpenAI). Điền OPENAI_MODEL = ĐÚNG id bạn có quyền (vd gpt-5.4 / gpt-4.1...).
  //    GPT-5 đời mới: dùng 'max_completion_tokens' và KHÔNG nhận temperature → bật 2 cờ dưới.
  {
    label: `OpenAI (${process.env.OPENAI_MODEL || 'gpt'})`,
    model: process.env.OPENAI_API_KEY ? process.env.OPENAI_MODEL : undefined,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 16000,
    jsonMode: true,
    tokenParam: 'max_completion_tokens',
    omitTemperature: true,
  },

  // 3) Qwen3-Coder qua DashScope (đang dùng) — lấy từ QWEN_* trong .env.
  {
    label: `Qwen (${process.env.QWEN_MODEL || 'qwen3-coder'})`,
    model: process.env.QWEN_MODEL,
    baseUrl: process.env.QWEN_BASE_URL,
    apiKey: process.env.QWEN_API_KEY,
    maxTokens: 32000,
  },

  // 4) DeepSeek — 'deepseek-chat' (V3; "Coder V2" đã gộp). Output tối đa ~8192.
  {
    label: `DeepSeek (${process.env.DEEPSEEK_MODEL || 'deepseek-chat'})`,
    model: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_MODEL || 'deepseek-chat' : undefined,
    baseUrl: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    maxTokens: 8192,
    jsonMode: true,
  },
].filter((m) => m.model && m.baseUrl && m.apiKey); // chỉ giữ model đã cấu hình đủ key+model
