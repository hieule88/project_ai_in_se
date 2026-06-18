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

/** Chuẩn hóa tags: nhận mảng hoặc chuỗi "a, b, c". */
function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Validate code là HTML snippet hợp lệ. */
function assertValidCode(code) {
  if (!code || !String(code).trim()) throw new Error('Thiếu "code" (snippet HTML)');
  if (!/[<][a-z!]/i.test(code)) throw new Error('"code" không giống HTML');
}

export function getUserComponent(id) {
  return listUserComponents().find((c) => c.id === id) || null;
}

/**
 * Thêm 1 component user. Validate, sinh id, lưu file. Trả về component đã chuẩn hóa.
 */
export function addUserComponent({ name, description, tags, brand, code } = {}) {
  if (!name || !String(name).trim()) throw new Error('Thiếu "name"');
  assertValidCode(code);

  const item = {
    id: makeId(name),
    name: String(name).trim(),
    description: String(description || name).trim(),
    tags: normalizeTags(tags),
    ...(brand ? { brand: String(brand) } : {}),
    code: String(code),
  };
  listUserComponents().push(item);
  save();
  return item;
}

/**
 * Sửa 1 component user (theo id). CHỈ sửa được component user, không sửa component dựng sẵn.
 * Giữ nguyên id (để upsert vào store đúng chỗ). Trả về component sau khi sửa.
 */
export function updateUserComponent(id, { name, description, tags, brand, code } = {}) {
  const list = listUserComponents();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    const builtinHit = builtin.some((c) => c.id === id);
    throw new Error(builtinHit ? 'Không sửa được component dựng sẵn' : 'Không tìm thấy component');
  }
  if (name !== undefined && !String(name).trim()) throw new Error('Thiếu "name"');
  if (code !== undefined) assertValidCode(code);

  const cur = list[idx];
  const updated = { ...cur };
  if (name !== undefined) updated.name = String(name).trim();
  if (description !== undefined) updated.description = String(description).trim();
  if (tags !== undefined) updated.tags = normalizeTags(tags);
  if (code !== undefined) updated.code = String(code);
  if (brand !== undefined) {
    if (brand) updated.brand = String(brand);
    else delete updated.brand; // brand rỗng = gỡ gắn brand
  }
  list[idx] = updated;
  save();
  return updated;
}

/** Xóa 1 component user (theo id). Chỉ xóa được component user. Trả về component đã xóa. */
export function deleteUserComponent(id) {
  const list = listUserComponents();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    const builtinHit = builtin.some((c) => c.id === id);
    throw new Error(builtinHit ? 'Không xóa được component dựng sẵn' : 'Không tìm thấy component');
  }
  const [removed] = list.splice(idx, 1);
  save();
  return removed;
}
