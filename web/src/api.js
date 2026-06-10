// Lớp giao tiếp với backend. Khớp 1-1 với docs/API_CONTRACT.md.

export async function generate({ description, language = 'vi', brandId = null }) {
  return post('/api/generate', { description, language, brandId });
}

export async function edit({ files, instruction, language = 'vi' }) {
  return post('/api/edit', { files, instruction, language });
}

// ---- Brand (Bước 7) ----
export async function listBrands() {
  const res = await fetch('/api/brands');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data.brands || [];
}

export async function createBrand(payload) {
  return post('/api/brands', payload); // { name, colors, font, logo }
}

// ---- Component RAG (end-user tự thêm) ----
export async function listComponents() {
  const res = await fetch('/api/components');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data; // { builtin: number, user: [{id,name,tags,brand}] }
}

export async function createComponent(payload) {
  return post('/api/components', payload); // { name, description, tags, brand, code }
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data; // { summary, entry, files, agentSteps, meta }
}
