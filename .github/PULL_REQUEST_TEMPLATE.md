<!-- GitHub tự điền nội dung này khi bạn mở Pull Request. Xóa phần không liên quan. -->

## Mô tả
<!-- Làm gì, vì sao. 1–3 câu. -->


## Module / scope
- [ ] P1 — Frontend (`web/`)
- [ ] P2 — Backend & Pipeline (`server/src/index.js`, `pipeline.js`, `qwenClient.js`, `parser.js`)
- [ ] P3 — Code RAG (`server/src/rag/**`)
- [ ] P4 — Agents / Brand / Đánh giá (`review.js`, `prompts/`, `brands.js`, `scripts/eval.js`, `docs/`)

## Loại thay đổi
- [ ] Tính năng mới
- [ ] Sửa lỗi
- [ ] Refactor / dọn dẹp
- [ ] Tài liệu

## Có đổi interface không? (`docs/API_CONTRACT.md`)
- [ ] Không đổi
- [ ] Có đổi → **đã cập nhật `API_CONTRACT.md`** trong PR này và báo nhóm

## Cách kiểm thử
<!-- Lệnh đã chạy + kết quả. Ví dụ:
- `cd server && npm run test:rag` → OK
- `npm run dev` (web) → sinh thử "landing page quán cà phê" → preview hiển thị
-->


## Ảnh / preview (nếu là UI)
<!-- Dán ảnh chụp màn hình nếu đổi giao diện. -->


## Tự kiểm trước khi xin review
- [ ] Đã `git pull origin main` và xử lý xung đột (nếu có)
- [ ] Chạy được (`npm run dev` server + web không lỗi)
- [ ] **Không commit `.env`** hay secrets; không commit `node_modules/`, `rag-index.json`
- [ ] Comment bằng tiếng Việt, theo phong cách code hiện có
- [ ] Test liên quan đã pass (`test:rag` / `test:review` / `test:brand` / `test:model` tùy phần)
- [ ] PR nhỏ, tập trung 1 việc

## Người review
<!-- @tag 1 thành viên khác review chéo -->
