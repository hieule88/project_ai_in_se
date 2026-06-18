/**
 * INGEST — thêm component lúc chạy (end-user): validate -> lưu -> embed -> upsert store.
 * Dùng bởi endpoint POST /api/components.
 */
import { embedTexts } from './embed.js';
import { getStore } from './store.js';
import { buildEmbedText, components as builtin } from './components.js';
import {
  addUserComponent,
  updateUserComponent,
  deleteUserComponent,
  listUserComponents,
} from './userComponents.js';

/** Nạp 1 component vào vector store (embed + upsert). Báo lỗi rõ nếu chưa build:rag. */
async function indexComponent(item) {
  try {
    const [embedding] = await embedTexts([buildEmbedText(item)]);
    await getStore().upsertItems([item], [embedding]);
  } catch (err) {
    throw new Error(
      `Đã lưu vào file nhưng chưa nạp được vào store: ${err.message}. Thử "npm run build:rag" để nạp lại.`
    );
  }
}

/** Thêm component + nạp ngay vào store (không cần build:rag lại). */
export async function addComponent(input) {
  const item = addUserComponent(input); // validate + lưu + sinh id
  await indexComponent(item);
  return item;
}

/** Sửa component user + cập nhật store (upsert theo id, không cần build lại). */
export async function updateComponent(id, input) {
  const item = updateUserComponent(id, input);
  await indexComponent(item);
  return item;
}

/** Xóa component user khỏi file + store. */
export async function removeComponent(id) {
  const removed = deleteUserComponent(id); // ném lỗi nếu là built-in / không tồn tại
  try {
    await getStore().removeItems([id]);
  } catch {
    // store chưa build cũng không sao — đã xóa khỏi file, build:rag sau sẽ đồng bộ.
  }
  return removed;
}

/** Kho: số built-in + danh sách FULL component user (kèm code, để UI sửa). */
export function listAllComponents() {
  return {
    builtin: builtin.length,
    user: listUserComponents(),
  };
}
