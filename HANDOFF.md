# HANDOFF — Bàn giao ngữ cảnh làm việc (đọc cùng `CLAUDE.md`)

> Mục đích: tiếp tục công việc trên máy khác. Trên máy mới, bảo Claude **"đọc HANDOFF.md, CLAUDE.md, docs/"**
> để nắm bối cảnh. (Lịch sử chat không đi theo tài khoản — file này thay thế.)

## 1. Dự án đang ở đâu
WebGen — trợ lý sinh web frontend (HTML/CSS/JS tự chứa) đa tác tử + **Code RAG**. Mục tiêu Mức 3 (đồ án IT5380).
Đã chạy **end-to-end với model thật**.

**Đã xong & verify:**
- Skeleton + preview iframe + chỉnh sửa qua chat.
- **Model thật:** DashScope quốc tế, `qwen3-coder-next` (OpenAI-compatible), `npm run test:model` PASS.
- **Code RAG:** embedding local đa ngôn ngữ (`paraphrase-multilingual-MiniLM-L12-v2`, 384-D), store memory/Chroma,
  truy xuất top-k + lọc/boost brand, nối `pipeline.js`.
- **Kho RAG = "design system DBEE"** (16 component generic, cùng nhận diện vàng `#f2db45`, class `dbee-*`).
- **Theme cố định** (`dbeeTheme.js`) chèn vào output để ổn định vibe (model chỉ ráp HTML, không vẽ lại CSS).
- **Review Agent** (soát HTML + tự sửa 1 vòng), **Brand** (màu/font/logo, logo dùng placeholder rồi ghép sau).
- **CRUD component lúc chạy** (`/api/components` + ComponentPanel), lưu `user-components.json`.
- **Đánh giá:** `eval`, `eval:consistency`, `eval:models` — **chỉ dùng metric trong tài liệu** (RAGAS:
  Faithfulness/Answer Relevancy/Context Relevancy + Correctness + text similarity). Đã bỏ latency/size/màu-font.
- **Multi-model:** so sánh Claude Sonnet 4.6 / GPT / Qwen / DeepSeek qua OpenAI-compat (config: `eval-models.config.js`).

**Còn lại / next steps:**
1. Chạy thật `npm run eval` + `eval:consistency` (+ `eval:models` khi có key) → điền số `【…】` trong `docs/REPORT.md` §6.
2. Chụp 4 ảnh `eval-consistency/*.html` chèn báo cáo.
3. Hoàn thiện báo cáo (8 trang) + chuẩn bị demo.
4. Push lên `main` (đang ở nhánh `add-models`).

## 2. Bẫy/vận hành QUAN TRỌNG (đừng vấp lại)
- **Chạy trên ổ Linux của WSL (`~/webgen-assistant`), KHÔNG phải `/mnt/c`.** Trên `/mnt/c`, `esbuild` (web) và
  `onnxruntime` (embedding) **hỏng** (SIGSEGV / protobuf). Sửa code ở `/mnt/c` (git ở đây) rồi **đồng bộ sang `~`**:
  ```
  tar -C /mnt/c/.../webgen-assistant/server -cf - src scripts eval-models.config.js package.json | tar -xf - -C ~/webgen-assistant/server
  tar -C /mnt/c/.../webgen-assistant --exclude=node_modules -cf - web | tar -xf - -C ~/webgen-assistant
  ```
  (Trên máy MỚI nếu không gặp lỗi /mnt/c thì làm trực tiếp một chỗ — xem `SETUP.md`.)
- **`.env` KHÔNG commit** (chứa key). Máy mới: `cp server/.env.example server/.env` rồi điền key tay (xem `SETUP.md`).
- **`node` chỉ có trong terminal WSL** (conda base) — không có trong Git Bash/PowerShell của máy hiện tại.
- **`rag-index.json` bị ignore** → máy mới phải `npm run build:rag`.
- **DeepSeek** output tối đa ~8192 token; **GPT-5 đời mới** cần `max_completion_tokens` + bỏ `temperature`
  (đã set cờ trong `eval-models.config.js`). **Claude** gọi qua `api.anthropic.com/v1` (jsonMode off).
- **QWEN_MAX_TOKENS=32000** cho Qwen; mỗi model trong eval:models có `maxTokens` riêng.

## 3. Quyết định kiến trúc đã chốt
- Output = HTML/CSS/JS thuần, 1 file `/index.html` tự chứa; preview iframe; KHÔNG CDN.
- `pipeline.js` là điểm điều phối agent duy nhất: Orchestrator(stub) → RAG → Code → Review → (logo + theme).
- Hợp đồng interface: `docs/API_CONTRACT.md` (đổi interface phải cập nhật file này trước).

## 4. Đọc thêm để nắm đủ
- `CLAUDE.md` — ngữ cảnh & trạng thái (Claude tự đọc).
- `docs/REPORT.md` — báo cáo (mô hình, RAG, embedding, đánh giá theo RAGAS).
- `docs/API_CONTRACT.md`, `docs/TEAM_PLAN.md`, `docs/REVIEW_CHECKLIST.md`, `SETUP.md`.
