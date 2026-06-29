/**
 * SMOKE TEST thí sinh — chạy MỖI model 2 lần gen THẬT (tái hiện kịch bản token/phút đã gây 429),
 * áp dụng delayMs + retry như eval:models, báo PASS/FAIL. Dùng để kiểm tra fix TRƯỚC khi chạy
 * bản đầy đủ (eval:models) — tránh tốn token khi model còn lỗi.
 * Chạy:  cd server && npm run test:models
 */
import 'dotenv/config';
import { runGenerate } from '../src/pipeline.js';
import { MODELS } from '../eval-models.config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROMPT = 'Trang chủ trung tâm dạy lập trình DBEE: giới thiệu, khóa học nổi bật, đăng ký tư vấn';

async function genOnce(llm) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await runGenerate({ description: PROMPT, language: 'vi', llm });
      const idx = r.files.find((f) => f.path === '/index.html') || r.files[0];
      const len = idx ? idx.content.length : 0;
      return { ok: r.entry === '/index.html' && len > 200, len };
    } catch (e) {
      if (attempt < 2 && /429|503|quota|rate|unavailable|overload|high demand|temporarily|too[ _]?many/i.test(e.message)) {
        process.stdout.write('⏳');
        await sleep(30000);
        continue;
      }
      return { ok: false, err: e.message };
    }
  }
}

async function main() {
  if (process.env.MOCK_MODE === '1') {
    console.error('⚠️  Cần MOCK_MODE=0.');
    process.exit(1);
  }
  process.env.RAG_ENABLED = '1';
  console.log(`=== SMOKE TEST · ${MODELS.length} model × 2 lần gen ===\n`);
  let allOk = true;

  for (const cfg of MODELS) {
    const llm = {
      model: cfg.model, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, maxTokens: cfg.maxTokens,
      jsonMode: cfg.jsonMode, tokenParam: cfg.tokenParam, omitTemperature: cfg.omitTemperature,
    };
    process.stdout.write(`[${cfg.label}] `);
    const a = await genOnce(llm);
    process.stdout.write(a.ok ? '✓' : '✗');
    if (cfg.delayMs) await sleep(cfg.delayMs);
    const b = await genOnce(llm);
    process.stdout.write(b.ok ? '✓' : '✗');

    const pass = a.ok && b.ok;
    allOk = allOk && pass;
    console.log(
      `  → ${pass ? 'PASS' : 'FAIL'}` +
        (a.ok && b.ok ? ` (HTML ~${a.len}/${b.len} ký tự)` : '') +
        (a.err ? `\n    lỗi#1: ${a.err}` : '') +
        (b.err ? `\n    lỗi#2: ${b.err}` : '')
    );
    if (cfg.delayMs) await sleep(cfg.delayMs);
  }

  console.log(`\n${allOk ? '✅ Tất cả model PASS — chạy được: npm run eval:models' : '❌ Có model FAIL — sửa trước khi chạy eval:models'}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error('[test:models] ❌', e.message);
  process.exit(1);
});
