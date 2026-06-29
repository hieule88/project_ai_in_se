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
- **Đánh giá — ĐÃ CHẠY THẬT, có số liệu** (thiết kế CHỐT theo yêu cầu mới):
  - **BỎ** so RAG on/off bằng *chỉ số* (`eval.js`/`eval-consistency.js` còn đó nhưng KHÔNG dùng cho báo cáo).
  - **`npm run eval:models`** = trục chính: so **3 model free** (Qwen3-Coder-Next / Gemini 2.5 Flash / gpt-oss-120b) cùng pipeline+RAG.
    Chỉ số: Correct% · Lỗi% · **Reuse** (proxy đếm component RAG tái dùng — KHÔNG phải Faithfulness RAGAS chuẩn) ·
    AnsRel% · **Stab-Jac%/Stab-Cos%** (ổn định 2 lần gen, chỉ số *phái sinh* dựa similarity) · **Judge/VibeJ** (LLM-as-Judge). Lưu 2 trang/model ở `eval-models-pages/`.
  - **Giám khảo trung lập** = **GLM-4.7** (`zai-glm-4.7` qua Cerebras), cấu hình `JUDGE_*` trong `.env`, chấm blind, `temperature=0`,
    có chốt tự-loại. **Pre-flight bắt buộc `npm run test:judge`** (1 call) trước khi chạy eval:models. Reasoning model → cần `JUDGE_MAX_TOKENS` lớn (8000).
  - **`npm run compare:rag`** = ảnh có-RAG vs không-RAG (model tốt nhất Qwen). **`npm run test:models`** = smoke verify rate-limit (retry 429/503 + `delayMs`).
  - Kết quả: Qwen ổn định vibe nhất (Stab-Jac 93.3, VibeJ 4); Gemini kém ổn định nhất; gpt-oss chất lượng thấp nhất.
- **Cấu hình model** (`eval-models.config.js`): Claude/OpenAI/Qwen/DeepSeek + free (OpenRouter/Cerebras/Gemini) — **chỉ thêm API key vào `.env`**.
  ⚠️ Cerebras chỉ host `gpt-oss-120b` + `zai-glm-4.7`.
- **Báo cáo:** `docs/REPORT.md` (mục lục 6 mục) → `docs/REPORT-final.docx` (pandoc). Ảnh ở `results/{qwen,gemini,gpt-oss}/image{1,2}.png` + `results/rag-on-off/{on,off}-{home,schedule}.png`.

**Còn lại / next steps:**
1. Điền thông số mô hình Qwen ở `REPORT.md` §3.1 (số tham số, context length) — **từ model card chính thức, KHÔNG bịa**.
2. Hoàn thiện **Tài liệu tham khảo** (điền 2 tài liệu môn học + kiểm năm/tác giả).
3. (Tùy) xuất PDF; dọn `REPORT.docx`/`REPORT-v2.docx` cũ, giữ `REPORT-final.docx`.
4. Commit + push nhánh `add-models` → merge `main`; tag v1.0.

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

- **Pandoc xuất .docx:** chạy TRONG `docs/`: `pandoc REPORT.md -o REPORT-final.docx --toc --toc-depth=2 -V lang=vi`
  (chạy trong `docs/` để ảnh `../results/...` nhúng được). Đóng Word trước khi ghi đè (Word khóa file). Công thức để dạng chữ
  (pandoc không dịch `\xrightarrow/\lVert`). Cài: `sudo apt-get install -y pandoc`.

## 3. Quyết định kiến trúc đã chốt
- Output = HTML/CSS/JS thuần, 1 file `/index.html` tự chứa; preview iframe; KHÔNG CDN.
- `pipeline.js` là điểm điều phối duy nhất: resolve brand → RAG → Code → Review → (logo + theme).
- **Đa tác tử (sự thật nội bộ):** THẬT = RAG + Code + Review (producer–critic, Review tự sửa 1 vòng). Orchestrator/Design CHƯA làm (seam).
  ⚠️ **Trong BÁO CÁO chỉ trình bày phần ĐÃ làm — KHÔNG nhắc orchestrator/design/"stub".**
- Hợp đồng interface: `docs/API_CONTRACT.md` (đổi interface phải cập nhật file này trước).

## 4. Đọc thêm để nắm đủ
- `CLAUDE.md` — ngữ cảnh & trạng thái (Claude tự đọc).
- `docs/REPORT.md` → `docs/REPORT-final.docx` — báo cáo (mục lục 6 mục: giới thiệu · kiến trúc · Qwen · Code RAG · đánh giá · kết luận).
- `docs/API_CONTRACT.md`, `docs/TEAM_PLAN.md`, `docs/REVIEW_CHECKLIST.md`, `SETUP.md`.
