/**
 * PARSER — biến output thô của model thành { summary, entry, files[] }.
 * Phòng thủ: model đôi khi bọc JSON trong ```json ... ``` hoặc kèm lời dẫn.
 */
export function parseProject(raw) {
  const jsonText = extractJson(raw);
  let obj;
  try {
    obj = JSON.parse(jsonText);
  } catch (e) {
    throw new ParseError('Không parse được JSON từ model', raw);
  }

  if (!obj || !Array.isArray(obj.files) || obj.files.length === 0) {
    throw new ParseError('JSON thiếu trường "files"', raw);
  }

  const files = obj.files
    .filter((f) => f && typeof f.path === 'string' && typeof f.content === 'string')
    .map((f) => ({
      path: f.path.startsWith('/') ? f.path : `/${f.path}`,
      content: f.content,
    }));

  if (files.length === 0) throw new ParseError('Không có file hợp lệ', raw);

  const entry = files.some((f) => f.path === obj.entry) ? obj.entry : files[0].path;

  return {
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    entry,
    files,
  };
}

/** Lấy đoạn JSON: ưu tiên trong ```json fence, sau đó cắt từ { đầu tới } cuối. */
function extractJson(raw) {
  const text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1);
  return text;
}

export class ParseError extends Error {
  constructor(message, raw) {
    super(message);
    this.name = 'ParseError';
    this.raw = String(raw).slice(0, 2000);
  }
}
