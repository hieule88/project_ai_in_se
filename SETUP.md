# SETUP — Dựng dự án trên máy mới (an toàn, không cần commit `.env`)

`.env` (chứa API key) **KHÔNG** nằm trong repo. Trên máy mới chỉ cần tạo lại `.env` từ khuôn
`server/.env.example` và điền key thủ công (chuyển key qua kênh riêng tư: trình quản lý mật khẩu /
ghi chú riêng — KHÔNG qua repo). Dữ liệu `brands.json`, `user-components.json` đã có sẵn trong repo.

## 0. Yêu cầu
- **Node ≥ 18**. (Dùng WSL? Đặt dự án trên ổ Linux `~/...`, ĐỪNG để trên `/mnt/c` — `esbuild`/`onnxruntime`
  hay lỗi trên ổ Windows mount.)
- (Tùy chọn) Chroma nếu muốn `RAG_STORE=chroma`: `pip install chromadb && chroma run --path ./chroma_db`.

## 1. Clone & cài đặt
```bash
git clone https://github.com/hieule88/project_ai_in_se.git
cd project_ai_in_se
cd server && npm install        # backend + RAG (chromadb, @xenova/transformers)
cd ../web  && npm install       # frontend (vite, monaco, jszip)
```

## 2. Tạo `.env` cho server (điền key thật bằng tay)
```bash
cd ../server
cp .env.example .env
```
Mở `server/.env` và điền các biến (giá trị thật KHÔNG có trong repo):

| Biến | Ý nghĩa | Gợi ý |
|---|---|---|
| `MOCK_MODE` | 1 = chạy mẫu không cần key · 0 = model thật | `0` để chạy thật |
| `QWEN_BASE_URL` | endpoint OpenAI-compatible | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| `QWEN_API_KEY` | **key DashScope của bạn** | `sk-...` (chuyển qua kênh riêng) |
| `QWEN_MODEL` | tên model | `qwen3-coder-next` |
| `QWEN_MAX_TOKENS` | trần token (trang HTML dài) | `32000` |
| `QWEN_JSON_MODE` | ép trả 1 JSON | `1` (hoặc `0` nếu model không hỗ trợ) |
| `RAG_ENABLED` / `RAG_TOP_K` / `RAG_STORE` | bật RAG / số top-k / backend | `1` / `6` / `memory` |
| `REVIEW_ENABLED` / `REVIEW_AUTOFIX` | Review Agent | `1` / `1` |
| (eval:models, tùy chọn) `OPENROUTER_API_KEY`, `OR_MODEL_A/B`, `GROQ_API_KEY`, `GROQ_MODEL` | so sánh model | tự lấy key free |

> ⚠️ Nếu key từng bị lộ (commit/push nhầm) → **revoke + tạo key mới** ở DashScope.

## 3. Build kho RAG & chạy
```bash
# trong server/
npm run build:rag        # tạo rag-index.json (bị .gitignore, phải build lại trên máy mới)
npm run dev              # http://localhost:8787

# terminal khác, trong web/
npm run dev              # http://localhost:5173
```
Kiểm thử không tốn tiền: `npm run test:rag`, `test:review`, `test:brand`. Đánh giá: `npm run eval`, `eval:consistency`, `eval:models`.

## 4. Để Claude Code hoạt động hiệu quả trên máy mới
Ngữ cảnh dự án cho Claude **đã nằm trong repo** (được commit, không bị ignore):
- **`CLAUDE.md`** — Claude Code tự đọc khi mở thư mục dự án: kiến trúc, quyết định đã chốt, lộ trình, quy ước code.
- **`docs/`** — `API_CONTRACT.md` (hợp đồng interface), `REPORT.md`, `TEAM_PLAN.md`, `REVIEW_CHECKLIST.md`.

Trên máy mới:
1. Cài **Claude Code** (xem hướng dẫn chính thức của Anthropic).
2. Mở thư mục `project_ai_in_se` bằng Claude Code → nó tự nạp `CLAUDE.md` làm ngữ cảnh.
3. (Lưu ý) Lịch sử hội thoại & "memory" cá nhân của Claude **không** đi theo repo — nhưng `CLAUDE.md` + `docs/`
   đủ để Claude nắm bối cảnh và làm việc hiệu quả ngay.

> Nếu muốn Claude trên mọi máy hành xử nhất quán hơn nữa, có thể thêm cấu hình dự án trong `.claude/` (vd
> `.claude/settings.json`) và commit kèm — hiện dự án chưa dùng, là tùy chọn mở rộng.
