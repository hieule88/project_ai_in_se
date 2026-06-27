/**
 * EVAL MODELS — so sánh NHIỀU model sinh mã trên cùng pipeline + cùng RAG.
 * Chạy:  cd server && npm run eval:models
 *
 * Chỉ dùng metric có trong tài liệu (paper + bài "list of metrics" — RAGAS). Mỗi model đo:
 *   - Correct%      : Correctness — tỉ lệ HTML hợp lệ (entry=/index.html, đủ dài) [paper/article]
 *   - Lỗi%          : Runnable-fail — tỉ lệ gọi model thất bại (rate-limit/timeout) [paper: runnable/error]
 *   - Faithful      : Faithfulness (RAGAS) — số component kho tái dùng TB (output bám context)
 *   - AnswerRel%    : Answer Relevancy (RAGAS) — độ phủ thành phần yêu cầu
 *
 * ⚠️ Cần MOCK_MODE=0. Model free thường bị GIỚI HẠN tần suất → giữ ít prompt; nếu Lỗi% cao là do rate-limit.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';
import { components as builtin } from '../src/rag/components.js';
import { listUserComponents } from '../src/rag/userComponents.js';
import { MODELS } from '../eval-models.config.js';

// need = tín hiệu thành phần kỳ vọng trong HTML (đo Answer Relevancy / keyword-feature presence)
const PROMPTS = [
  { text: 'Trang chủ trung tâm dạy lập trình DBEE: giới thiệu, khóa học nổi bật, lộ trình, đăng ký tư vấn', need: ['nav', 'list', 'cta'] },
  { text: 'Trang lịch khai giảng các khóa học của DBEE', need: ['list', 'cta'] },
  { text: 'Trang học phí và các gói khóa học của DBEE', need: ['price', 'cta'] },
  { text: 'Trang giới thiệu giảng viên và cảm nhận học viên DBEE', need: ['img'] },
  { text: 'Trang đăng ký tư vấn khóa học của DBEE', need: ['form'] },
];

const SIGNAL = {
  nav: (h) => /<nav[\s>]|navbar/i.test(h),
  list: (h) => /<(ul|ol|table)[\s>]/i.test(h),
  price: (h) => /(\d[\d.,]*\s*(đ|₫|vnd))|\$\s?\d/i.test(h),
  form: (h) => /<form[\s>]/i.test(h),
  img: (h) => /<img[\s>]/i.test(h),
  cta: (h) => /<button[\s>]|class="[^"]*\b(btn|cta)/i.test(h),
};

const LIBRARY = [...builtin, ...listUserComponents()];

function classTokens(html) {
  const out = new Set();
  const re = /class\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) for (const t of m[1].split(/\s+/)) if (t.length >= 3) out.add(t);
  return out;
}
function countReused(comps, outClasses) {
  let n = 0;
  for (const c of comps) {
    const cs = classTokens(c.code);
    let i = 0;
    for (const t of cs) if (outClasses.has(t)) i++;
    if (i >= 2) n++;
  }
  return n;
}

async function runOne(p, llm) {
  process.env.RAG_ENABLED = '1';
  let r, err = null;
  try {
    r = await runGenerate({ description: p.text, language: 'vi', llm });
  } catch (e) {
    err = e.message;
  }
  if (err) return { ok: false, reused: 0, coverage: 0, err };
  const idx = r.files.find((f) => f.path === '/index.html') || r.files[0];
  const html = idx ? idx.content : '';
  const covered = p.need.filter((k) => SIGNAL[k]?.(html)).length;
  return {
    ok: r.entry === '/index.html' && html.length > 200, // Correctness (HTML hợp lệ)
    reused: countReused(LIBRARY, classTokens(html)), // Faithfulness (RAGAS)
    coverage: p.need.length ? covered / p.need.length : 1, // Answer Relevancy (RAGAS)
    err: null,
  };
}

async function evalModel(cfg) {
  process.stdout.write(`\n[${cfg.label}] `);
  const rows = [];
  for (const p of PROMPTS) {
    const m = await runOne(p, {
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      maxTokens: cfg.maxTokens,
      jsonMode: cfg.jsonMode,
      tokenParam: cfg.tokenParam,
      omitTemperature: cfg.omitTemperature,
    });
    rows.push(m);
    process.stdout.write(m.ok ? '.' : m.err ? '!' : 'x');
  }
  const n = rows.length;
  const avg = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0) / n;
  return {
    label: cfg.label,
    model: cfg.model,
    correctness: (rows.filter((r) => r.ok).length / n) * 100, // Correctness (HTML hợp lệ)
    errRate: (rows.filter((r) => r.err).length / n) * 100, // Runnable-fail (gọi model lỗi)
    faithfulness: avg('reused'), // Faithfulness — component tái dùng TB
    answerRel: avg('coverage') * 100, // Answer Relevancy — độ phủ
    errors: [...new Set(rows.filter((r) => r.err).map((r) => r.err))],
  };
}

async function main() {
  if (process.env.MOCK_MODE === '1') {
    console.error('⚠️  Cần MOCK_MODE=0 (model thật) để so sánh.');
    process.exit(1);
  }
  if (!MODELS.length) {
    console.error('❌ Chưa cấu hình model nào. Điền key/slug vào server/.env (xem eval-models.config.js).');
    process.exit(1);
  }
  console.log(`=== EVAL MODELS · ${MODELS.length} model × ${PROMPTS.length} prompt · kho ${LIBRARY.length} component ===`);

  const res = [];
  for (const cfg of MODELS) res.push(await evalModel(cfg));

  const pad = (s, w) => String(s).padEnd(w);
  console.log('\n\n' + pad('Model', 30) + pad('Correct%', 10) + pad('Lỗi%', 7) + pad('Faithful', 10) + 'AnswerRel%');
  console.log('─'.repeat(72));
  for (const r of res) {
    console.log(
      pad(r.label.slice(0, 28), 30) + pad(r.correctness.toFixed(0), 10) + pad(r.errRate.toFixed(0), 7) +
        pad(r.faithfulness.toFixed(1), 10) + r.answerRel.toFixed(0)
    );
  }
  console.log('\n(Correct%=HTML hợp lệ · Faithful=component tái dùng TB · AnswerRel%=độ phủ yêu cầu — thuật ngữ RAGAS/tài liệu)');
  for (const r of res) if (r.errors.length) console.log(`  • ${r.label} lỗi: ${r.errors[0]}`);

  writeFileSync(
    fileURLToPath(new URL('../eval-models-results.json', import.meta.url)),
    JSON.stringify({ when: new Date().toISOString(), prompts: PROMPTS, results: res }, null, 2)
  );
  console.log('\n📄 server/eval-models-results.json');
}

main().catch((e) => {
  console.error('[eval:models] ❌', e.message);
  process.exit(1);
});
