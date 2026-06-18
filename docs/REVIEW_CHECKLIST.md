# REVIEW_CHECKLIST — Người review chéo dùng trước khi bấm Merge

Mỗi PR cần **1 người khác** (không phải tác giả) duyệt theo danh sách dưới. Có mục nào ✗ thì comment yêu cầu sửa, chưa merge.

## A. Chạy & an toàn (bắt buộc)
- [ ] Đã `git pull` nhánh về và **chạy thử được** (server `npm run dev` + web `npm run dev` không lỗi).
- [ ] **Không có `.env` / API key / secret** trong diff (kiểm `git diff` + `git ls-files | grep .env` chỉ thấy `.env.example`).
- [ ] Không lỡ commit `node_modules/`, `rag-index.json`, `eval-results.json`.
- [ ] Test liên quan pass: `test:rag` / `test:review` / `test:brand` (miễn phí) — `test:model`/`eval` chỉ khi đụng model thật.

## B. Hợp đồng & kiến trúc
- [ ] Nếu đổi request/response API → **`docs/API_CONTRACT.md` đã được cập nhật** cùng PR.
- [ ] Output model vẫn là **HTML/CSS/JS thuần, 1 file `/index.html` tự chứa** (không React/CDN).
- [ ] Việc điều phối agent vẫn nằm ở `pipeline.js` (không rải logic điều phối ra nơi khác).
- [ ] Thay đổi không phá nhánh `main` chạy được.

## C. Chất lượng code
- [ ] Backend ESM, Node ≥18; **comment tiếng Việt**, theo phong cách code hiện có.
- [ ] Không lặp code thừa; tên hàm/biến rõ nghĩa.
- [ ] Xử lý lỗi hợp lý (không nuốt lỗi âm thầm; có fallback nếu phù hợp — vd RAG/Review không được chặn pipeline).
- [ ] Không hardcode giá trị nên để ở `.env` (model, max_tokens, top-k…).

## D. Theo phần (chọn mục liên quan)
**P1 — UI:** preview iframe hiển thị đúng · không lỗi console · responsive cơ bản.
**P2 — Pipeline:** parse chịu được output có ```fence``` / lời dẫn · báo lỗi rõ khi model cắt cụt.
**P3 — RAG:** `build:rag` chạy được · truy xuất trả đúng component liên quan · component brand chỉ hiện khi có brandId.
**P4 — Agents/Brand/Eval:** Review không làm hỏng HTML hợp lệ · brand áp đúng màu/font/logo · `eval` xuất `eval-results.json`.

## Kết luận
- [ ] ✅ Approve & merge   /   [ ] 🔁 Yêu cầu sửa (ghi rõ ở comment)

> Sau khi merge: xóa nhánh đã merge, người sở hữu phần khác `git pull origin main` để đồng bộ.
