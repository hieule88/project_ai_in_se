import { useEffect, useState } from 'react';
import * as api from '../api.js';

/**
 * ComponentPanel — quản lý kho RAG do END-USER tự thêm: THÊM / SỬA / XÓA, có xem trước.
 * Chỉ thao tác trên component user (component dựng sẵn chỉ đếm số lượng, không sửa/xóa).
 */
const EMPTY = { name: '', description: '', tags: '', brand: '', code: '' };

export default function ComponentPanel() {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState({ builtin: 0, user: [] });

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null); // null = đang thêm mới
  const [preview, setPreview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setStats(await api.listComponents());
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      description: c.description || '',
      tags: (c.tags || []).join(', '),
      brand: c.brand || '',
      code: c.code || '',
    });
    setMsg('');
    setError('');
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    setError('');
    setMsg('');
    const payload = {
      name: form.name,
      description: form.description,
      tags: form.tags,
      brand: form.brand || undefined,
      code: form.code,
    };
    try {
      if (editingId) {
        const c = await api.updateComponent(editingId, payload);
        setMsg(`Đã lưu thay đổi "${c.id}".`);
      } else {
        const c = await api.createComponent(payload);
        setMsg(`Đã thêm "${c.id}" vào kho RAG.`);
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Xóa component "${c.name}" khỏi kho RAG?`)) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api.deleteComponent(c.id);
      if (editingId === c.id) resetForm();
      setMsg(`Đã xóa "${c.id}".`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const users = stats.user || [];
  const total = stats.builtin + users.length;
  const canSubmit = form.name.trim() && form.code.trim() && !busy;

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
      >
        <span>🧩 Kho component RAG</span>
        <span className="text-slate-500">{total} ({users.length} của bạn)</span>
      </button>

      {open && (
        <div className="mt-2 p-2 rounded border border-slate-700 bg-slate-900/60 grid gap-3">
          {/* ---- Form thêm/sửa ---- */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                {editingId ? `Sửa: ${editingId}` : '➕ Thêm component mới'}
              </span>
              {editingId && (
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-200">
                  Hủy
                </button>
              )}
            </div>

            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Tên component (vd: Bảng giá kiểu VN)"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={form.description}
              onChange={set('description')}
              placeholder="Mô tả giàu từ khóa (Việt + Anh) — quyết định truy xuất"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <div className="flex gap-2">
              <input
                value={form.tags}
                onChange={set('tags')}
                placeholder="tags, cách nhau dấu phẩy"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
              <select
                value={form.brand}
                onChange={set('brand')}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                title="Gắn cho brand (tùy chọn)"
              >
                <option value="">(dùng chung)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={form.code}
              onChange={set('code')}
              placeholder="Snippet HTML tự chứa (CSS trong <style>)"
              rows={5}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            />

            {/* Xem trước trực tiếp */}
            <label className="flex items-center gap-2 text-slate-400">
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              Xem trước
            </label>
            {preview && form.code.trim() && (
              <iframe
                title="comp-preview"
                srcDoc={form.code}
                sandbox="allow-scripts"
                className="w-full h-40 rounded border border-slate-700 bg-white"
              />
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
            >
              {busy ? 'Đang xử lý…' : editingId ? '💾 Lưu thay đổi' : '➕ Thêm vào RAG'}
            </button>
            {msg && <div className="text-emerald-400">{msg}</div>}
            {error && <div className="text-rose-400">{error}</div>}
          </div>

          {/* ---- Danh sách component của bạn ---- */}
          {users.length > 0 && (
            <div className="border-t border-slate-700 pt-2 grid gap-1">
              <div className="text-slate-400">Component bạn đã thêm ({users.length}):</div>
              {users.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-slate-200" title={c.description}>
                    {c.name}
                    {c.brand ? <span className="text-amber-400"> · {c.brand}</span> : null}
                  </span>
                  <button onClick={() => startEdit(c)} className="text-sky-400 hover:text-sky-300">
                    Sửa
                  </button>
                  <button onClick={() => remove(c)} className="text-rose-400 hover:text-rose-300">
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
