/**
 * INGEST — thêm component lúc chạy (end-user): validate -> lưu -> embed -> upsert store.
 * Dùng bởi endpoint POST /api/components.
 */
import { embedTexts } from './embed.js';
import { getStore } from './store.js';
import { buildEmbedText, components as builtin } from './components.js';
import { addUserComponent, listUserComponents } from './userComponents.js';

/**
 * Thêm 1 component và nạp ngay vào vector store (không cần build:rag lại).
 * @returns component đã chuẩn hóa (kèm id sinh tự động).
 */
export async function addComponent(input) {
  const item = addUserComponent(input); // validate + lưu user-components.json + sinh id
  try {
    const [embedding] = await embedTexts([buildEmbedText(item)]);
    await getStore().upsertItems([item], [embedding]);
  } catch (err) {
    // Đã lưu vào file rồi; nếu store lỗi (vd chưa build:rag) thì báo rõ.
    throw new Error(
      `Đã lưu component nhưng chưa nạp được vào store: ${err.message}. ` +
        `Thử "npm run build:rag" để nạp lại toàn bộ.`
    );
  }
  return item;
}

/** Thống kê kho: số built-in + danh sách component user (gọn, không kèm code). */
export function listAllComponents() {
  return {
    builtin: builtin.length,
    user: listUserComponents().map((c) => ({ id: c.id, name: c.name, tags: c.tags, brand: c.brand || '' })),
  };
}
