import { useEffect, useState } from 'react';
import * as api from '../api.js';

/**
 * BrandPanel (Bước 7) — chọn brand có sẵn hoặc tạo brand mới (tên, màu, font, logo).
 * Báo brandId đã chọn ra ngoài qua onChange. brandId rỗng = không cá nhân hóa.
 */
const FONTS = ['system-ui, sans-serif', 'Georgia, serif', '"Times New Roman", serif', 'Poppins, sans-serif', 'monospace'];

export default function BrandPanel({ value, onChange }) {
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Form tạo brand mới.
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState('#4f46e5');
  const [bg, setBg] = useState('#ffffff');
  const [font, setFont] = useState(FONTS[0]);
  const [logo, setLogo] = useState(''); // data URI hoặc emoji/text

  async function refresh() {
    try {
      setBrands(await api.listBrands());
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function onPickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result); // data URI
    reader.readAsDataURL(file);
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const brand = await api.createBrand({ name, colors: { primary, bg }, font, logo: logo || undefined });
      await refresh();
      onChange(brand.id);
      setShowForm(false);
      setName('');
      setLogo('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Brand:</span>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
        >
          <option value="">— Không dùng brand —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
          title="Tạo brand mới"
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && (
        <div className="mt-2 p-2 rounded border border-slate-700 bg-slate-900/60 grid gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên thương hiệu"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-slate-400">
              Màu chính <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </label>
            <label className="flex items-center gap-1 text-slate-400">
              Nền <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
            </label>
          </div>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Logo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={onPickLogo}
              className="text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:px-2 file:py-0.5 file:text-slate-200"
            />
            {logo && (logo.startsWith('data:') ? <img src={logo} alt="" className="h-5" /> : <span>{logo}</span>)}
          </div>
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40"
          >
            {busy ? 'Đang lưu…' : 'Lưu brand'}
          </button>
        </div>
      )}

      {error && <div className="mt-1 text-rose-400">{error}</div>}
    </div>
  );
}
