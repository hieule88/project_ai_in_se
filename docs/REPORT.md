# Báo cáo đồ án — WebGen: Trợ lý sinh web frontend đa tác tử với Code RAG

**Môn:** IT5380 — Trí tuệ nhân tạo trong Công nghệ phần mềm
**Đề tài:** Multi-Agent AI Pair Programming Assistant for Web Frontend Development with Code RAG
**Mục tiêu:** Mức 3 (nhờ thành phần Code RAG)

> Ghi chú điền báo cáo: chỗ đánh dấu `【…】` là số liệu/ảnh cần bạn bổ sung sau khi chạy thật
> (`npm run eval` → `eval-results.json`) hoặc trích từ tài liệu chính thức của mô hình.

---

## 1. Giới thiệu

WebGen là một trợ lý lập trình theo phong cách *bolt.new / v0* thu nhỏ: người dùng mô tả website
bằng ngôn ngữ tự nhiên (tiếng Việt hoặc tiếng Anh), hệ thống **sinh mã frontend**, hiển thị
**preview ngay trong trình duyệt**, và cho phép **chỉnh sửa qua hội thoại**. Điểm nhấn học thuật
(quyết định Mức 3) là thành phần **Code RAG** — truy xuất tăng cường sinh trên một kho tri thức
component giao diện — giúp đầu ra bám sát thư viện component có sẵn, giảm "bịa", và hỗ trợ cá nhân
hóa theo thương hiệu.

**Đóng góp chính:**
1. Quy trình **đa tác tử** (Orchestrator → RAG → Code → Review) trên một điểm điều phối duy nhất.
2. **Code RAG** dùng embedding cục bộ miễn phí + kho component có thể mở rộng lúc chạy (CRUD).
3. **Cá nhân hóa thương hiệu** (màu/font/logo) tích hợp vào cả truy xuất lẫn prompt.
4. **Review Agent** kiểm tra HTML tĩnh và tự sửa một vòng, tăng độ tin cậy đầu ra.

**Quyết định kiến trúc:** đầu ra là **HTML/CSS/JS thuần, một file `/index.html` tự chứa** (CSS trong
`<style>`, JS trong `<script>`); preview bằng **iframe cục bộ** (không phụ thuộc bundler ngoài, chạy
offline khi demo).

---

## 2. Kiến trúc tổng quan

```
                         ┌──────────────── Frontend (React + Vite) ─────────────────┐
   Người dùng  ──mô tả──▶│ ChatPanel · BrandPanel · ComponentPanel                  │
                         │ PreviewPanel (iframe) · CodeViewer (Monaco) · AgentSteps  │
                         └───────────────┬──────────────────────────────────────────┘
                                         │ HTTP JSON (/api/*)
                         ┌───────────────▼──────────── Backend (Node/Express) ───────┐
                         │ index.js (REST)                                            │
                         │ pipeline.js  ── điều phối đa tác tử (điểm duy nhất) ──┐     │
                         │   0. Resolve brand                                    │     │
                         │   1. Orchestrator (stub)                              │     │
                         │   2. RAG Agent  ──▶ rag/retrieve.js ──▶ vector store   │     │
                         │   3. Code Agent ──▶ qwenClient.js ──▶ Qwen3-Coder-Next │     │
                         │   4. Review Agent ─▶ review.js (+ tự sửa 1 vòng)       │     │
                         │   5. Chèn logo brand                                  │     │
                         └───────────────────────────────────────────────────────┘     │
                         └────────────────────────────────────────────────────────────┘
```

**Stack công nghệ:**
- **Backend:** Node ≥18 (ESM), Express; client model OpenAI-compatible; parser JSON phòng thủ.
- **RAG:** `@xenova/transformers` (embedding cục bộ), vector store dạng *memory* (cosine) hoặc **Chroma**.
- **Frontend:** React + Vite + Tailwind; Monaco Editor (cấu hình chạy cục bộ/offline); JSZip (export).
- **Mô hình:** **Qwen3-Coder-Next** (open-weight) qua endpoint OpenAI-compatible (DashScope quốc tế).

**Hợp đồng API** (`docs/API_CONTRACT.md`) cố định giao diện giữa các module:
`POST /api/generate`, `POST /api/edit` → `ProjectResult { summary, entry:"/index.html", files[], agentSteps[], meta }`.
Mô hình **bắt buộc** trả về **duy nhất một JSON** `{ summary, entry, files }`.

---

## 3. Mô hình sinh mã Qwen3-Coder-Next

### 3.1 Tổng quan họ Qwen3-Coder
Qwen3-Coder là dòng **mô hình ngôn ngữ lớn chuyên cho lập trình** (code LLM) thuộc hệ Qwen, **open-weight**,
được tinh chỉnh theo chỉ thị (instruction-tuned) cho các tác vụ: **sinh mã, chỉnh sửa mã, hiểu mã ở mức
kho (repository-level), điền vào giữa (fill-in-the-middle) và lập trình theo tác tử (agentic coding)**.
Mô hình hỗ trợ **ngữ cảnh dài** để xử lý nhiều tệp/đoạn mã, và phục vụ qua API tương thích OpenAI.
`qwen3-coder-next` là biến thể được dùng trong đồ án, truy cập qua **DashScope quốc tế**.

> 【Cần điền từ model card/technical report chính thức của Qwen】: số tham số (và kiến trúc, ví dụ
> Mixture-of-Experts nếu có), độ dài ngữ cảnh tối đa, điểm benchmark tiêu biểu (HumanEval, MBPP,
> SWE-bench…). Đồ án định hướng *application* nên trình bày ở mức sử dụng; con số tuyệt đối nên
> trích nguồn chính thức để đảm bảo chính xác.

### 3.1b Kiến trúc & cách sinh (giải thích tường tận)
- **Loại kiến trúc:** Transformer **decoder-only, sinh tự hồi quy (autoregressive)** — sinh **từng token một**,
  mỗi token được dự đoán dựa trên *toàn bộ* token đứng trước cộng với prompt. HTML/CSS/JS được "viết dần" theo
  cách này cho tới khi mô hình tự dừng (token kết thúc) hoặc chạm `max_tokens`.
- **Instruction-tuned:** đã được tinh chỉnh theo chỉ thị, nên tuân thủ tốt ràng buộc trong *system prompt*
  (ví dụ "chỉ trả về duy nhất một JSON").
- **`temperature`** điều khiển độ "ngẫu nhiên" khi lấy mẫu token: thấp (0.2) ⇒ phân phối xác suất "nhọn" ⇒ chọn
  token chắc chắn ⇒ đầu ra **ổn định, lặp lại được** — đúng nhu cầu sinh mã.
- **Kiến trúc 2 mô hình (đặc trưng của RAG):** dự án dùng **hai mô hình tách biệt** —
  một **encoder nhỏ chạy cục bộ** để *embed/truy xuất* (mục 4.4) và một **decoder lớn ở xa** để *sinh mã*.
  Retriever lo "hiểu ý & tìm component"; generator lo "viết HTML". Tách vai trò giúp truy xuất **nhanh & miễn phí**,
  chỉ tốn chi phí ở bước sinh.

### 3.2 Vì sao chọn Qwen3-Coder-Next
- **Open-weight & chuyên mã:** phù hợp định hướng đồ án; chất lượng sinh HTML/CSS/JS tốt.
- **OpenAI-compatible:** chỉ cần một client `qwenClient.js` gọi `/chat/completions`; dễ thay nhà cung cấp
  (DashScope / OpenRouter / self-host vLLM-Ollama) mà không đổi phần còn lại.
- **Ngữ cảnh dài:** đủ chỗ để **nhồi các component truy xuất từ RAG** vào prompt.

### 3.3 Cách tích hợp & cấu hình
Code Agent gọi mô hình qua `server/src/qwenClient.js` (chuẩn `/chat/completions`). Các tham số chính
(cấu hình ở `.env`):

| Tham số | Giá trị | Ý nghĩa |
|---|---|---|
| `QWEN_MODEL` | `qwen3-coder-next` | tên model |
| `temperature` | `0.2` | ưu tiên ổn định, ít ngẫu nhiên (sinh mã) |
| `QWEN_MAX_TOKENS` | `32000` | một trang HTML tự chứa rất dài; thấp quá sẽ **bị cắt cụt** |
| `QWEN_JSON_MODE` | `1` | ép trả đúng một JSON object (`response_format`) |
| `QWEN_TIMEOUT_MS` | `120000` | hủy nếu mô hình treo |

**Kỹ thuật prompt (`prompts/codegen.js`):** system prompt ràng buộc *OUTPUT_RULES* — trả về **duy nhất**
một JSON `{summary, entry, files}`, đầu ra là HTML/CSS/JS thuần, một `/index.html` tự chứa, không CDN,
không placeholder. Prompt người dùng = mô tả + (khối nhận diện brand) + **khối component RAG**.

**Phòng thủ khi nhận kết quả:**
- `parser.js`: bóc JSON kể cả khi mô hình lỡ bọc ```json fence``` hay kèm lời dẫn; chuẩn hóa `path`, chọn `entry`.
- `qwenClient.js`: phát hiện `finish_reason = "length"` → báo lỗi rõ "bị cắt cụt, tăng `QWEN_MAX_TOKENS`"
  thay vì để parser ném lỗi khó hiểu.

---

## 4. Công nghệ Code RAG (trọng tâm)

### 4.1 Động cơ & vai trò
Sinh mã "trần" bằng LLM dễ tạo giao diện chung chung, thiếu nhất quán, đôi khi "bịa" cấu trúc. **Code RAG**
khắc phục bằng cách **truy xuất các component giao diện liên quan từ một kho tri thức** rồi **nhồi vào
prompt** để mô hình **tái sử dụng đúng phong cách**. Đây là thành phần quyết định **Mức 3**: hệ thống không
chỉ gọi LLM mà còn có **lớp tri thức ngoài** + **truy xuất ngữ nghĩa** + **tăng cường sinh**.

### 4.1b Thuộc kỹ thuật RAG nào (phân loại)
Dự án dùng biến thể phổ biến nhất: **"retrieve-then-generate" + tăng cường trong ngữ cảnh (in-context / prompt augmentation)**.
- **Non-parametric memory:** tri thức (kho component) nằm **ngoài trọng số mô hình**; không fine-tune — chỉ
  **nhồi vào prompt** lúc chạy. Đổi/thêm tri thức ⇒ sửa kho, không train lại.
- **Single-shot retrieval:** truy xuất **một lần** trước khi sinh (không phải agentic/iterative truy xuất nhiều vòng).
- **Dense retrieval (truy xuất theo ngữ nghĩa):** so khớp **ý nghĩa** qua vector, không phải từ khóa (sparse/BM25) —
  xem 4.4b. Retriever là **bi-encoder**: query và document được embed **độc lập** rồi đo khoảng cách (khác
  cross-encoder phải đưa cặp (query, doc) qua model).
- **Code RAG:** tài liệu truy xuất là **đoạn mã/UI component**, dùng để *grounding* việc sinh mã.

### 4.2 Kiến trúc & luồng RAG
```
                       (offline, 1 lần)                         (mỗi lần sinh, online)
 kho component  ──┐                                  mô tả người dùng
 (components.js + │   buildEmbedText                         │ embedText(query)
  user-comp.json)─┼──▶  name+desc+tags  ──embed──▶  VECTOR     │
                  │                              STORE  ◀──────┘ query vector
                  │   addAll/upsert                 │ query(topK, {brand})
                  └─────────────────────────────────┤
                                                     ▼
                              top-k hits ──(brand boost + re-rank)──▶ ragBlock
                                                     │
                                                     ▼ nhồi vào prompt
                                              Code Agent (Qwen3-Coder-Next)
```
Hai pha: **(1) Index hóa offline** (`npm run build:rag`) — embed toàn kho và nạp vào store; **(2) Truy xuất
online** — mỗi yêu cầu sinh sẽ embed truy vấn, lấy top-k, ghép vào prompt.

### 4.3 Kho tri thức component
Mỗi component là một **snippet HTML/CSS thuần tự chứa**, mô tả bằng cấu trúc:
```js
{ id, name, description, tags, brand?, code }
```
- `description` viết **giàu từ khóa song ngữ (Việt + Anh)** — đây là phần được embed nên quyết định chất
  lượng truy xuất.
- Kho được thiết kế thành **"design system của DBEE"**: **16 component** (navbar, hero, khóa học, lịch khai giảng,
  lộ trình, tính năng, số liệu, giảng viên, cảm nhận, học phí, FAQ, CTA, form đăng ký, gallery, giới thiệu, footer)
  **dùng chung một nhận diện** (màu vàng `#f2db45`, cùng font, cùng quy ước class `dbee-*`) + component **người dùng
  tự thêm lúc chạy**. Mục tiêu: **mọi trang sinh ra đều cùng một "vibe" DBEE** và **nhiều trang dùng chung component
  ⇒ nhất quán giao diện** (xem 4.8).
- Văn bản đem đi embed: `buildEmbedText(c) = "{name}. {description}. tags: {tags}"`.

### 4.4 Embedding (cục bộ, miễn phí, đa ngôn ngữ)
- Thư viện: **`@xenova/transformers`** (Transformers.js) — chạy hẳn trong Node, **không gọi API, không tốn phí**.
- Mô hình: **`Xenova/paraphrase-multilingual-MiniLM-L12-v2`**, vector **384 chiều**.
- **Lý do chọn đa ngôn ngữ:** truy vấn chủ yếu tiếng Việt. Thử nghiệm ban đầu với model tiếng Anh
  (`all-MiniLM-L6-v2`) cho truy xuất tiếng Việt **kém rõ rệt** (ví dụ "bảng giá" không ra component bảng giá);
  sau khi đổi sang model đa ngôn ngữ, kết quả khớp đúng. Đây là một bài học kỹ thuật quan trọng của đồ án.
- **Chuẩn hóa vector** (`normalize: true`) → khi đó **cosine similarity = tích vô hướng**, tính nhanh và đơn giản.

**Về mô hình embedding:** thuộc họ **Sentence-Transformers / MiniLM** — encoder Transformer **12 lớp**, được
**chưng cất tri thức (knowledge distillation)** từ mô hình lớn hơn, huấn luyện trên dữ liệu **paraphrase đa ngôn ngữ**
(≈50+ ngôn ngữ, có tiếng Việt) để sinh **sentence embedding** (một vector đại diện cả câu).

**Cơ chế tạo vector (pipeline bên trong `embed.js`):**
```
text → tokenize → encoder Transformer → embedding theo TỪNG token
     → MEAN POOLING (trung bình có mặt nạ attention) → vector câu
     → L2 NORMALIZE (độ dài = 1) → vector 384 chiều
```
- **Mean pooling:** lấy trung bình embedding các token (bỏ padding) thành **một** vector đại diện cả câu
  (`{ pooling: 'mean' }`).
- **Chuẩn hóa L2:** đưa vector về độ dài 1 ⇒ cosine = tích vô hướng.

**Ý nghĩa hình học & công thức:** embedding ánh xạ văn bản thành **điểm trong không gian 384 chiều**, nơi
**ý nghĩa gần nhau ⇒ góc nhỏ ⇒ cosine cao**:
$$\cos(\mathbf a,\mathbf b)=\frac{\mathbf a\cdot\mathbf b}{\lVert\mathbf a\rVert\,\lVert\mathbf b\rVert}\ \xrightarrow{\text{đã chuẩn hóa}}\ \mathbf a\cdot\mathbf b \in[-1,1]$$

#### 4.4b Dense vs Sparse — vì sao chọn dense
- **Sparse (BM25/TF-IDF):** khớp **từ khóa** — "đặt bàn" không khớp "reservation/booking" nếu không trùng chữ.
- **Dense (đang dùng):** khớp **ý nghĩa** qua vector — bắt được đồng nghĩa và **song ngữ Việt–Anh**, đúng nhu cầu
  vì truy vấn người dùng rất tự do. Đây là lý do RAG ở đây dùng embedding chứ không phải tìm kiếm từ khóa.

### 4.5 Vector store (trừu tượng hóa: memory + Chroma)
`store.js` cung cấp một **giao diện chung** (`addAll`, `upsertItems`, `removeItems`, `query`) với hai backend,
chọn qua `RAG_STORE`:
- **`memory` (mặc định):** **NN chính xác (exact, brute-force)** — tính cosine của query với **tất cả** vector
  rồi sắp xếp; với kho ~17 component thì O(N) là tức thời. Lưu ra `rag-index.json`. **Không cần cài/chạy thêm gì** —
  phù hợp phát triển, kiểm thử và làm fallback.
- **`chroma`:** vector DB thật, dùng **ANN — Approximate Nearest Neighbor qua HNSW** (`hnsw:space: cosine`):
  index đồ thị phân tầng cho tìm gần đúng **cực nhanh khi kho lớn** (hàng vạn+). Embedding được **truyền sẵn**
  nên Chroma không tự sinh; chạy bằng `chroma run`.

Tức là tùy quy mô: kho nhỏ → exact (chính xác tuyệt đối); kho lớn → ANN (đánh đổi chút chính xác lấy tốc độ).
Cách trừu tượng hóa vừa đảm bảo "luôn có nhánh chạy được" (memory), vừa thể hiện tích hợp vector DB thực thụ (Chroma).

### 4.6 Logic truy xuất (chi tiết — `retrieve.js`)
Hàm `retrieveComponents({ description, brandId, k })`:
1. Nếu RAG tắt (`RAG_ENABLED=0`) hoặc mô tả rỗng → trả `[]`.
2. `topK = RAG_TOP_K` (mặc định **6** — đủ phủ nhiều section của một trang).
3. `embedText(description)` → vector truy vấn (384 chiều, đã chuẩn hóa).
4. Gọi `store.query(queryVec, fetchK, { brand })`:
   - **Lọc theo brand:** không có brand → **chỉ lấy component dùng chung** (ẩn component riêng của brand khác);
     có brand → lấy **component dùng chung + component của đúng brand đó**.
   - Khi có brand, lấy dư (`fetchK = topK + 6`) để còn chỗ cho bước boost.
5. **Cộng điểm ưu tiên brand:** mỗi hit thuộc đúng brand được cộng `RAG_BRAND_BOOST` (mặc định **+0.15**) vào điểm
   tương đồng, rồi **sắp xếp lại** và cắt **top-k**. Nhờ vậy component thương hiệu được ưu tiên xuất hiện.
6. Trả về danh sách `{ id, name, description, tags, code, score }`.

> Đây chính là "logic RAG" cốt lõi: **embed truy vấn → tìm láng giềng gần nhất theo cosine → lọc/ưu tiên theo
> ngữ cảnh (brand) → tái xếp hạng → lấy top-k**.

### 4.7 Tăng cường sinh (prompt augmentation) — tách CẤU TRÚC khỏi STYLE
Vấn đề khi nhồi component "thô": mô hình **vẽ lại CSS** mỗi lần ⇒ lệch cỡ chữ navbar, bo góc, footer giữa các
trang. Giải pháp (trong `codegen.js`): khi nhồi component, **bỏ khối `<style>`** → mô hình chỉ thấy **cấu trúc
HTML** và bị **cấm viết lại CSS** cho các class `dbee-*`:
```
=== DESIGN SYSTEM DBEE (BẮT BUỘC) ===
- Ráp trang bằng các MẪU HTML dưới đây, DÙNG ĐÚNG class dbee-*.
- KHÔNG viết lại CSS cho class dbee-* (style đã cố định trong theme).
# <name>
<HTML cấu trúc, không có style>
```

#### 4.7b Chèn "theme chuẩn" xác định (deterministic grounding)
Phần *style* được cấp **cố định** thay vì để mô hình sinh: `dbeeTheme.js` chứa **một bộ CSS chuẩn duy nhất** cho mọi
class `dbee-*` (tokens màu/font, bo góc, navbar, footer, nút…). `pipeline.js` **chèn khối theme này vào cuối
`<head>`** của trang sau khi sinh (đánh dấu `data-dbee-theme`, đặt cuối nên **thắng cascade** nếu mô hình lỡ viết
trùng). Kết quả: **cấu trúc do RAG gợi ý (mềm), style được cấp cố định (cứng)** ⇒ navbar/logo/footer **giống hệt
từng pixel** giữa các trang. Đây là cách "siết" RAG vượt ngoài RAG cổ điển để **ổn định vibe**.

### 4.8 Ingestion động & vòng đời dữ liệu (CRUD lúc chạy)
Người dùng cuối có thể **Thêm/Sửa/Xóa** component ngay trong giao diện (panel "Kho component RAG"):
- `POST/PUT/DELETE /api/components` → `ingest.js`: validate → lưu `user-components.json` → **embed riêng
  component đó** → **upsert/remove thẳng vào store** (không cần build lại toàn bộ).
- Dữ liệu **sống sót qua khởi động lại** (đọc lại từ file) và **qua `build:rag`** (script gộp *built-in + user*).
- Chỉ thao tác trên component người dùng; **component dựng sẵn được bảo vệ** (không cho sửa/xóa).

### 4.9 Cá nhân hóa thương hiệu (liên kết với RAG)
Thương hiệu (`brands.js`, `/api/brands`) khai báo **màu chủ đạo, font, logo**. Khi chọn brand:
- **Truy xuất:** ưu tiên component gắn brand (mục 4.6).
- **Prompt:** nhồi khối nhận diện (màu/font) để mô hình áp dụng xuyên suốt.
- **Logo ảnh:** không nhồi chuỗi base64 vào prompt (mô hình không chép lại được + tốn token + dễ cắt cụt);
  thay vào đó dùng **placeholder `__BRAND_LOGO__`**, rồi pipeline **thay bằng ảnh thật sau khi sinh**
  (`inlineBrandLogo`). Đây là một kỹ thuật xử lý tài nguyên nhị phân thông minh trong pipeline RAG.

---

## 5. Quy trình đa tác tử & Review Agent

`pipeline.js` là **điểm điều phối duy nhất**. Mỗi tác tử trả về một phần tử `agentSteps` để frontend hiển thị
tiến trình:
- **Orchestrator** (stub) — chỗ cắm phân rã yêu cầu trong tương lai.
- **RAG Agent** — truy xuất component (mục 4); có **fallback**: nếu store lỗi vẫn sinh được mã (không chặn pipeline).
- **Code Agent** — gọi Qwen3-Coder-Next, parse JSON.
- **Review Agent** (`review.js`) — **soát HTML tĩnh** (thiếu khung `<html>/<body>`, `<script>/<style>` lệch, bị
  cắt cụt, còn `TODO`, dùng CDN ngoài). Nếu có **lỗi (error)** → **gọi mô hình sửa một vòng** rồi soát lại; luôn
  có fallback giữ bản gốc nếu sửa thất bại.

---

## 6. Đánh giá

**Phương pháp:** bộ đo `scripts/eval.js` (`npm run eval`) chạy ~12 prompt đại diện qua pipeline ở **hai chế độ
`RAG_ENABLED=1` và `=0`**, đo và **so sánh**:
- Tỉ lệ thành công (HTML qua Review, `entry=/index.html`),
- Độ trễ trung bình,
- Số vòng sửa của Review,
- Số cảnh báo, kích thước HTML, số component RAG truy xuất.
Kết quả lưu `eval-results.json`.

**Kết quả (điền sau khi chạy thật):**

| Chỉ số | RAG ON | RAG OFF |
|---|---|---|
| Tỉ lệ thành công | 【…】 | 【…】 |
| Độ trễ TB (ms) | 【…】 | 【…】 |
| Vòng sửa TB | 【…】 | 【…】 |
| Cảnh báo TB | 【…】 | 【…】 |
| Component RAG TB | 【~6】 | 0 |

> 【Chèn 2–3 ảnh demo】: ví dụ landing page quán cà phê, trang bán hàng, và một trang có **brand** (logo + tông màu).

**Nhận định định tính:** RAG giúp đầu ra bám sát thư viện component (bố cục/phong cách nhất quán hơn), và khi
chọn brand thì áp đúng nhận diện. Với truy vấn ghép nhiều ý, một số ý phụ có thể bị loãng — minh chứng đặc tính
của truy xuất theo độ tương đồng (đã giảm thiểu bằng `top-k=6` và brand boost).

---

## 7. Hạn chế & hướng phát triển
- Truy vấn ghép nhiều ý có thể bỏ sót component phụ → có thể thử **re-ranking** hoặc tách truy vấn theo section.
- Orchestrator/Design Agent hiện là stub → mở rộng thành đa tác tử đầy đủ (phân rã layout, agent thiết kế).
- Đánh giá chất lượng trực quan có thể bổ sung **VLM chấm screenshot**.
- Kho component có thể mở rộng và phân loại tinh hơn; thêm nhiều brand mẫu.

## 8. Kết luận
WebGen hiện sinh được website thật từ mô tả, preview/sửa trong trình duyệt, với **Code RAG** là lõi: kho component
+ **embedding cục bộ đa ngôn ngữ** + **vector store (memory/Chroma)** + **truy xuất top-k có lọc/ưu tiên brand** +
**tăng cường prompt**, kèm **Review Agent** và **cá nhân hóa thương hiệu**. Thiết kế module rõ ràng (hợp đồng API)
cho phép mở rộng và làm việc nhóm thuận lợi.

---

### Phụ lục — Tệp/đường dẫn chính
- Model: `server/src/qwenClient.js`, `prompts/codegen.js`, `parser.js`
- RAG: `server/src/rag/{components,embed,store,retrieve,ingest,userComponents}.js`, `scripts/build-rag.js`
- Agents/Brand/Eval: `server/src/{pipeline,review,brands}.js`, `scripts/eval.js`
- Frontend: `web/src/App.jsx`, `web/src/components/*`
- Hợp đồng & vận hành: `docs/API_CONTRACT.md`, `README.md`, `CLAUDE.md`
