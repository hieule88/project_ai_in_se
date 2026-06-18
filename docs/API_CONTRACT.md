# API Contract — "Hợp đồng" giữa các module

Đây là giao diện ổn định giữa frontend, backend và pipeline agent.
**Không đổi schema này nếu chưa cập nhật cả tài liệu lẫn code cùng lúc.**

## Kiểu dữ liệu chung

```ts
type FileNode = { path: string; content: string };          // path luôn bắt đầu bằng "/"
type AgentStep = {
  agent: 'orchestrator' | 'design' | 'rag' | 'code' | 'review';
  status: 'running' | 'done' | 'skipped' | 'error';
  summary: string;
};
type ProjectResult = {
  summary: string;
  entry: string;            // luôn là "/index.html"
  files: FileNode[];
  agentSteps: AgentStep[];  // để frontend hiển thị tiến trình
  meta: { model: string; latencyMs: number };
};
```

## POST /api/generate
Sinh project mới từ mô tả.

Request:
```json
{ "description": "Landing page quán cà phê...", "language": "vi", "brandId": null }
```
`brandId` (tùy chọn): nếu có, backend tải nhận diện thương hiệu (màu/font/logo) nhồi vào prompt
và ưu tiên component gắn brand khi truy xuất RAG. Lấy danh sách brand qua `GET /api/brands`.

Response: `ProjectResult`

## Brand (cá nhân hóa — Bước 7)
```ts
type Brand = {
  id: string;                 // slug, ví dụ "acme-coffee"
  name: string;
  colors: { primary: string; bg?: string; text?: string };  // mã màu hex
  font?: string;              // ví dụ "Georgia, serif"
  logo?: string;              // data URI ảnh, URL, hoặc text/emoji (vd "☕")
};
```

### GET /api/brands
Response: `{ "brands": Brand[] }`

### POST /api/brands
Tạo brand mới (logo upload gửi dạng data URI).

Request:
```json
{ "name": "Acme Coffee", "colors": { "primary": "#6b4f3a" }, "font": "Georgia, serif", "logo": "data:image/png;base64,..." }
```
Response: `Brand` (kèm `id` sinh tự động).

## Component RAG (end-user tự thêm lúc chạy)

CRUD component user (THÊM/SỬA/XÓA). Chỉ thao tác trên component user — component dựng sẵn chỉ đếm số, không sửa/xóa.

### GET /api/components
Thống kê kho + danh sách FULL component user (kèm `code` để UI sửa). Response:
```json
{ "builtin": 33, "user": [ { "id": "my-pricing-vn", "name": "...", "description": "...", "tags": ["pricing"], "brand": "", "code": "<section>...</section>" } ] }
```

### POST /api/components
Thêm 1 component → backend embed + upsert vào store ngay (không cần build lại).
Lưu vào `user-components.json` nên sống sót qua restart và được `build:rag` gộp lại.

Request: `{ "name", "description", "tags": string[]|string, "brand": string|null, "code": string }`
Response: `{ "id", "name", "tags": string[], "brand": string }`
Lỗi 400 nếu thiếu `name`/`code` hoặc `code` không giống HTML.

### PUT /api/components/:id
Sửa 1 component user (re-embed + upsert theo id). Body như POST (các trường tùy chọn).
Lỗi 400 nếu `id` là component dựng sẵn hoặc không tồn tại.

### DELETE /api/components/:id
Xóa 1 component user (khỏi file + store). Response `{ "ok": true }`.
Lỗi 400 nếu `id` là component dựng sẵn hoặc không tồn tại.

## POST /api/edit
Chỉnh sửa project hiện có. Backend trả về TOÀN BỘ files sau sửa.

Request:
```json
{ "files": [ { "path": "/index.html", "content": "..." } ], "instruction": "Đổi màu nút thành xanh", "language": "vi" }
```
Response: `ProjectResult`

## POST /api/health
```json
{ "ok": true, "mock": true, "model": "mock" }
```

## Lỗi
HTTP 4xx/5xx kèm `{ "error": string, "raw"?: string }` (raw = output thô khi model trả JSON sai).

## Quy ước output của model (Code Agent)
Model PHẢI trả về DUY NHẤT một JSON đúng `{ summary, entry, files }`.
Stack output: **HTML/CSS/JS thuần**, một file `/index.html` TỰ CHỨA (CSS trong `<style>`, JS trong `<script>`), entry `/index.html`, không thư viện ngoài / không CDN.
Chi tiết ràng buộc nằm trong `server/src/prompts/codegen.js`.
