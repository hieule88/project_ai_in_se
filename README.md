# WebGen — Multi-Agent AI Pair Programming Assistant for Web Frontend (solo)

Trợ lý web kiểu bolt.new/v0 thu nhỏ: mô tả website → sinh HTML/CSS/JS → preview ngay trong trình duyệt → chỉnh sửa qua chat.
Có **MOCK_MODE** để chạy ngay không cần API key. Preview chạy **iframe local** (không cần internet).

## Chạy thử nhanh (2 terminal)

**1) Backend**
```bash
cd server
cp .env.example .env      # mặc định MOCK_MODE=1, chạy được luôn
npm install
npm run dev               # http://localhost:8787
```

**2) Frontend**
```bash
cd web
npm install
npm run dev               # http://localhost:5173
```

Mở http://localhost:5173 → gõ mô tả → Gửi → thấy preview. Gõ tiếp để thử "chỉnh sửa".

## Bật model thật (Qwen3-Coder-Next)
Sửa `server/.env`: `MOCK_MODE=0` và điền `QWEN_BASE_URL`, `QWEN_API_KEY`, `QWEN_MODEL`.
⚠️ Tự kiểm chứng endpoint OpenAI-compatible đúng cho Qwen3-Coder-Next (hosted hoặc self-host vLLM/Ollama).
Nếu schema khác chuẩn OpenAI → chỉ cần sửa `server/src/qwenClient.js`.

## Cấu trúc
```
server/
  src/index.js            Express: /api/generate, /api/edit, /api/health
  src/qwenClient.js       gọi model (OpenAI-compatible) + mock
  src/pipeline.js         điều phối agent — CÓ SEAM multi-agent + chỗ cắm RAG
  src/parser.js           parse output model -> files[]
  src/prompts/codegen.js  prompt + project mẫu (mock)
web/
  src/App.jsx             ghép layout + gọi API
  src/components/         ChatPanel, PreviewPanel(iframe), CodeViewer, AgentSteps
docs/API_CONTRACT.md      "hợp đồng" interface — đọc trước khi sửa
CLAUDE.md                 ngữ cảnh dự án (Claude Code tự đọc)
```

## Code RAG (Bước 3 — đã có)
Kho component UI (`server/src/rag/components.js`) → embedding LOCAL miễn phí (`@xenova/transformers`,
model đa ngôn ngữ `paraphrase-multilingual-MiniLM-L12-v2` — hỗ trợ tiếng Việt) → vector store →
truy xuất top-k, nhồi vào prompt Code Agent.

```bash
cd server
npm install                 # cài thêm chromadb + @xenova/transformers
npm run build:rag           # nạp kho vào store (lần đầu tải model ~90MB)
npm run test:rag            # KIỂM TRA truy xuất — không gọi model, không tốn tiền
```

- **Store:** mặc định `RAG_STORE=memory` (cosine in-process, ghi `rag-index.json`, không cần cài gì).
  Đổi `RAG_STORE=chroma` để dùng **Chroma** (kiến trúc chốt): `pip install chromadb && chroma run --path ./chroma_db`, rồi `npm run build:rag` lại.
- **So sánh có/không RAG** (Bước 4): đặt `RAG_ENABLED=0` để tắt.
- Wiring nằm ở `pipeline.js` (đã thay `retrievedComponents = []` bằng `retrieveComponents(...)`, có fallback nếu store lỗi).

## Review Agent (Bước 6 — đã có)
Sau khi Code Agent sinh xong, `runReview` (`server/src/review.js`) soát HTML **tĩnh, miễn phí**
(bị cắt cụt, thiếu khung `<html>/<body>`, `<script>/<style>` lệch, sót TODO, dùng CDN ngoài…).
Nếu có lỗi → gọi model **sửa 1 vòng** (`buildFixMessages`), rồi soát lại. Luôn có fallback (lỗi sửa → giữ bản gốc).

```bash
cd server
npm run test:review     # test bộ validate — không gọi model, không tốn tiền
```
- Tắt review: `REVIEW_ENABLED=0`. Chỉ báo lỗi mà không tốn token sửa: `REVIEW_AUTOFIX=0`.
- Áp dụng cho cả `/api/generate` lẫn `/api/edit`; kết quả hiện trong `agentSteps` (agent `review`).

## Cá nhân hóa Brand (Bước 7 — đã có)
Khai báo thương hiệu (tên, màu chủ đạo, font, logo) → nhồi nhận diện vào prompt Code Agent
và **ưu tiên component gắn brand** khi truy xuất RAG.

- Backend: `server/src/brands.js` (registry + lưu `brands.json`, seed sẵn brand mẫu `acme-coffee`),
  endpoint `GET/POST /api/brands`.
- RAG: component có trường `brand` chỉ xuất hiện khi truy xuất kèm đúng `brandId`, và được cộng điểm ưu tiên (`RAG_BRAND_BOOST`).
- Frontend: `web/src/components/BrandPanel.jsx` — chọn brand có sẵn hoặc tạo mới (upload logo, chọn màu/font).
- Test (sau khi `npm run build:rag` lại để có component brand):
  ```bash
  cd server && npm run test:brand   # không gọi model, không tốn tiền
  ```

### End-user tự thêm component vào RAG (lúc chạy)
Không cần sửa code hay build lại: UI `ComponentPanel.jsx` (nút **"+ Thêm component vào RAG"** ở cột trái)
hoặc gọi `POST /api/components { name, description, tags, brand, code }`.
Backend embed component đó rồi **upsert** thẳng vào store; đồng thời lưu `server/user-components.json`
nên sống sót qua restart và được `build:rag` gộp lại cùng kho tĩnh. Mô tả càng giàu từ khóa, truy xuất càng đúng.

## Đánh giá (Bước 4 — bộ đo đã sẵn, chạy thật ở đợt cuối)
Script `server/scripts/eval.js` chạy ~12 prompt qua pipeline ở **cả 2 chế độ** (`RAG_ENABLED` bật/tắt),
đo **tỉ lệ thành công / độ trễ / số vòng sửa / cảnh báo / kích thước HTML / số component truy xuất**,
in bảng so sánh ON vs OFF và lưu `server/eval-results.json`.

```bash
cd server && npm run eval
```
⚠️ Ở MOCK, output cố định → số liệu ON/OFF giống nhau (chỉ để kiểm chứng bộ đo). Chạy với `MOCK_MODE=0`
ở đợt cuối để có số liệu thực cho báo cáo.

## Tải project (.zip)
Nút **"Tải .zip"** đóng gói toàn bộ file thành `webgen-project.zip` (dùng `jszip`), giải nén ra `index.html` mở chạy ngay.

## Xem code (Monaco)
Tab **Code** dùng Monaco Editor (`@monaco-editor/react`), cấu hình chạy **local/offline** (`web/src/monacoSetup.js`),
không tải từ CDN — an toàn với mạng dev bị chặn bundler ngoài.

## Chỗ cắm cho các phần tiếp theo (đã đánh dấu TODO trong code)
- **Multi-agent:** các bước `orchestrator/design` trong `pipeline.js` vẫn là stub — thay bằng lần gọi model có system prompt riêng.

Xem lộ trình làm một mình (thứ tự + ưu tiên) trong `CLAUDE.md`.
