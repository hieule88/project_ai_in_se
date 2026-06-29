/**
 * EVAL MODELS — so sánh nhiều model trên CÙNG pipeline + CÙNG RAG.
 * Chạy:  cd server && npm run eval:models
 *
 * Các chỉ số:
 *   - Correct%   : Correctness (RAGAS, tài liệu) — HTML hợp lệ.
 *   - Lỗi%       : gọi model thất bại (rate-limit/timeout).
 *   - Reuse      : Component Reuse — số component kho RAG tái dùng TB. PROXY do nhóm thiết kế cho
 *                  "mức tận dụng ngữ cảnh truy xuất", KHÔNG phải Faithfulness RAGAS chuẩn (claim-based).
 *   - AnswerRel% : Answer Relevancy (RAGAS, tài liệu) — độ phủ thành phần yêu cầu.
 *   - Stab-Jac%  : chỉ số PHÁI SINH (nhóm thiết kế) — ổn định 2 lần gen, dựa trên text similarity (Jaccard).
 *   - Stab-Cos%  : chỉ số PHÁI SINH (nhóm thiết kế) — ổn định 2 lần gen, dựa trên semantic similarity (cosine).
 *   - Judge/VibeJ: LLM-as-Judge (tài liệu) — giám khảo trung lập chấm chất lượng & nhất quán vibe.
 *
 * Đồng thời LƯU 2 trang/model (cùng 1 prompt, gen 2 lần) vào server/eval-models-pages/<model>/run{1,2}.html
 * để xem trực quan độ ổn định "vibe".  ⚠️ Cần MOCK_MODE=0.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runGenerate } from '../src/pipeline.js';
import { components as builtin } from '../src/rag/components.js';
import { listUserComponents } from '../src/rag/userComponents.js';
import { embedText } from '../src/rag/embed.js';
import { qwenChat } from '../src/qwenClient.js';
import { MODELS, JUDGE } from '../eval-models.config.js';

// PROMPTS[0] = prompt dùng đo ỔN ĐỊNH (gen 2 lần). need = tín hiệu cho Answer Relevancy.
const PROMPTS = [
  { text: 'Trang chủ trung tâm dạy lập trình DBEE: giới thiệu, khóa học nổi bật, lộ trình, đăng ký tư vấn', need: ['nav', 'list', 'cta'] },
  { text: 'Trang học phí và các gói khóa học của DBEE', need: ['price', 'cta'] },
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
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const PAGES_DIR = fileURLToPath(new URL('../eval-models-pages/', import.meta.url));

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
function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // vector đã normalize -> dot = cosine
}
const safe = (s) => s.replace(/[^\w.-]+/g, '_').slice(0, 40);

// ---- LLM-as-Judge: chấm 1–5 (blind: KHÔNG cho biết model nào sinh ra trang) ----
const clamp5 = (v) => Math.max(1, Math.min(5, Number(v) || 0));
const grabJson = (text) => {
  const m = text && text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
};

function extractScore(text) {
  const o = grabJson(text);
  if (!o) return null;
  const relevance = clamp5(o.relevance);
  const design = clamp5(o.design);
  const codeQuality = clamp5(o.codeQuality);
  const overall = (relevance + design + codeQuality) / 3; // tự tính TB để phân hóa (không tin overall model làm tròn)
  return { relevance, design, codeQuality, overall, reason: String(o.reason || '').slice(0, 200) };
}

// Gọi giám khảo + retry (429/503 tạm thời) — dùng chung cho mọi loại chấm.
async function judgeCall(messages) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await qwenChat(messages, { ...JUDGE, temperature: 0 });
    } catch (e) {
      if (attempt < 3 && /429|503|rate|unavailable|overload|high demand|temporarily|too[ _]?many/i.test(e.message)) {
        const sec = Number((e.message.match(/retry_after_seconds"?\s*:?\s*(\d+)/i) || [])[1]) || 30;
        process.stdout.write('⏳');
        await sleep((sec + 2) * 1000);
        continue;
      }
      throw e;
    }
  }
}

// Chấm CHẤT LƯỢNG 1 trang.
async function judgeOne(requirement, html) {
  const sys =
    'Bạn là giám khảo đánh giá trang web tĩnh (HTML/CSS). Chấm KHÁCH QUAN theo rubric. ' +
    'Không biết model nào tạo ra trang. Chỉ trả về DUY NHẤT một JSON, không kèm giải thích ngoài JSON.';
  const user =
    `Yêu cầu của người dùng:\n"""${requirement}"""\n\n` +
    `Mã HTML của trang cần chấm:\n"""${html.slice(0, 40000)}"""\n\n` +
    `LƯU Ý: nếu HTML có vẻ bị cắt ở CUỐI, ĐỪNG trừ điểm vì điều đó — đó là giới hạn của hệ thống chấm, KHÔNG phải lỗi của trang.\n` +
    `Chấm 1–5 cho từng tiêu chí. HÃY KHẮT KHE VÀ PHÂN HÓA — chỉ cho 5 khi XUẤT SẮC, không lỗi; ` +
    `thiếu section/nội dung sơ sài → hạ "relevance"; bố cục lệch, khoảng cách/typography kém → hạ "design"; ` +
    `HTML thiếu thẻ, class lộn xộn, không semantic → hạ "codeQuality". Trả JSON đúng dạng:\n` +
    `{"relevance":<1-5>,"design":<1-5>,"codeQuality":<1-5>,"reason":"<1 câu ngắn nêu điểm trừ cụ thể>"}`;
  return extractScore(await judgeCall([{ role: 'system', content: sys }, { role: 'user', content: user }]));
}

// Chấm NHẤT QUÁN "vibe" giữa 2 trang sinh từ CÙNG yêu cầu (2 lần gen liên tiếp).
async function judgeConsistency(requirement, htmlA, htmlB) {
  const sys =
    'Bạn là giám khảo đánh giá độ NHẤT QUÁN giao diện giữa hai trang web. ' +
    'Chỉ trả về DUY NHẤT một JSON, không kèm giải thích ngoài JSON.';
  const user =
    `Hai trang dưới đây được sinh HAI LẦN từ CÙNG một yêu cầu:\n"""${requirement}"""\n\n` +
    `Hãy đánh giá mức NHẤT QUÁN "vibe" giữa chúng: nhận diện thương hiệu (logo/tên), bảng màu, ` +
    `typography (font/cỡ chữ), bố cục tổng thể & phong cách component có ĐỒNG NHẤT không.\n` +
    `Thang 1–5: 1=khác hẳn như hai website khác nhau; 3=cùng concept nhưng lệch nhiều chi tiết; ` +
    `5=gần như đồng nhất, như cùng một bộ thiết kế. KHẮT KHE và nêu rõ điểm khác biệt.\n\n` +
    `(Nếu HTML bị cắt ở cuối thì bỏ qua, chỉ xét phần hiển thị được.)\n\n` +
    `TRANG A:\n"""${htmlA.slice(0, 18000)}"""\n\n` +
    `TRANG B:\n"""${htmlB.slice(0, 18000)}"""\n\n` +
    `Trả JSON: {"vibe":<1-5>,"reason":"<1 câu nêu khác biệt/điểm chung chính>"}`;
  const o = grabJson(await judgeCall([{ role: 'system', content: sys }, { role: 'user', content: user }]));
  return o ? { vibe: clamp5(o.vibe), reason: String(o.reason || '').slice(0, 200) } : null;
}

async function runOne(p, llm) {
  process.env.RAG_ENABLED = '1';
  let r, err = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      r = await runGenerate({ description: p.text, language: 'vi', llm });
      err = null;
      break;
    } catch (e) {
      err = e.message;
      if (attempt < 2 && /429|503|quota|rate|unavailable|overload|high demand|temporarily|too[ _]?many/i.test(err)) {
        process.stdout.write('⏳');
        await sleep(30000);
        continue;
      }
      break;
    }
  }
  if (err) return { ok: false, reused: 0, coverage: 0, html: '', err };
  const idx = r.files.find((f) => f.path === '/index.html') || r.files[0];
  const html = idx ? idx.content : '';
  const covered = p.need.filter((k) => SIGNAL[k]?.(html)).length;
  return {
    ok: r.entry === '/index.html' && html.length > 200,
    reused: countReused(LIBRARY, classTokens(html)),
    coverage: p.need.length ? covered / p.need.length : 1,
    html,
    err: null,
  };
}

async function evalModel(cfg) {
  const llm = {
    model: cfg.model, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, maxTokens: cfg.maxTokens,
    jsonMode: cfg.jsonMode, tokenParam: cfg.tokenParam, omitTemperature: cfg.omitTemperature,
  };
  process.stdout.write(`\n[${cfg.label}] `);
  const rows = [];
  let runA = '', runB = '';

  for (let i = 0; i < PROMPTS.length; i++) {
    const m = await runOne(PROMPTS[i], llm);
    rows.push(m);
    process.stdout.write(m.ok ? '.' : m.err ? '!' : 'x');
    if (cfg.delayMs) await sleep(cfg.delayMs);

    if (i === 0) {
      runA = m.html;
      const m2 = await runOne(PROMPTS[0], llm); // gen lần 2 cùng prompt -> đo ổn định
      runB = m2.html;
      process.stdout.write(m2.ok ? '.' : m2.err ? '!' : 'x');
      if (cfg.delayMs) await sleep(cfg.delayMs);
    }
  }

  // Lưu 2 trang để xem trực quan
  const dir = `${PAGES_DIR}${safe(cfg.label)}/`;
  mkdirSync(dir, { recursive: true });
  if (runA) writeFileSync(`${dir}run1.html`, runA);
  if (runB) writeFileSync(`${dir}run2.html`, runB);

  // Ổn định giữa 2 lần gen
  let stabJac = null, stabCos = null;
  if (runA && runB) {
    stabJac = jaccard(classTokens(runA), classTokens(runB)) * 100;
    try {
      const [vA, vB] = [await embedText(runA.slice(0, 8000)), await embedText(runB.slice(0, 8000))];
      stabCos = dot(vA, vB) * 100;
    } catch { stabCos = null; }
  }

  const n = rows.length;
  const avg = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0) / n;
  return {
    label: cfg.label,
    model: cfg.model,
    correctness: (rows.filter((r) => r.ok).length / n) * 100,
    errRate: (rows.filter((r) => r.err).length / n) * 100,
    faithfulness: avg('reused'),
    answerRel: avg('coverage') * 100,
    stabJac,
    stabCos,
    judge: null, // điền ở pha chấm
    vibeJudge: null, // điền ở pha chấm (nhất quán vibe giữa 2 lần gen)
    page: runA, // trang prompt[0] lần 1 — bỏ trước khi ghi JSON
    pageB: runB, // trang prompt[0] lần 2 — để chấm nhất quán; bỏ trước khi ghi JSON
    promptForJudge: PROMPTS[0].text,
    errors: [...new Set(rows.filter((r) => r.err).map((r) => r.err))],
  };
}

async function main() {
  if (process.env.MOCK_MODE === '1') {
    console.error('⚠️  Cần MOCK_MODE=0 (model thật) để so sánh.');
    process.exit(1);
  }
  if (!MODELS.length) {
    console.error('❌ Chưa cấu hình model nào. Điền key vào server/.env (xem eval-models.config.js).');
    process.exit(1);
  }
  mkdirSync(PAGES_DIR, { recursive: true });
  console.log(`=== EVAL MODELS · ${MODELS.length} model × ${PROMPTS.length} prompt (prompt[0] gen 2 lần) · kho ${LIBRARY.length} component ===`);

  const res = [];
  for (const cfg of MODELS) res.push(await evalModel(cfg));

  // ---- Pha chấm điểm bằng giám khảo trung lập (nếu cấu hình JUDGE_*) ----
  if (JUDGE) {
    process.stdout.write(`\n\n[${JUDGE.label}] chấm (blind) `);
    for (const r of res) {
      if (!r.page) {
        process.stdout.write('x');
        continue;
      }
      // Tránh tự chấm: nếu giám khảo trùng model dự thi thì bỏ qua bài đó.
      if (JUDGE.model && r.model && JUDGE.model === r.model) {
        process.stdout.write('-');
        continue;
      }
      try {
        r.judge = await judgeOne(r.promptForJudge, r.page);
        process.stdout.write(r.judge ? '.' : '?');
        if (r.pageB) {
          r.vibeJudge = await judgeConsistency(r.promptForJudge, r.page, r.pageB);
          process.stdout.write(r.vibeJudge ? 'v' : '?');
        }
      } catch (e) {
        process.stdout.write('!');
        r.judgeErr = e.message;
      }
    }
  } else {
    console.log('\nℹ️  Chưa cấu hình giám khảo — bỏ qua Judge. Thêm JUDGE_API_KEY (+ JUDGE_BASE_URL/JUDGE_MODEL) vào .env.');
  }

  const pad = (s, w) => String(s).padEnd(w);
  const f = (v) => (v == null ? '—' : v.toFixed(v % 1 === 0 ? 0 : 1));
  const showJudge = res.some((r) => r.judge);
  console.log(
    '\n\n' + pad('Model', 30) + pad('Correct%', 9) + pad('Lỗi%', 6) + pad('Reuse', 9) +
      pad('AnsRel%', 8) + pad('Stab-Jac%', 10) + pad('Stab-Cos%', 11) +
      (showJudge ? pad('Judge1-5', 9) + 'VibeJ1-5' : '')
  );
  console.log('─'.repeat(showJudge ? 102 : 82));
  for (const r of res) {
    console.log(
      pad(r.label.slice(0, 28), 30) + pad(f(r.correctness), 9) + pad(f(r.errRate), 6) +
        pad(f(r.faithfulness), 9) + pad(f(r.answerRel), 8) + pad(f(r.stabJac), 10) +
        pad(f(r.stabCos), 11) + (showJudge ? pad(f(r.judge?.overall ?? null), 9) + f(r.vibeJudge?.vibe ?? null) : '')
    );
  }
  console.log('\nStab-Jac/Stab-Cos = giống nhau giữa 2 lần gen (đo máy). VibeJ = giám khảo chấm độ nhất quán vibe 2 lần gen.');
  if (showJudge) {
    console.log(`Judge/VibeJ chấm bởi giám khảo trung lập ${JUDGE.label} (blind). Chi tiết:`);
    for (const r of res) {
      if (r.judge) {
        const j = r.judge;
        console.log(`  • ${r.label}: rel ${j.relevance} · design ${j.design} · code ${j.codeQuality} → ${f(j.overall)} | ${j.reason}`);
      }
      if (r.vibeJudge) {
        console.log(`      ↳ Vibe 2 lần gen: ${r.vibeJudge.vibe}/5 | ${r.vibeJudge.reason}`);
      }
    }
  }
  console.log(`📂 Trang mẫu mỗi model: server/eval-models-pages/<model>/run1.html, run2.html`);
  for (const r of res) if (r.errors.length) console.log(`  • ${r.label} lỗi: ${r.errors[0]}`);

  const slim = res.map(({ page, pageB, ...r }) => r); // bỏ HTML thô khỏi file kết quả
  writeFileSync(
    fileURLToPath(new URL('../eval-models-results.json', import.meta.url)),
    JSON.stringify({ when: new Date().toISOString(), judge: JUDGE?.label || null, prompts: PROMPTS, results: slim }, null, 2)
  );
  console.log('📄 server/eval-models-results.json');
}

main().catch((e) => {
  console.error('[eval:models] ❌', e.message);
  process.exit(1);
});
