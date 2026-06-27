import { mockProjectRaw } from './prompts/codegen.js';

/**
 * Gọi model theo chuẩn OpenAI-compatible /chat/completions.
 * Trả về CHUỖI text thô (raw) từ model — việc parse JSON do parser.js lo.
 *
 * Lưu ý: nhiều nhà cung cấp (DashScope, OpenRouter, vLLM self-host) đều
 * expose endpoint OpenAI-compatible. Nếu Qwen3-Coder-Next dùng schema khác,
 * chỉ cần sửa DUY NHẤT hàm này — phần còn lại không đổi.
 *
 * Cấu hình qua .env (xem .env.example):
 *   QWEN_BASE_URL, QWEN_API_KEY, QWEN_MODEL  — bắt buộc khi MOCK_MODE=0
 *   QWEN_MAX_TOKENS   (mặc định 8000) — 1 trang HTML đầy đủ cần nhiều token, tránh bị cắt cụt
 *   QWEN_TIMEOUT_MS   (mặc định 120000) — hủy request nếu model treo
 *   QWEN_JSON_MODE=1  — bật response_format json_object nếu provider hỗ trợ (DashScope/OpenRouter có)
 */
export async function qwenChat(
  messages,
  { temperature = 0.2, model, baseUrl, apiKey, maxTokens, jsonMode, tokenParam, omitTemperature } = {}
) {
  if (process.env.MOCK_MODE === '1') {
    // Chạy thử không cần API key — trả về project mẫu sau ~300ms.
    await new Promise((r) => setTimeout(r, 300));
    return mockProjectRaw;
  }

  // Cho phép override (model/baseUrl/apiKey) để SO SÁNH NHIỀU MODEL; mặc định lấy từ .env.
  const base = (baseUrl || process.env.QWEN_BASE_URL)?.replace(/\/$/, '');
  const key = apiKey || process.env.QWEN_API_KEY;
  const modelName = model || process.env.QWEN_MODEL;
  if (!base) throw new Error('Thiếu base URL (QWEN_BASE_URL) — hoặc đặt MOCK_MODE=1 để chạy mock');
  if (!key) throw new Error('Thiếu API key');
  if (!modelName) throw new Error('Thiếu tên model');
  const url = `${base}/chat/completions`;

  const maxTok = Number(maxTokens) || Number(process.env.QWEN_MAX_TOKENS) || 16000; // override theo model nếu có
  const timeoutMs = Number(process.env.QWEN_TIMEOUT_MS) || 120000;

  const body = { model: modelName, messages };
  // Một số model (GPT-5 đời mới) không nhận temperature → cho phép bỏ.
  if (!omitTemperature) body.temperature = temperature;
  // OpenAI mới dùng 'max_completion_tokens' thay 'max_tokens' → cho phép đổi tên tham số.
  body[tokenParam || 'max_tokens'] = maxTok;
  // JSON mode: per-model override (jsonMode) > env QWEN_JSON_MODE. Có model không hỗ trợ -> tắt.
  const useJson = jsonMode !== undefined ? jsonMode : process.env.QWEN_JSON_MODE === '1';
  if (useJson) body.response_format = { type: 'json_object' };

  // Timeout: tránh request treo vô hạn khi endpoint/model chậm.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`Model quá thời gian (>${timeoutMs}ms) tại ${url}`);
    }
    // Lỗi mạng/DNS/cert — báo rõ URL để dễ kiểm chứng endpoint.
    throw new Error(`Không kết nối được model tại ${url}: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Model API ${res.status} (${url}): ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Model trả về rỗng (không có choices[0].message.content): ${JSON.stringify(data).slice(0, 300)}`);
  }
  // Bị cắt vì chạm trần token → báo rõ thay vì để parser ném "JSON sai" khó hiểu.
  const finish = data?.choices?.[0]?.finish_reason;
  if (finish === 'length') {
    throw new Error(
      `Output bị CẮT CỤT (finish_reason=length) vì chạm max_tokens=${maxTok}. ` +
        `Tăng QWEN_MAX_TOKENS trong server/.env rồi khởi động lại server.`
    );
  }
  return content;
}
