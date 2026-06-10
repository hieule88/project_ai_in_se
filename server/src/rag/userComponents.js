/**
 * USER COMPONENTS — component do END-USER thêm lúc chạy (ngoài kho tĩnh components.js).
 *
 * Lưu ra file server/user-components.json để:
 *   - sống sót qua restart,
 *   - được build-rag GỘP CÙNG kho tĩnh khi build lại (không bị mất).
 *
 * Đây CHỈ là phần lưu trữ + validate. Việc embed & nạp vào store nằm ở rag/ingest.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { components as builtin } from './components.js';

const FILE = fileURLToPath(new URL('../../user-components.json', import.meta.url)); // server/user-components.json

let _cache = null;

export function listUserComponents() {
  if (_cache) return _cache;
  if (existsSync(FILE)) {
    try {
      _cache = JSON.parse(readFileSync(FILE, 'utf8'));
    } catch {
      _cache = [];
    }
  } else {
    _cache = [];
  }
  return _cache;
}

function save() {
  writeFileSync(FILE, JSON.stringify(_cache, null, 2));
}

/** id duy nhất (slug) — không trùng cả kho tĩnh lẫn user. */
function makeId(name) {
  const base =
    String(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'component';
  const taken = new Set([...builtin.map((c) => c.id), ...listUserComponents().map((c) => c.id)]);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/**
 * Thêm 1 component user. Validate, sinh id, lưu file. Trả về component đã chuẩn hóa.
 * Ném Error nếu thiếu trường bắt buộc.
 */
export function addUserComponent({ name, description, tags, brand, code } = {}) {
  if (!name || !String(name).trim()) throw new Error('Thiếu "name"');
  if (!code || !String(code).trim()) throw new Error('Thiếu "code" (snippet HTML)');
  if (!/[<][a-z!]/i.test(code)) throw new Error('"code" không giống HTML');

  const item = {
    id: makeId(name),
    name: String(name).trim(),
    description: String(description || name).trim(),
    tags: Array.isArray(tags)
      ? tags
      : String(tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    ...(brand ? { brand: String(brand) } : {}),
    code: String(code),
  };
  listUserComponents().push(item);
  save();
  return item;
}
