/**
 * EVAL (Bước 4) — đánh giá nhẹ + SO SÁNH có/không RAG.
 * Chạy:  cd server && npm run eval
 *
 * Với mỗi prompt, chạy pipeline 2 lần (RAG bật / tắt) và đo:
 *   - thành công: HTML qua được Review (reviewProject.ok) và entry = /index.html
 *   - độ trễ (ms)
 *   - số vòng sửa của Review Agent (0 hoặc 1 — autofix)
 *   - số cảnh báo, kích thước HTML, số component RAG truy xuất
 * Cuối cùng in bảng tổng hợp ON vs OFF và lưu eval-results.json.
 *
 * ⚠️ Ở MOCK_MODE=1: model trả PROJECT MẪU CỐ ĐỊNH, bỏ qua prompt → số liệu sinh code
 * giữa ON/OFF sẽ GIỐNG NHAU. Bộ đo này để CHẠY THẬT (MOCK_MODE=0) ở đợt cuối;
 * chạy trong MOCK chỉ để kiểm chứng bộ đo hoạt động.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';
import { reviewProject } from '../src/review.js';

const PROMPTS = [
  'Landing page cho quán cà phê, có menu và nút đặt bàn',
  'Trang giới thiệu công ty công nghệ: về chúng tôi, dịch vụ, liên hệ',
  'Trang bán hàng online: danh sách sản phẩm, giá và nút mua',
  'Portfolio cá nhân: thư viện ảnh, dự án và form liên hệ',
  'Landing page SaaS: bảng giá, tính năng và đánh giá khách hàng',
  'Trang nhà hàng: thực đơn, đặt bàn và thư viện ảnh',
  'Trang sự kiện hội thảo: lịch trình, diễn giả và đăng ký tham dự',
  'Blog cá nhân: danh sách bài viết và giới thiệu tác giả',
  'Trang dịch vụ spa: các dịch vụ, bảng giá và đặt lịch hẹn',
  'Trang khóa học online: danh sách khóa học, giá và đăng ký nhận tin',
  'Trang agency marketing: dịch vụ, đội ngũ và lời chứng thực',
  'Landing page ứng dụng di động: tính năng, ảnh chụp màn hình và nút tải app',
];

/** Chạy 1 prompt, trả về số liệu đo được. */
async function runOne(description) {
  const t0 = Date.now();
  let result, error = null;
  try {
    result = await runGenerate({ description, language: 'vi' });
  } catch (e) {
    error = e.message;
  }
  const latencyMs = Date.now() - t0;
  if (error) {
    return { ok: false, latencyMs, fixRound: 0, warnings: 0, htmlBytes: 0, retrieved: 0, error };
  }

  const review = reviewProject(result);
  const index = result.files.find((f) => f.path === '/index.html');
  const ragStep = result.agentSteps.find((s) => s.agent === 'rag');
  const reviewStep = result.agentSteps.find((s) => s.agent === 'review');

  return {
    ok: review.ok && result.entry === '/index.html',
    latencyMs,
    fixRound: reviewStep && /đã sửa/.test(reviewStep.summary) ? 1 : 0,
    warnings: review.warnings.length,
    htmlBytes: index ? index.content.length : 0,
    retrieved: ragStep ? Number((ragStep.summary.match(/Truy xuất (\d+)/) || [])[1] || 0) : 0,
    error: null,
  };
}

/** Chạy cả bộ prompt ở 1 chế độ RAG. */
async function runMode(ragEnabled) {
  process.env.RAG_ENABLED = ragEnabled ? '1' : '0';
  const rows = [];
  for (let i = 0; i < PROMPTS.length; i++) {
    const m = await runOne(PROMPTS[i]);
    rows.push(m);
    process.stdout.write(m.ok ? '.' : 'x');
  }
  process.stdout.write('\n');
  return rows;
}

function agg(rows) {
  const n = rows.length;
  const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
  return {
    n,
    successRate: (rows.filter((r) => r.ok).length / n) * 100,
    avgLatency: sum('latencyMs') / n,
    avgFixRounds: sum('fixRound') / n,
    avgWarnings: sum('warnings') / n,
    avgHtmlBytes: Math.round(sum('htmlBytes') / n),
    avgRetrieved: sum('retrieved') / n,
  };
}

function table(on, off) {
  const fmt = (v, suffix = '') => `${typeof v === 'number' ? v.toFixed(v % 1 === 0 ? 0 : 2) : v}${suffix}`;
  const pad = (s, w) => String(s).padEnd(w);
  const rowsDef = [
    ['Tỉ lệ thành công', fmt(on.successRate, '%'), fmt(off.successRate, '%')],
    ['Độ trễ TB (ms)', fmt(on.avgLatency), fmt(off.avgLatency)],
    ['Vòng sửa TB', fmt(on.avgFixRounds), fmt(off.avgFixRounds)],
    ['Cảnh báo TB', fmt(on.avgWarnings), fmt(off.avgWarnings)],
    ['Kích thước HTML TB', fmt(on.avgHtmlBytes), fmt(off.avgHtmlBytes)],
    ['Component RAG TB', fmt(on.avgRetrieved), fmt(off.avgRetrieved)],
  ];
  const lines = [
    `${pad('Chỉ số', 22)}${pad('RAG ON', 12)}RAG OFF`,
    '─'.repeat(44),
    ...rowsDef.map(([k, a, b]) => `${pad(k, 22)}${pad(a, 12)}${b}`),
  ];
  return lines.join('\n');
}

async function main() {
  const mock = process.env.MOCK_MODE === '1';
  console.log(`\n=== EVAL (B4) · ${PROMPTS.length} prompt · ${mock ? 'MOCK' : process.env.QWEN_MODEL} ===`);
  if (mock) {
    console.log('⚠️  MOCK: output cố định → số liệu ON/OFF sẽ giống nhau. Chạy thật với MOCK_MODE=0 để có số liệu thực.');
  }

  console.log('\n[RAG ON]');
  const onRows = await runMode(true);
  console.log('[RAG OFF]');
  const offRows = await runMode(false);

  const on = agg(onRows);
  const off = agg(offRows);

  console.log('\n' + table(on, off) + '\n');

  const outFile = fileURLToPath(new URL('../eval-results.json', import.meta.url));
  const payload = {
    when: new Date().toISOString(),
    mock,
    model: mock ? 'mock' : process.env.QWEN_MODEL,
    prompts: PROMPTS,
    summary: { ragOn: on, ragOff: off },
    detail: { ragOn: onRows, ragOff: offRows },
  };
  writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`📄 Lưu chi tiết: server/eval-results.json (dùng cho báo cáo)`);
}

main().catch((err) => {
  console.error('[eval] ❌ lỗi:', err.message);
  process.exit(1);
});
