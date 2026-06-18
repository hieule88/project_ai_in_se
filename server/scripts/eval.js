/**
 * EVAL (Bước 4) — đánh giá + SO SÁNH có/không RAG, tập trung vào GIÁ TRỊ THẬT của RAG.
 * Chạy:  cd server && npm run eval
 *
 * Vì sao bộ chỉ số này tốt hơn "tỉ lệ HTML hợp lệ":
 *   - HTML hợp lệ là ngưỡng quá dễ (model nào cũng đạt ~100%) → không phân biệt được RAG.
 *   - Giá trị thật của RAG là GROUNDING: trang sinh ra có DÙNG LẠI component trong kho không.
 *     RAG OFF không có component nào để dùng → grounding ≈ 0. Đây là điểm bộc lộ sức mạnh RAG.
 *
 * Chỉ số:
 *   1) Bám kho (component tái dùng TB): #component trong kho mà output dùng lại (>=2 class đặc trưng).
 *   2) Tỉ lệ component truy xuất được dùng (chỉ RAG ON): trong K component nhồi vào, bao nhiêu % được dùng.
 *   3) Độ phủ yêu cầu: trang có đủ thành phần mô tả yêu cầu (form/list/giá/ảnh/nav/cta) không.
 *   4) Hiệu quả (phụ): độ trễ, kích thước HTML.
 *
 * ⚠️ Cần MOCK_MODE=0 (model thật) để có số liệu ý nghĩa.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';
import { retrieveComponents } from '../src/rag/retrieve.js';
import { components as builtin } from '../src/rag/components.js';
import { listUserComponents } from '../src/rag/userComponents.js';

// Mỗi prompt kèm `need`: các tín hiệu kỳ vọng có trong HTML (đo độ phủ yêu cầu).
const PROMPTS = [
  { text: 'Landing page quán cà phê, có thực đơn kèm giá và nút đặt bàn', need: ['nav', 'list', 'price', 'form'] },
  { text: 'Trang bán hàng online: danh sách sản phẩm, giá và nút mua', need: ['list', 'price', 'cta', 'img'] },
  { text: 'Portfolio cá nhân: thư viện ảnh, dự án và form liên hệ', need: ['img', 'form'] },
  { text: 'Landing page SaaS: bảng giá, tính năng và đánh giá khách hàng', need: ['price', 'cta'] },
  { text: 'Trang nhà hàng: thực đơn, đặt bàn và thư viện ảnh', need: ['list', 'form', 'img'] },
  { text: 'Trang sự kiện hội thảo: lịch trình, diễn giả và đăng ký tham dự', need: ['list', 'form'] },
  { text: 'Blog cá nhân: danh sách bài viết và giới thiệu tác giả', need: ['list', 'img'] },
  { text: 'Trang dịch vụ spa: các dịch vụ, bảng giá và đặt lịch hẹn', need: ['price', 'form'] },
  { text: 'Trang khóa học online: danh sách khóa học, giá và đăng ký nhận tin', need: ['list', 'price', 'form'] },
  { text: 'Trang agency marketing: dịch vụ, đội ngũ và lời chứng thực', need: ['img', 'cta'] },
  { text: 'Landing page ứng dụng di động: tính năng, ảnh chụp màn hình và nút tải app', need: ['img', 'cta'] },
  { text: 'Trang giới thiệu công ty công nghệ: về chúng tôi, dịch vụ và liên hệ', need: ['nav', 'form'] },
];

// Tín hiệu thành phần trong HTML (đo độ phủ yêu cầu).
const SIGNAL = {
  nav: (h) => /<nav[\s>]|navbar/i.test(h),
  list: (h) => /<(ul|ol|table)[\s>]/i.test(h),
  price: (h) => /(\d[\d.,]*\s*(đ|₫|vnd))|\$\s?\d/i.test(h),
  form: (h) => /<form[\s>]/i.test(h),
  img: (h) => /<img[\s>]/i.test(h),
  cta: (h) => /<button[\s>]|class="[^"]*\b(btn|cta)/i.test(h),
};

/** Lấy tập class CSS đặc trưng (>=3 ký tự) từ một đoạn HTML. */
function classTokens(html) {
  const out = new Set();
  const re = /class\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    for (const t of m[1].split(/\s+/)) if (t.length >= 3) out.add(t);
  }
  return out;
}

/** Đếm số component được "dùng lại": >=2 class đặc trưng của nó xuất hiện trong output. */
function countReused(comps, outClasses) {
  let n = 0;
  for (const c of comps) {
    const cs = classTokens(c.code);
    let inter = 0;
    for (const t of cs) if (outClasses.has(t)) inter++;
    if (inter >= 2) n++;
  }
  return n;
}

const LIBRARY = [...builtin, ...listUserComponents()];

async function runOne(p, ragOn) {
  const t0 = Date.now();
  let result, error = null;
  try {
    result = await runGenerate({ description: p.text, language: 'vi' });
  } catch (e) {
    error = e.message;
  }
  const latencyMs = Date.now() - t0;
  if (error) return { ok: false, latencyMs, htmlBytes: 0, coverage: 0, reusedLib: 0, reusedRetrievedRate: null, error };

  const index = result.files.find((f) => f.path === '/index.html') || result.files[0];
  const html = index ? index.content : '';
  const outClasses = classTokens(html);

  // Độ phủ yêu cầu
  const covered = p.need.filter((k) => SIGNAL[k]?.(html)).length;
  const coverage = p.need.length ? covered / p.need.length : 1;

  // Bám kho (toàn bộ thư viện)
  const reusedLib = countReused(LIBRARY, outClasses);

  // Tỉ lệ component truy xuất được dùng (chỉ RAG ON)
  let reusedRetrievedRate = null;
  if (ragOn) {
    const retrieved = await retrieveComponents({ description: p.text });
    reusedRetrievedRate = retrieved.length ? countReused(retrieved, outClasses) / retrieved.length : 0;
  }

  return {
    ok: result.entry === '/index.html' && html.length > 200,
    latencyMs,
    htmlBytes: html.length,
    coverage,
    reusedLib,
    reusedRetrievedRate,
    error: null,
  };
}

async function runMode(ragOn) {
  process.env.RAG_ENABLED = ragOn ? '1' : '0';
  const rows = [];
  for (const p of PROMPTS) {
    const m = await runOne(p, ragOn);
    rows.push(m);
    process.stdout.write(m.ok ? '.' : 'x');
  }
  process.stdout.write('\n');
  return rows;
}

function agg(rows, ragOn) {
  const n = rows.length;
  const avg = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0) / n;
  const out = {
    successRate: (rows.filter((r) => r.ok).length / n) * 100,
    avgReusedLib: avg('reusedLib'),
    avgCoverage: avg('coverage') * 100,
    avgLatency: avg('latencyMs'),
    avgHtmlBytes: Math.round(avg('htmlBytes')),
  };
  if (ragOn) {
    const valid = rows.filter((r) => typeof r.reusedRetrievedRate === 'number');
    out.avgReusedRetrieved =
      (valid.reduce((s, r) => s + r.reusedRetrievedRate, 0) / (valid.length || 1)) * 100;
  }
  return out;
}

function table(on, off) {
  const f = (v, d = 2, suf = '') => `${v.toFixed(v % 1 === 0 ? 0 : d)}${suf}`;
  const pad = (s, w) => String(s).padEnd(w);
  const rows = [
    ['Tỉ lệ thành công (HTML hợp lệ)', f(on.successRate, 0, '%'), f(off.successRate, 0, '%')],
    ['★ Bám kho — component tái dùng TB', f(on.avgReusedLib), f(off.avgReusedLib)],
    ['★ % component truy xuất được dùng', f(on.avgReusedRetrieved, 0, '%'), '—'],
    ['Độ phủ yêu cầu TB', f(on.avgCoverage, 0, '%'), f(off.avgCoverage, 0, '%')],
    ['Độ trễ TB (ms)', f(on.avgLatency), f(off.avgLatency)],
    ['Kích thước HTML TB', f(on.avgHtmlBytes), f(off.avgHtmlBytes)],
  ];
  return [
    `${pad('Chỉ số', 36)}${pad('RAG ON', 12)}RAG OFF`,
    '─'.repeat(58),
    ...rows.map(([k, a, b]) => `${pad(k, 36)}${pad(a, 12)}${b}`),
  ].join('\n');
}

async function main() {
  const mock = process.env.MOCK_MODE === '1';
  console.log(`\n=== EVAL (B4) · ${PROMPTS.length} prompt · ${mock ? 'MOCK' : process.env.QWEN_MODEL} ===`);
  console.log(`Kho RAG: ${LIBRARY.length} component`);
  if (mock) console.log('⚠️  MOCK: output cố định → số liệu ON/OFF giống nhau. Chạy thật (MOCK_MODE=0) để có ý nghĩa.');

  console.log('\n[RAG ON]');
  const onRows = await runMode(true);
  console.log('[RAG OFF]');
  const offRows = await runMode(false);

  const on = agg(onRows, true);
  const off = agg(offRows, false);
  console.log('\n' + table(on, off) + '\n');
  console.log('★ = chỉ số bộc lộ giá trị RAG (grounding/tái sử dụng kho). Bám kho cao + OFF≈0 → RAG thực sự định hướng đầu ra.');

  const outFile = fileURLToPath(new URL('../eval-results.json', import.meta.url));
  writeFileSync(
    outFile,
    JSON.stringify(
      { when: new Date().toISOString(), mock, model: mock ? 'mock' : process.env.QWEN_MODEL, library: LIBRARY.length, prompts: PROMPTS, summary: { ragOn: on, ragOff: off }, detail: { ragOn: onRows, ragOff: offRows } },
      null,
      2
    )
  );
  console.log('📄 Lưu chi tiết: server/eval-results.json');
}

main().catch((err) => {
  console.error('[eval] ❌ lỗi:', err.message);
  process.exit(1);
});
