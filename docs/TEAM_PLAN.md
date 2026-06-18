# TEAM_PLAN — Phân công & quy trình git (4 người · 3 ngày)

> Kế hoạch để **mỗi người thật sự làm và commit phần của mình** bằng tên thật, qua nhánh + Pull Request.
> Dự án thiết kế cho 4 vai P1–P4 (xem `docs/API_CONTRACT.md` — đây là "hợp đồng" giúp 4 người làm song song không kẹt nhau).

## 1. Phân công module (sở hữu file rõ ràng)

| Người | Vai | Sở hữu file | Nhiệm vụ chính |
|---|---|---|---|
| **P1** | Frontend / UI | `web/src/**` (App, ChatPanel, PreviewPanel, CodeViewer + Monaco, AgentSteps, BrandPanel, ComponentPanel, api.js, monacoSetup) | Giao diện, preview iframe, editor, panel brand/component, export .zip |
| **P2** | Backend & Pipeline | `server/src/index.js`, `pipeline.js`, `qwenClient.js`, `parser.js`, `.env.example`, `scripts/test-model.js` | API, điều phối agent, gọi model thật, parse output |
| **P3** | Code RAG (lõi Mức 3) | `server/src/rag/**`, `scripts/build-rag.js`, `scripts/test-rag.js` | Kho component, embedding local, store, truy xuất top-k, ingest CRUD |
| **P4** | Agents + Brand + Đánh giá | `server/src/review.js`, `prompts/codegen.js`, `brands.js`, `scripts/{eval,test-review,test-brand}.js`, `docs/**` | Review Agent, prompt, cá nhân hóa brand, eval B4, báo cáo B5 |

**Hợp đồng giữa các module = `docs/API_CONTRACT.md`.** Mọi thay đổi interface phải cập nhật file này **trước** và báo cả nhóm.

## 2. Nhánh & quy trình Pull Request

```
main  ← chỉ merge qua PR đã được review
 ├─ feat/p1-ui
 ├─ feat/p2-pipeline
 ├─ feat/p3-rag
 └─ feat/p4-agents-eval
```

Quy trình mỗi người:
```bash
git checkout main && git pull
git checkout -b feat/p3-rag          # nhánh của mình
# ... code phần mình ...
git add -A
git commit -m "rag: thêm kho ~30 component + embedding local"
git push -u origin feat/p3-rag
# Mở Pull Request trên GitHub -> nhờ 1 người khác review -> merge vào main
```
- Mỗi tính năng = **1 PR nhỏ**; người khác review chéo rồi mới merge.
- Trước khi bắt phần mới: `git pull origin main` để đồng bộ.
- **Luôn giữ `main` chạy được.**

## 3. Quy ước commit (Conventional Commits)

`<scope>: <mô tả ngắn>` — scope ∈ `ui | server | rag | review | brand | eval | docs`.

Ví dụ: `rag: nối retrieveComponents vào pipeline` · `ui: thêm BrandPanel` · `eval: so sánh RAG on/off`.

## 4. Lịch 3 ngày (mỗi người có việc & commit mỗi ngày)

### Ngày 1 — Nền móng
| Người | Việc → commit |
|---|---|
| P1 | `ui: skeleton layout + ChatPanel + PreviewPanel(iframe)` · `ui: api.js khớp hợp đồng` |
| P2 | `server: Express + /api/generate,/edit,/health` · `server: qwenClient + parser + MOCK` |
| P3 | `rag: gom ~30 component + buildEmbedText` · `rag: embed.js (local đa ngôn ngữ)` |
| P4 | `docs: chốt API_CONTRACT` · `prompts: codegen + OUTPUT_RULES + project mẫu` |

### Ngày 2 — Tích hợp tính năng
| Người | Việc → commit |
|---|---|
| P1 | `ui: CodeViewer Monaco + AgentSteps` · `ui: BrandPanel + ComponentPanel (CRUD)` |
| P2 | `server: nối model thật (DashScope) + test:model` · `server: hardening (max_tokens, timeout, json mode)` |
| P3 | `rag: store memory/Chroma + retrieve top-k` · `rag: nối vào pipeline + ingest CRUD` |
| P4 | `review: soát HTML + tự sửa 1 vòng` · `brand: /api/brands + boost truy xuất + nhồi prompt` |

### Ngày 3 — Đánh giá, hoàn thiện, báo cáo
| Người | Việc → commit |
|---|---|
| P1 | `ui: export .zip (jszip)` · `ui: chỉnh UX, fix preview` |
| P2 | `server: xử lý lỗi parse/cắt cụt + finish_reason` · review PR các nhánh |
| P3 | `rag: tinh chỉnh top-k/brand boost` · `test: test-rag/test-brand` |
| P4 | `eval: chạy B4 so RAG on/off + eval-results.json` · `docs: REPORT.md + demo` |

Cuối ngày 3: gộp hết về `main`, gắn tag `v1.0`.

## 5. Điểm phụ thuộc (để không chặn nhau)
- P1 chỉ cần **hợp đồng API** (P4 chốt ngày 1) → code UI với `MOCK_MODE=1`, không chờ P2/P3.
- P3 cắm RAG qua `pipeline.js` — thống nhất với P2 chữ ký `retrieveComponents(...)`.
- P4 chạy `eval` cần P2 (model thật) + P3 (RAG) xong → để **cuối ngày 3**.
- Đổi interface → cập nhật `API_CONTRACT.md` trước, báo cả nhóm.

## 6. Quy ước code chung (xem `CLAUDE.md`)
- Backend ESM (`"type":"module"`), Node ≥18, **comment tiếng Việt**.
- `pipeline.js` là nơi điều phối agent **duy nhất**.
- Output model = **HTML/CSS/JS thuần, 1 file `/index.html` tự chứa**.
- **KHÔNG commit `.env`** (đã chặn trong `.gitignore`).
