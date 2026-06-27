# CLAUDE.md — Ngữ cảnh dự án (Claude Code tự đọc file này)

## Dự án
**Multi-Agent AI Pair Programming Assistant for Web Frontend Development with Code RAG.**
Trợ lý web kiểu bolt.new/v0 thu nhỏ: người dùng mô tả website (Việt/Anh) → sinh code →
preview trong trình duyệt → chỉnh sửa qua chat. Đồ án môn IT5380 (Trí tuệ nhân tạo trong CNPM),
**làm một mình**, hướng **application**, mục tiêu Mức 3 (nhờ có Code RAG).

## Quyết định kiến trúc đã chốt (QUAN TRỌNG — đừng đảo ngược nếu chưa hỏi)
- **Stack output = HTML/CSS/JS thuần**, mỗi project là 1 file `/index.html` TỰ CHỨA (CSS trong `<style>`, JS trong `<script>`).
- **Preview = iframe local** (`web/src/components/PreviewPanel.jsx`), KHÔNG dùng Sandpack/React.
  Lý do: mạng dev bị chặn bundler CodeSandbox (csbops.io timeout). iframe chạy offline, an toàn khi demo.
- **Model = Qwen3-Coder-Next** (open-weight), gọi qua endpoint **OpenAI-compatible** trong `server/src/qwenClient.js`.
  Có `MOCK_MODE=1` để chạy không cần API key. ⚠️ Endpoint thật cần tự kiểm chứng (paper ra 3/2026).
- **Multi-agent:** Orchestrator → Code → Review (bản tối giản cho solo). Hiện chỉ Code Agent là thật;
  các bước khác là STUB có sẵn seam trong `server/src/pipeline.js`.
- **Code RAG:** kho component UI + embedding + **Chroma**, truy xuất top-k nhồi vào prompt. Đây là phần lõi Mức 3 — KHÔNG cắt.
  Cá nhân hóa theo brand (logo/style riêng) là phần mở rộng nếu còn thời gian.

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
docs/API_CONTRACT.md      "HỢP ĐỒNG" interface — đọc trước khi sửa
```

## Hợp đồng API (tóm tắt, chi tiết ở docs/API_CONTRACT.md)
- `POST /api/generate { description, language, brandId }` → `ProjectResult`
- `POST /api/edit { files, instruction, language }` → `ProjectResult`
- `ProjectResult = { summary, entry:"/index.html", files:[{path,content}], agentSteps:[{agent,status,summary}], meta }`
- Model PHẢI trả về DUY NHẤT 1 JSON `{ summary, entry, files }`.

## Chạy dự án
```bash
# terminal 1
cd server && cp .env.example .env && npm install && npm run dev   # http://localhost:8787 (MOCK)
# terminal 2
cd web && npm install && npm run dev                              # http://localhost:5173
```

## Trạng thái hiện tại
Skeleton chạy end-to-end ở MOCK_MODE: mô tả → sinh HTML → preview iframe → chỉnh sửa.
Bước 2 (model thật): ✅ ĐÃ CHẠY THẬT — DashScope quốc tế, model `qwen3-coder-next`, `npm run test:model` sinh được /index.html hợp lệ (~17s). Cấu hình ở `server/.env` (MOCK_MODE=0).
Bước 3 (Code RAG): ĐÃ DỰNG — kho là **design-system DBEE** (16 component generic, class `dbee-*`, `src/rag/components.js`), embedding local miễn phí (đa ngôn ngữ), store memory/Chroma, nối `pipeline.js`. Để **ổn định vibe**: nhồi component đã BỎ `<style>` (model chỉ ráp HTML) + chèn **theme cố định** (`src/rag/dbeeTheme.js`) vào cuối `<head>` (`pipeline.applyTheme`).
Bước 6 (Review Agent): ĐÃ DỰNG — soát HTML tĩnh (`src/review.js`) + tự sửa 1 vòng, nối vào generate & edit. Test: `npm run test:review`.
Bước 7 (Cá nhân hóa brand): ĐÃ DỰNG — `src/brands.js` + `/api/brands`, component gắn brand + boost truy xuất, UI `BrandPanel.jsx`. Test: `npm run test:brand`.
Mở rộng: end-user tự quản lý component RAG lúc chạy — CRUD đầy đủ (`POST/PUT/DELETE /api/components`, embed + upsert/remove ngay), lưu `user-components.json`, UI `ComponentPanel.jsx` (danh sách Sửa/Xóa + xem trước trực tiếp). `build:rag` gộp built-in + user.
Bước 4 (Đánh giá): ĐÃ DỰNG, **chỉ dùng metric trong tài liệu (RAGAS)** — `npm run eval` (so RAG on/off: Correctness/Faithfulness/Context Relevancy/Answer Relevancy), `npm run eval:consistency` (nhất quán 2 trang DBEE: text-similarity Jaccard + Faithfulness), `npm run eval:models` (so nhiều LLM cùng pipeline+RAG). Còn chạy thật để điền số.
So sánh nhiều model: `eval-models.config.js` — mỗi model `{model,baseUrl,apiKey,maxTokens,jsonMode,tokenParam,omitTemperature}`, **chỉ cần thêm API key vào `.env`** (Claude/OpenAI/Qwen/DeepSeek + free: OpenRouter qwen3-coder, Cerebras gpt-oss-120b, Gemini Flash). `qwenClient.js` hỗ trợ override per-model.
Bước 8 (một phần): export `.zip` thật (jszip) + Monaco editor (local/offline) ĐÃ LÀM.
Multi-agent còn lại (orchestrator/design) vẫn là stub.

## LỘ TRÌNH LÀM MỘT MÌNH (làm tuần tự, ưu tiên từ trên xuống)

### BẮT BUỘC (đủ để bảo vệ — làm trước)
1. ✅ Skeleton (xong).
2. ✅ **Nối model thật:** DashScope quốc tế + `qwen3-coder-next` (OpenAI-compatible), `npm run test:model` PASS. Endpoint/model đã kiểm chứng thật.
3. ✅ **Code RAG cơ bản:** kho **design-system DBEE** (16 component, `src/rag/components.js`) + theme cố định (`dbeeTheme.js`); embedding local (@xenova/transformers);
   store memory mặc định + Chroma tùy chọn (`src/rag/store.js`); `retrieveComponents` top-k; đã nối vào `pipeline.js`.
   Build: `npm run build:rag`. Test (không tốn tiền): `npm run test:rag`.
4. ◑ **Đánh giá nhẹ:** ĐÃ DỰNG, **chỉ dùng metric trong tài liệu (RAGAS)** — `eval` (so RAG on/off), `eval:consistency` (nhất quán 2 trang), `eval:models` (so nhiều LLM, chỉ cần thêm API key). Chỉ CÒN chạy thật `MOCK_MODE=0` để điền số vào `REPORT.md`.
5. **Báo cáo + demo:** chuẩn bị 2–3 prompt demo đã chạy ổn.

### NÊN CÓ (nếu còn thời gian)
6. ✅ **Review Agent đơn giản:** soát HTML tĩnh (`src/review.js`) → nếu lỗi, gọi model sửa 1 vòng (`buildFixMessages`); nối vào generate & edit. Test miễn phí: `npm run test:review`.
7. ✅ **Cá nhân hóa brand:** `src/brands.js` + `/api/brands` (seed brand mẫu `acme-coffee`); component gắn `brand` + boost khi truy xuất (`retrieve.js`); nhồi màu/font/logo vào prompt; UI `BrandPanel.jsx`. Test: `npm run test:brand`.

### CÓ THÌ TỐT (đừng hi sinh phần BẮT BUỘC vì mấy cái này)
8. Đa agent đầy đủ (thêm Design Agent), Monaco editor, export .zip thật, VLM chấm screenshot.

> Mẹo solo: luôn giữ nhánh chạy được. Làm xong mỗi bước thì commit. RAG (bước 3) là thứ quyết định Mức 3 — ưu tiên hơn multi-agent.

## Quy ước code
- Backend ESM (`"type":"module"`), Node ≥18. Comment tiếng Việt. `pipeline.js` là nơi điều phối duy nhất.
- Mọi thay đổi interface phải cập nhật `docs/API_CONTRACT.md` trước.
