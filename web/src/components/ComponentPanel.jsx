import { useEffect, useState } from 'react';
import * as api from '../api.js';

/**
 * ComponentPanel (mở rộng Bước 7) — cho end-user TỰ THÊM component vào kho RAG lúc chạy.
 * Gửi POST /api/components → backend embed + nạp ngay vào store (không cần build lại).
 * Tự nạp danh sách brand để gắn component cho 1 brand (tùy chọn).
 */
export default function ComponentPanel() {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState({ builtin: 0, user: [] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [brand, setBrand] = useState('');
  const [code, setCode] = useState('');

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

  async function submit() {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const c = await api.createComponent({ name, description, tags, brand: brand || undefined, code });
      setMsg(`Đã thêm "${c.id}" vào kho RAG.`);
      setName('');
      setDescription('');
      setTags('');
      setCode('');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const total = stats.builtin + (stats.user?.length || 0);

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
      >
        <span>+ Thêm component vào RAG</span>
        <span className="text-slate-500">{total} có sẵn</span>
      </button>

      {open && (
        <div className="mt-2 p-2 rounded border border-slate-700 bg-slate-900/60 grid gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên component (vd: Bảng giá kiểu VN)"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả giàu từ khóa (Việt + Anh) — quyết định truy xuất"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
          <div className="flex gap-2">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tags, cách nhau dấu phẩy"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Snippet HTML tự chứa (CSS trong <style>)"
            rows={5}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
          />
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !code.trim()}
            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
          >
            {busy ? 'Đang nhúng…' : 'Thêm vào RAG'}
          </button>

          {stats.user?.length > 0 && (
            <div className="text-slate-500">
              User đã thêm: {stats.user.map((u) => u.id).join(', ')}
            </div>
          )}
          {msg && <div className="text-emerald-400">{msg}</div>}
          {error && <div className="text-rose-400">{error}</div>}
        </div>
      )}
    </div>
  );
}
