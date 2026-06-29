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

  // 5) Qwen3-Coder (FREE) qua OpenRouter — chỉ cần OPENROUTER_API_KEY. Free ~50 req/ngày.
  {
    label: `OpenRouter (${process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free'})`,
    model: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free' : undefined,
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    maxTokens: 16000,
    jsonMode: true,
  },

  // 6) Gemini Flash (FREE) qua Google AI Studio (endpoint OpenAI-compat). Free ~20 req/ngày.
  {
    label: `Gemini (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})`,
    model: process.env.GEMINI_API_KEY ? process.env.GEMINI_MODEL || 'gemini-2.5-flash' : undefined,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: process.env.GEMINI_API_KEY,
    maxTokens: 32000, // 2.5-flash xuất được nhiều token; 16000 bị cắt cụt trang dài
    jsonMode: true,
  },

  // 7) gpt-oss-120b (FREE) qua Cerebras — limit cao, rất nhanh. Key: https://cloud.cerebras.ai
  {
    label: `Cerebras (${process.env.CEREBRAS_MODEL || 'gpt-oss-120b'})`,
    model: process.env.CEREBRAS_API_KEY ? process.env.CEREBRAS_MODEL || 'gpt-oss-120b' : undefined,
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKey: process.env.CEREBRAS_API_KEY,
    maxTokens: 8000, // free 60K token/phút → giảm output cho đỡ vượt TPM
    delayMs: 20000, // giãn 20s giữa các call để giữ dưới 60K token/phút
    jsonMode: true, // nếu báo lỗi response_format → đổi thành false (parser tự bóc JSON)
  },
].filter((m) => m.model && m.baseUrl && m.apiKey); // chỉ giữ model đã cấu hình đủ key+model

/**
 * GIÁM KHẢO TRUNG LẬP (LLM-as-Judge) — chấm 1–5 mọi bài theo rubric, BLIND (ẩn nhãn model).
 * Nên chọn model KHÔNG nằm trong danh sách dự thi ở trên để tránh self-enhancement bias.
 * Chỉ cần thêm JUDGE_* vào server/.env là bật; thiếu JUDGE_API_KEY → eval:models bỏ qua phần chấm.
 *
 * Gợi ý (trung lập với Qwen/Gemini/gpt-oss đang thi):
 *   - Claude:   JUDGE_BASE_URL=https://api.anthropic.com/v1            JUDGE_MODEL=claude-sonnet-4-6   (jsonMode off)
 *   - DeepSeek: JUDGE_BASE_URL=https://api.deepseek.com                JUDGE_MODEL=deepseek-chat
 *   - OpenRouter (free): JUDGE_BASE_URL=https://openrouter.ai/api/v1   JUDGE_MODEL=deepseek/deepseek-chat:free
 */
export const JUDGE = process.env.JUDGE_API_KEY
  ? {
      label: `Judge: ${process.env.JUDGE_MODEL || 'claude-sonnet-4-6'}`,
      model: process.env.JUDGE_MODEL || 'claude-sonnet-4-6',
      baseUrl: process.env.JUDGE_BASE_URL || 'https://api.anthropic.com/v1',
      apiKey: process.env.JUDGE_API_KEY,
      // Model reasoning (vd GLM/R1) đốt token cho phần "suy nghĩ" trước khi xuất JSON → để rộng.
      maxTokens: Number(process.env.JUDGE_MAX_TOKENS) || 8000,
      jsonMode: process.env.JUDGE_JSON_MODE === '1', // mặc định off (parser tự bóc JSON từ text)
      tokenParam: process.env.JUDGE_TOKEN_PARAM, // vd 'max_completion_tokens' cho GPT đời mới
      omitTemperature: process.env.JUDGE_OMIT_TEMP === '1',
    }
  : null;
