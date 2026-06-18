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

// ---- Component RAG (end-user tự thêm / sửa / xóa) ----
export async function listComponents() {
  const res = await fetch('/api/components');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data; // { builtin: number, user: [{id,name,description,tags,brand,code}] }
}

export async function createComponent(payload) {
  return request('POST', '/api/components', payload); // { name, description, tags, brand, code }
}

export async function updateComponent(id, payload) {
  return request('PUT', `/api/components/${encodeURIComponent(id)}`, payload);
}

export async function deleteComponent(id) {
  return request('DELETE', `/api/components/${encodeURIComponent(id)}`);
}

function post(path, body) {
  return request('POST', path, body);
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
}
