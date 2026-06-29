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
cd server && cp .env.example .env && npm install && npm run dev   # http://localhost:8787
# terminal 2
cd web && npm install && npm run dev                              # http://localhost:5173
# mở trình duyệt: http://localhost:5173
```
⚠️ **Máy hiện tại (WSL):** PHẢI chạy ở ổ Linux `~/webgen-assistant`, KHÔNG ở `/mnt/c` (Vite/esbuild + onnxruntime embedding sẽ lỗi). Sửa code ở `/mnt/c` (git) rồi `tar` đồng bộ sang `~` (xem HANDOFF). Cần `npm run build:rag` 1 lần để có `rag-index.json`.

## Trạng thái hiện tại
Skeleton chạy end-to-end ở MOCK_MODE: mô tả → sinh HTML → preview iframe → chỉnh sửa.
Bước 2 (model thật): ✅ ĐÃ CHẠY THẬT — DashScope quốc tế, model `qwen3-coder-next`, `npm run test:model` sinh được /index.html hợp lệ (~17s). Cấu hình ở `server/.env` (MOCK_MODE=0).
Bước 3 (Code RAG): ĐÃ DỰNG — kho là **design-system DBEE** (16 component generic, class `dbee-*`, `src/rag/components.js`), embedding local miễn phí (đa ngôn ngữ), store memory/Chroma, nối `pipeline.js`. Để **ổn định vibe**: nhồi component đã BỎ `<style>` (model chỉ ráp HTML) + chèn **theme cố định** (`src/rag/dbeeTheme.js`) vào cuối `<head>` (`pipeline.applyTheme`).
Bước 6 (Review Agent): ĐÃ DỰNG — soát HTML tĩnh (`src/review.js`) + tự sửa 1 vòng, nối vào generate & edit. Test: `npm run test:review`.
Bước 7 (Cá nhân hóa brand): ĐÃ DỰNG — `src/brands.js` + `/api/brands`, component gắn brand + boost truy xuất, UI `BrandPanel.jsx`. Test: `npm run test:brand`.
Mở rộng: end-user tự quản lý component RAG lúc chạy — CRUD đầy đủ (`POST/PUT/DELETE /api/components`, embed + upsert/remove ngay), lưu `user-components.json`, UI `ComponentPanel.jsx` (danh sách Sửa/Xóa + xem trước trực tiếp). `build:rag` gộp built-in + user.
Bước 4 (Đánh giá): ✅ ĐÃ CHẠY THẬT, có số liệu (xem `docs/REPORT.md` + `docs/REPORT-final.docx`). **Thiết kế thực nghiệm CHỐT (theo yêu cầu):**
  - **BỎ** so RAG on/off bằng *chỉ số* (`eval.js`/`eval-consistency.js` còn đó nhưng KHÔNG dùng cho báo cáo).
  - **`npm run eval:models`** = trục chính: so **3 model free** (Qwen3-Coder-Next / Gemini 2.5 Flash / gpt-oss-120b) trên CÙNG pipeline+RAG. Mỗi model gen 3 prompt, prompt[0] gen 2 lần để đo ổn định. Chỉ số: Correct% · Lỗi% · **Reuse** (đếm component RAG tái dùng — *proxy*, KHÔNG phải Faithfulness RAGAS chuẩn) · AnsRel% · **Stab-Jac%/Stab-Cos%** (ổn định 2 lần gen, *chỉ số phái sinh* dựa trên similarity) · **Judge/VibeJ** (LLM-as-Judge). Lưu 2 trang/model ở `eval-models-pages/`.
  - **Giám khảo trung lập** (tránh self-bias): **GLM-4.7** (`zai-glm-4.7` qua Cerebras) — cấu hình `JUDGE_*` trong `.env`, chấm blind, `temperature=0`. **Pre-flight bắt buộc**: `npm run test:judge` (1 call) trước khi chạy eval:models để khỏi tốn token thí sinh. Reasoning model → cần `JUDGE_MAX_TOKENS` lớn (mặc định 8000).
  - **`npm run compare:rag`** = minh họa RAG định tính: model tốt nhất (Qwen) sinh trang có-RAG vs không-RAG → chụp ảnh.
  - **`npm run test:models`** = smoke 2 lần gen/model (verify rate-limit/lỗi trước khi chạy bản đầy đủ).
  - Kết quả thật: **Qwen ổn định vibe nhất** (Stab-Jac 93.3, VibeJ 4); Gemini kém ổn định nhất; gpt-oss chất lượng thấp nhất (Judge 2.7). Ảnh đặt ở `results/{qwen,gemini,gpt-oss}/image{1,2}.png` + `results/rag-on-off/{on,off}-{home,schedule}.png`.
So sánh nhiều model: `eval-models.config.js` — mỗi model `{model,baseUrl,apiKey,maxTokens,jsonMode,tokenParam,omitTemperature,delayMs}`, **chỉ cần thêm API key vào `.env`**. Đã cấu hình: Claude/OpenAI/Qwen/DeepSeek + free (OpenRouter/Cerebras/Gemini). Cerebras chỉ host `gpt-oss-120b` + `zai-glm-4.7`. `qwenClient.js` override per-model; eval:models có retry 429/503 + `delayMs` (Cerebras 20s).
Bước 8 (một phần): export `.zip` thật (jszip) + Monaco editor (local/offline) ĐÃ LÀM.
Báo cáo: `docs/REPORT.md` → xuất `.docx` bằng **pandoc** (`pandoc REPORT.md -o REPORT-final.docx --toc --toc-depth=2 -V lang=vi`, chạy TRONG `docs/` để nhúng ảnh `../results/...`). Công thức để dạng chữ (pandoc không dịch `\xrightarrow/\lVert`).
**Đa tác tử (trung thực):** thật = RAG Agent (truy xuất) + Code Agent + Review Agent (producer–critic, tự sửa 1 vòng). Orchestrator/Design CHƯA làm (chỉ là seam). ⚠️ Trong BÁO CÁO chỉ trình bày phần ĐÃ làm, KHÔNG nhắc orchestrator/design/stub.

## LỘ TRÌNH LÀM MỘT MÌNH (làm tuần tự, ưu tiên từ trên xuống)

### BẮT BUỘC (đủ để bảo vệ — làm trước)
1. ✅ Skeleton (xong).
2. ✅ **Nối model thật:** DashScope quốc tế + `qwen3-coder-next` (OpenAI-compatible), `npm run test:model` PASS. Endpoint/model đã kiểm chứng thật.
3. ✅ **Code RAG cơ bản:** kho **design-system DBEE** (16 component, `src/rag/components.js`) + theme cố định (`dbeeTheme.js`); embedding local (@xenova/transformers);
   store memory mặc định + Chroma tùy chọn (`src/rag/store.js`); `retrieveComponents` top-k; đã nối vào `pipeline.js`.
   Build: `npm run build:rag`. Test (không tốn tiền): `npm run test:rag`.
4. ✅ **Đánh giá:** ĐÃ CHẠY THẬT. Trục chính = `eval:models` (3 model free + Stab + LLM-as-Judge GLM-4.7) + `compare:rag` (ảnh RAG on/off). Bỏ so RAG on/off bằng chỉ số. Số liệu + ảnh đã vào `REPORT.md`/`REPORT-final.docx`.
5. ✅ **Báo cáo:** `docs/REPORT.md` viết theo mục lục 6 mục; xuất `REPORT-final.docx` (pandoc). Còn: điền thông số Qwen §3.1 (từ model card), hoàn thiện Tài liệu tham khảo.

### NÊN CÓ (nếu còn thời gian)
6. ✅ **Review Agent đơn giản:** soát HTML tĩnh (`src/review.js`) → nếu lỗi, gọi model sửa 1 vòng (`buildFixMessages`); nối vào generate & edit. Test miễn phí: `npm run test:review`.
7. ✅ **Cá nhân hóa brand:** `src/brands.js` + `/api/brands` (seed brand mẫu `acme-coffee`); component gắn `brand` + boost khi truy xuất (`retrieve.js`); nhồi màu/font/logo vào prompt; UI `BrandPanel.jsx`. Test: `npm run test:brand`.

### CÓ THÌ TỐT (đừng hi sinh phần BẮT BUỘC vì mấy cái này)
8. Đa agent đầy đủ (thêm Design Agent), Monaco editor, export .zip thật, VLM chấm screenshot.

> Mẹo solo: luôn giữ nhánh chạy được. Làm xong mỗi bước thì commit. RAG (bước 3) là thứ quyết định Mức 3 — ưu tiên hơn multi-agent.

## Quy ước code
- Backend ESM (`"type":"module"`), Node ≥18. Comment tiếng Việt. `pipeline.js` là nơi điều phối duy nhất.
- Mọi thay đổi interface phải cập nhật `docs/API_CONTRACT.md` trước.
