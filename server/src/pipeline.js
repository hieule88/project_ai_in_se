import { qwenChat } from './qwenClient.js';
import { parseProject } from './parser.js';
import { buildGenerateMessages, buildEditMessages, buildCritiqueMessages, buildReviseMessages, BRAND_LOGO_PLACEHOLDER } from './prompts/codegen.js';
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

/** Bóc JSON phê bình của Critic: { acceptable, issues[], suggestions[] }. */
function parseCritique(raw) {
  const m = raw && raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    return {
      acceptable: !!o.acceptable,
      issues: Array.isArray(o.issues) ? o.issues.map(String).slice(0, 8) : [],
      suggestions: Array.isArray(o.suggestions) ? o.suggestions.map(String).slice(0, 8) : [],
    };
  } catch {
    return null;
  }
}

/**
 * REFLECTION (Coder ↔ Critic) — vòng lặp tự cải thiện theo phương pháp Reflection:
 *   sinh → Critic TỰ PHÊ BÌNH (LLM, có cấu trúc) + công cụ kiểm tĩnh → Coder CHỈNH SỬA → lặp lại.
 * Dừng khi Critic CHẤP NHẬN và công cụ sạch lỗi, hoặc hết REVIEW_MAX_ROUNDS (mặc định 2).
 * Công cụ kiểm tĩnh là "sự thật cứng": còn lỗi error thì không bao giờ coi là đạt.
 * Luôn giữ & trả về bản TỐT NHẤT (ít lỗi tĩnh nhất); không bao giờ chặn pipeline.
 *
 * Cấu hình: REVIEW_ENABLED, REVIEW_AUTOFIX, REVIEW_MAX_ROUNDS, REVIEW_USE_LLM_CRITIC (=0 để tắt Critic LLM, rẻ hơn).
 */
async function runReflection({ project, task, language = 'vi', steps, llm = {} }) {
  if (!reviewEnabled()) {
    steps.push({ agent: 'critic', status: 'skipped', summary: 'Review tắt (REVIEW_ENABLED=0)' });
    return project;
  }
  const maxRounds = Math.max(1, Number(process.env.REVIEW_MAX_ROUNDS) || 2);
  const useLlmCritic = process.env.REVIEW_USE_LLM_CRITIC !== '0';
  const autofix = autofixEnabled();

  let best = project;
  let bestErrs = reviewProject(project).errors.length;

  for (let round = 1; round <= maxRounds; round++) {
    const tool = reviewProject(project);

    // --- Critic: tự phê bình có cấu trúc (LLM) dựa trên cả báo cáo công cụ kiểm tĩnh ---
    let critique = { acceptable: tool.ok, issues: tool.errors.map((e) => e.message), suggestions: [] };
    if (useLlmCritic) {
      try {
        const raw = await qwenChat(buildCritiqueMessages({ task, files: project.files, toolReport: tool, language }), llm);
        const parsed = parseCritique(raw);
        // Công cụ tĩnh là sự thật cứng: còn lỗi error thì KHÔNG thể "đạt" dù Critic nói gì.
        if (parsed) critique = { ...parsed, acceptable: parsed.acceptable && tool.ok };
      } catch (e) {
        steps.push({ agent: 'critic', status: 'error', summary: `Vòng ${round}: lỗi gọi Critic LLM (dùng kiểm tĩnh): ${e.message}` });
      }
    }

    const accept = tool.ok && critique.acceptable;
    steps.push({
      agent: 'critic',
      status: accept ? 'done' : 'error',
      summary: accept
        ? `Vòng ${round}: đạt yêu cầu — không còn lỗi đáng kể`
        : `Vòng ${round}: cần cải thiện — ${critique.issues[0] || summarizeIssues(tool.errors) || 'theo phản hồi Critic'}`,
    });

    if (accept) {
      best = project;
      break;
    }
    if (round === maxRounds || !autofix) break;

    // --- Coder: chỉnh sửa theo feedback của Critic ---
    try {
      const revised = parseProject(await qwenChat(buildReviseMessages({ files: project.files, critique, language }), llm));
      const errs = reviewProject(revised).errors.length;
      steps.push({ agent: 'coder', status: 'done', summary: `Vòng ${round}: chỉnh sửa theo phản hồi (còn ${errs} lỗi tĩnh)` });
      project = revised;
      if (errs <= bestErrs) {
        best = revised;
        bestErrs = errs;
      }
    } catch (e) {
      console.warn('[reflection] chỉnh sửa thất bại, giữ bản tốt nhất:', e.message);
      steps.push({ agent: 'coder', status: 'error', summary: `Vòng ${round}: chỉnh sửa thất bại, giữ bản tốt nhất: ${e.message}` });
      break;
    }
  }
  return best;
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
export async function runGenerate({ description, language = 'vi', brandId = null, llm = {} }) {
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
  const raw = await qwenChat(messages, llm);
  let project = parseProject(raw);
  steps.push({ agent: 'code', status: 'done', summary: `Sinh ${project.files.length} file` });

  // 4) Reflection (Coder ↔ Critic) — tự phê bình & chỉnh sửa lặp lại.
  project = await runReflection({ project, task: description, language, steps, llm });

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

  // Reflection cả khi chỉnh sửa — bắt trường hợp sửa làm hỏng HTML.
  project = await runReflection({ project, task: instruction, language, steps });

  return {
    ...project,
    agentSteps: steps,
    meta: { model: process.env.QWEN_MODEL || 'mock', latencyMs: Date.now() - t0 },
  };
}
