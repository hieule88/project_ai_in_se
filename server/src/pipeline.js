import { qwenChat } from './qwenClient.js';
import { parseProject } from './parser.js';
import { buildGenerateMessages, buildEditMessages, buildFixMessages, BRAND_LOGO_PLACEHOLDER } from './prompts/codegen.js';
import { retrieveComponents, ragEnabled } from './rag/retrieve.js';
import { reviewProject, summarizeIssues } from './review.js';
import { getBrand } from './brands.js';
import { DBEE_THEME } from './rag/dbeeTheme.js';

/**
 * Chèn CSS chuẩn DBEE vào CUỐI <head> để mọi class dbee-* có style cố định, đồng nhất
 * giữa các trang (ổn định vibe). Đặt cuối head -> thắng nếu model lỡ viết CSS trùng class.
 */
function applyTheme(project) {
  const block = `<style data-dbee-theme>\n${DBEE_THEME}\n</style>`;
  project.files = project.files.map((f) => {
    if (!/\.html$/i.test(f.path)) return f;
    if (/data-dbee-theme/.test(f.content)) return f; // đã chèn rồi
    const content = /<\/head>/i.test(f.content)
      ? f.content.replace(/<\/head>/i, `${block}\n</head>`)
      : `${block}\n${f.content}`;
    return { ...f, content };
  });
  return project;
}

function reviewEnabled() {
  return process.env.REVIEW_ENABLED !== '0';
}
function autofixEnabled() {
  return process.env.REVIEW_AUTOFIX !== '0';
}

/**
 * Thay placeholder logo bằng ảnh THẬT (data URI / URL) sau khi sinh.
 * Tránh bắt model chép lại chuỗi base64 dài (vừa hỏng logo vừa cắt cụt output).
 */
function inlineBrandLogo(project, brand) {
  const logo = brand?.logo;
  if (!logo || !/^(data:|https?:)/i.test(logo)) return project; // logo emoji/text thì giữ nguyên
  project.files = project.files.map((f) => ({
    ...f,
    content: f.content.split(BRAND_LOGO_PLACEHOLDER).join(logo),
  }));
  return project;
}

/**
 * Khi EDIT: tạm thay mọi data URI dài (logo/ảnh nhúng) trong file hiện tại bằng token
 * ngắn để KHÔNG gửi base64 khổng lồ cho model; khôi phục lại sau khi model trả về.
 */
function stashDataUris(files) {
  const map = [];
  const out = files.map((f) => ({
    ...f,
    content: f.content.replace(/(src\s*=\s*["'])(data:[^"']{100,})(["'])/gi, (_m, p, uri, q) => {
      const token = `__ASSET_${map.length}__`;
      map.push(uri);
      return p + token + q;
    }),
  }));
  return { files: out, map };
}
function restoreDataUris(files, map) {
  if (!map.length) return files;
  return files.map((f) => {
    let content = f.content;
    map.forEach((uri, i) => {
      content = content.split(`__ASSET_${i}__`).join(uri);
    });
    return { ...f, content };
  });
}

/**
 * Review Agent: soát HTML, nếu có lỗi thì gọi model sửa 1 vòng (nếu bật autofix).
 * Luôn TRẢ VỀ project (đã sửa nếu sửa được) và PUSH 1 agentStep 'review' vào `steps`.
 * Không bao giờ chặn pipeline — lỗi gọi model khi sửa cũng chỉ ghi chú rồi giữ bản gốc.
 */
async function runReview(project, language, steps) {
  if (!reviewEnabled()) {
    steps.push({ agent: 'review', status: 'skipped', summary: 'Review tắt (REVIEW_ENABLED=0)' });
    return project;
  }

  const review = reviewProject(project);
  if (review.ok) {
    const note = review.warnings.length ? ` (${review.warnings.length} cảnh báo)` : '';
    steps.push({ agent: 'review', status: 'done', summary: `HTML hợp lệ${note}` });
    return project;
  }

  // Có lỗi.
  if (!autofixEnabled()) {
    steps.push({ agent: 'review', status: 'error', summary: `Phát hiện lỗi (không tự sửa): ${summarizeIssues(review.errors)}` });
    return project;
  }

  // Gọi model sửa 1 vòng.
  try {
    const fixMessages = buildFixMessages({ files: project.files, issues: review.errors, language });
    const fixed = parseProject(await qwenChat(fixMessages));
    const after = reviewProject(fixed);
    if (after.ok) {
      steps.push({ agent: 'review', status: 'done', summary: `Phát hiện ${review.errors.length} lỗi → đã sửa 1 vòng, HTML hợp lệ` });
      return fixed;
    }
    // Sửa rồi vẫn còn lỗi → vẫn dùng bản đã sửa (thường tốt hơn bản gốc), ghi chú lại.
    steps.push({ agent: 'review', status: 'error', summary: `Đã sửa 1 vòng nhưng còn: ${summarizeIssues(after.errors)}` });
    return fixed;
  } catch (err) {
    console.warn('[review] sửa lỗi thất bại, giữ bản gốc:', err.message);
    steps.push({ agent: 'review', status: 'error', summary: `Lỗi khi sửa (giữ bản gốc): ${err.message}` });
    return project;
  }
}

/**
 * PIPELINE — sở hữu chung bởi P2 (controller) + P3 (agent behavior).
 *
 * Day 0-1: chỉ có Code Agent. Các agent khác là STUB để thấy chỗ cắm vào.
 * Lộ trình multi-agent (tuần 1-2):
 *   Orchestrator -> Design Agent -> RAG Agent (P4) -> Code Agent -> Review Agent
 *
 * Mọi agent đều TRẢ VỀ kèm 1 phần tử agentSteps để frontend hiển thị tiến trình.
 */
export async function runGenerate({ description, language = 'vi', brandId = null }) {
  const t0 = Date.now();
  const steps = [];

  // 0) Resolve brand (nếu có brandId) — dùng cho cả prompt lẫn ưu tiên truy xuất.
  const brand = getBrand(brandId);

  // 1) Orchestrator (stub) — sau này: lập kế hoạch, phân rã section.
  steps.push({
    agent: 'orchestrator',
    status: 'done',
    summary: brand ? `Đã nhận yêu cầu · brand "${brand.name}"` : 'Đã nhận & phân rã yêu cầu (stub)',
  });

  // 2) RAG Agent — truy xuất component liên quan, tự được nhồi vào prompt Code Agent.
  let retrievedComponents = [];
  if (!ragEnabled()) {
    steps.push({ agent: 'rag', status: 'skipped', summary: 'RAG tắt (RAG_ENABLED=0)' });
  } else {
    try {
      retrievedComponents = await retrieveComponents({ description, brandId });
      steps.push({
        agent: 'rag',
        status: 'done',
        summary: retrievedComponents.length
          ? `Truy xuất ${retrievedComponents.length} component: ${retrievedComponents.map((c) => c.id).join(', ')}`
          : 'Không tìm thấy component phù hợp',
      });
    } catch (err) {
      // Không chặn pipeline: vẫn sinh được code dù RAG lỗi (giữ nhánh luôn chạy được).
      console.warn('[rag] lỗi truy xuất, bỏ qua:', err.message);
      steps.push({ agent: 'rag', status: 'error', summary: `Lỗi RAG (bỏ qua): ${err.message}` });
    }
  }

  // 3) Code Agent — thật.
  const messages = buildGenerateMessages({ description, language, retrievedComponents, brand });
  const raw = await qwenChat(messages);
  let project = parseProject(raw);
  steps.push({ agent: 'code', status: 'done', summary: `Sinh ${project.files.length} file` });

  // 4) Review Agent — soát HTML, tự sửa 1 vòng nếu có lỗi.
  project = await runReview(project, language, steps);

  // 5) Chèn logo brand thật vào (thay placeholder) — sau review để fix không xoá mất.
  project = inlineBrandLogo(project, brand);

  // 6) Chèn CSS chuẩn DBEE (khi có dùng RAG) → đồng nhất vibe giữa các trang.
  if (retrievedComponents.length) project = applyTheme(project);

  return {
    ...project,
    agentSteps: steps,
    meta: { model: process.env.QWEN_MODEL || 'mock', latencyMs: Date.now() - t0 },
  };
}

export async function runEdit({ files, instruction, language = 'vi' }) {
  const t0 = Date.now();
  const steps = [];
  // Tạm gỡ data URI dài (logo…) trước khi gửi model, khôi phục sau khi nhận về.
  const { files: stashed, map } = stashDataUris(files);
  const messages = buildEditMessages({ files: stashed, instruction, language });
  const raw = await qwenChat(messages);
  let project = parseProject(raw);
  project.files = restoreDataUris(project.files, map);
  steps.push({ agent: 'code', status: 'done', summary: `Cập nhật ${project.files.length} file` });

  // Review cả khi chỉnh sửa — bắt trường hợp sửa làm hỏng HTML.
  project = await runReview(project, language, steps);

  return {
    ...project,
    agentSteps: steps,
    meta: { model: process.env.QWEN_MODEL || 'mock', latencyMs: Date.now() - t0 },
  };
}
