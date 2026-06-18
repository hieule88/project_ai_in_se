# TEAM_PLAN — Phân công & quy trình git (4 người · 3 ngày)

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
main 
 ├─ feat/ui
 ├─ feat/pipeline
 ├─ feat/rag
 └─ feat/agents-eval
```

Quy trình mỗi người:
```bash
git checkout main && git pull
git checkout -b feat/rag          # nhánh của mình
# ... code phần mình ...
git add -A
git commit -m "rag: thêm kho ~30 component + embedding local"
git push -u origin feat/rag
# Mở Pull Request trên GitHub -> nhờ Pi+1 review (trong đó Pi là bạn, kiểm tra Pi hằng ngày trong doc https://docs.google.com/document/d/1-x9u9rCsbD8SoEQwrp-YOnC5pX4LIA8SBKNX1_FbrUc/edit?usp=sharing) -> merge vào main
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

## 4b. Phân công theo FILE cụ thể (theo ngày)

### Ngày 1 — Nền móng
| Người | File commit | Commit |
|---|---|---|
| **P1** | `web/index.html`, `web/vite.config.js`, `web/package.json`, `web/tailwind.config.js`, `web/postcss.config.js`, `web/src/main.jsx`, `web/src/App.jsx`, `web/src/api.js`, `web/src/components/{ChatPanel,PreviewPanel,AgentSteps,CodeViewer}.jsx` | `ui: skeleton layout + chat + preview iframe` |
| **P2** | `server/package.json`, `server/.env.example`, `server/src/index.js`, `server/src/qwenClient.js`, `server/src/parser.js`, `server/src/pipeline.js` (stub), `server/scripts/test-model.js` | `server: API + qwenClient(mock) + parser` |
| **P3** | `server/src/rag/components.js`, `server/src/rag/embed.js`, `server/scripts/build-rag.js`, `server/scripts/test-rag.js` | `rag: kho component + embedding local` |
| **P4** | `docs/API_CONTRACT.md`, `server/src/prompts/codegen.js`, `README.md`, `CLAUDE.md`, `.gitignore` | `docs: hợp đồng API` · `prompts: codegen` |

### Ngày 2 — Tích hợp tính năng
| Người | File commit | Commit |
|---|---|---|
| **P1** | `web/src/components/CodeViewer.jsx` (Monaco), `web/src/monacoSetup.js`, `web/src/components/BrandPanel.jsx`, `web/src/components/ComponentPanel.jsx`, `web/src/App.jsx` (gắn panel) | `ui: Monaco + Brand/Component panel` |
| **P2** | `server/src/qwenClient.js` (hardening: max_tokens/timeout/json mode), `server/src/pipeline.js` (nối RAG/review/brand) | `server: model thật + hardening + wiring` |
| **P3** | `server/src/rag/store.js`, `server/src/rag/retrieve.js`, `server/src/rag/ingest.js`, `server/src/rag/userComponents.js` | `rag: store + retrieve top-k + ingest CRUD` |
| **P4** | `server/src/review.js`, `server/src/brands.js`, `server/src/prompts/codegen.js` (brand block + fix), `server/scripts/{test-review,test-brand}.js`, `server/src/index.js` (route brands/components) | `review + brand: agent + /api/brands` |

### Ngày 3 — Design system, đánh giá, báo cáo
| Người | File commit | Commit |
|---|---|---|
| **P1** | `web/src/App.jsx` (export `.zip` jszip), `web/package.json` (jszip/monaco), tinh chỉnh UX | `ui: export .zip + polish` |
| **P2** | `server/src/parser.js` / `qwenClient.js` (bắt `finish_reason=length`); review PR các nhánh | `server: xử lý lỗi cắt cụt` |
| **P3** | `server/src/rag/dbeeTheme.js`, `server/src/rag/components.js` (design system DBEE), `server/src/rag/retrieve.js` (brand boost) | `rag: design-system DBEE + theme` |
| **P4** | `server/scripts/eval.js`, `server/scripts/eval-consistency.js`, `docs/REPORT.md`, `docs/{TEAM_PLAN,REVIEW_CHECKLIST}.md`, `.github/PULL_REQUEST_TEMPLATE.md` | `eval: B4 + consistency` · `docs: báo cáo` |
