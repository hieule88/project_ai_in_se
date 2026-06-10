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
export async function qwenChat(messages, { temperature = 0.2 } = {}) {
  if (process.env.MOCK_MODE === '1') {
    // Chạy thử không cần API key — trả về project mẫu sau ~300ms.
    await new Promise((r) => setTimeout(r, 300));
    return mockProjectRaw;
  }

  const base = process.env.QWEN_BASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Thiếu QWEN_BASE_URL trong .env (hoặc đặt MOCK_MODE=1 để chạy mock)');
  if (!process.env.QWEN_API_KEY) throw new Error('Thiếu QWEN_API_KEY trong .env');
  if (!process.env.QWEN_MODEL) throw new Error('Thiếu QWEN_MODEL trong .env');
  const url = `${base}/chat/completions`;

  const maxTokens = Number(process.env.QWEN_MAX_TOKENS) || 16000;
  const timeoutMs = Number(process.env.QWEN_TIMEOUT_MS) || 120000;

  const body = {
    model: process.env.QWEN_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages,
  };
  // JSON mode: ép model trả đúng 1 object JSON (giảm trường hợp parser phải "cứu").
  if (process.env.QWEN_JSON_MODE === '1') {
    body.response_format = { type: 'json_object' };
  }

  // Timeout: tránh request treo vô hạn khi endpoint/model chậm.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
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
      `Output bị CẮT CỤT (finish_reason=length) vì chạm QWEN_MAX_TOKENS=${maxTokens}. ` +
        `Tăng QWEN_MAX_TOKENS trong server/.env rồi khởi động lại server.`
    );
  }
  return content;
}
