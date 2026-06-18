/**
 * VECTOR STORE — lớp trừu tượng 2 backend, cùng 1 giao diện:
 *   - addAll(items, embeddings) : nạp kho (dùng bởi scripts/build-rag.js)
 *   - query(embedding, k, opts) : truy xuất top-k (dùng bởi retrieve.js)
 *
 * Chọn backend qua env RAG_STORE:
 *   - 'memory' (mặc định): cosine in-process, lưu ra file rag-index.json.
 *       → KHÔNG cần cài/chạy gì thêm. Hợp để dev & test ngay, và làm fallback.
 *   - 'chroma': dùng Chroma (đúng quyết định kiến trúc đã chốt) qua CHROMA_URL.
 *       → Cần chạy server Chroma: `pip install chromadb && chroma run --path ./chroma_db`
 *
 * Mọi item trả về có dạng: { id, name, description, tags, brand, code, score }
 * với score = độ tương đồng cosine (càng cao càng liên quan).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const COLLECTION = 'webgen_components';
const INDEX_FILE = fileURLToPath(new URL('../../rag-index.json', import.meta.url)); // server/rag-index.json

export function storeKind() {
  return process.env.RAG_STORE === 'chroma' ? 'chroma' : 'memory';
}

export function getStore() {
  return storeKind() === 'chroma' ? chromaStore : memoryStore;
}

/* ----------------------------- MEMORY STORE ----------------------------- */

let _memCache = null;

const memoryStore = {
  async addAll(items, embeddings) {
    const data = {
      model: 'all-MiniLM-L6-v2',
      dim: embeddings[0]?.length || 0,
      items: items.map((it, i) => ({ ...it, embedding: embeddings[i] })),
    };
    writeFileSync(INDEX_FILE, JSON.stringify(data));
    _memCache = data;
    return items.length;
  },

  // Thêm/cập nhật tăng dần (dùng khi end-user thêm component lúc chạy).
  async upsertItems(items, embeddings) {
    const data = loadMemIndex(); // cần đã build:rag trước
    const byId = new Map(data.items.map((it) => [it.id, it]));
    items.forEach((it, i) => byId.set(it.id, { ...it, embedding: embeddings[i] }));
    data.items = [...byId.values()];
    writeFileSync(INDEX_FILE, JSON.stringify(data));
    _memCache = data;
    return items.length;
  },

  // Xóa theo id.
  async removeItems(ids) {
    const data = loadMemIndex();
    const set = new Set(ids);
    data.items = data.items.filter((it) => !set.has(it.id));
    writeFileSync(INDEX_FILE, JSON.stringify(data));
    _memCache = data;
  },

  async query(embedding, k = 4, opts = {}) {
    const data = loadMemIndex();
    let pool = data.items;
    if (opts.brand) {
      // Có brand: lấy component của brand đó + component dùng chung (brand rỗng).
      pool = pool.filter((it) => !it.brand || it.brand === opts.brand);
    } else {
      // Không brand: CHỈ component dùng chung (ẩn component riêng của brand khác).
      pool = pool.filter((it) => !it.brand);
    }
    return pool
      .map((it) => ({ ...stripEmbedding(it), score: dot(embedding, it.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  },

  async count() {
    return loadMemIndex().items.length;
  },
};

function loadMemIndex() {
  if (_memCache) return _memCache;
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Chưa có kho RAG (${INDEX_FILE}). Chạy: npm run build:rag`);
  }
  _memCache = JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  return _memCache;
}

function stripEmbedding({ embedding, ...rest }) {
  return rest;
}

/** Tích vô hướng — vector đã normalize nên đây chính là cosine similarity. */
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/* ----------------------------- CHROMA STORE ----------------------------- */

// Stub: ta LUÔN cung cấp embedding sẵn → Chroma không cần tự embed.
// Khai báo stub này để Chroma không cố nạp embedder mặc định của nó.
const noopEmbedder = {
  generate: async () => {
    throw new Error('RAG: embedding phải được truyền sẵn, không nhờ Chroma tự sinh.');
  },
};

let _chromaCol = null;

async function getChromaCollection() {
  if (_chromaCol) return _chromaCol;
  const { ChromaClient } = await import('chromadb');
  const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
  _chromaCol = await client.getOrCreateCollection({
    name: COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: noopEmbedder,
  });
  return _chromaCol;
}

const chromaStore = {
  async addAll(items, embeddings) {
    const col = await getChromaCollection();
    await col.upsert({
      ids: items.map((it) => it.id),
      embeddings,
      documents: items.map((it) => it.code),
      metadatas: items.map((it) => ({
        name: it.name,
        description: it.description,
        tags: (it.tags || []).join(','),
        brand: it.brand || '',
      })),
    });
    return items.length;
  },

  // Chroma upsert vốn đã tăng dần → dùng lại addAll.
  async upsertItems(items, embeddings) {
    return this.addAll(items, embeddings);
  },

  async removeItems(ids) {
    const col = await getChromaCollection();
    await col.delete({ ids });
  },

  async query(embedding, k = 4, opts = {}) {
    const col = await getChromaCollection();
    // Có brand: component dùng chung + của brand đó. Không brand: chỉ dùng chung.
    const where = opts.brand ? { $or: [{ brand: '' }, { brand: opts.brand }] } : { brand: '' };
    const res = await col.query({ queryEmbeddings: [embedding], nResults: k, where });
    const ids = res.ids?.[0] || [];
    return ids.map((id, i) => {
      const m = res.metadatas?.[0]?.[i] || {};
      const distance = res.distances?.[0]?.[i];
      return {
        id,
        name: m.name || id,
        description: m.description || '',
        tags: m.tags ? String(m.tags).split(',') : [],
        brand: m.brand || '',
        code: res.documents?.[0]?.[i] || '',
        score: typeof distance === 'number' ? 1 - distance : null, // cosine distance -> similarity
      };
    });
  },

  async count() {
    const col = await getChromaCollection();
    return col.count();
  },
};
