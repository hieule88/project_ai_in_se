const COLORS = {
  done: 'text-emerald-400 border-emerald-500/40',
  skipped: 'text-slate-500 border-slate-700',
  running: 'text-sky-400 border-sky-500/40 animate-pulse',
  error: 'text-rose-400 border-rose-500/40',
};

const LABELS = {
  orchestrator: 'Điều phối',
  design: 'Thiết kế',
  rag: 'RAG',
  code: 'Code',
  review: 'Review',
};

/** Hiển thị agentSteps[] trả về từ backend. Sẵn sàng cho multi-agent. */
export default function AgentSteps({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`px-2.5 py-1 rounded-md border text-xs ${COLORS[s.status] || COLORS.skipped}`}
          title={s.summary}
        >
          <span className="font-semibold">{LABELS[s.agent] || s.agent}</span>
          <span className="opacity-70"> · {s.summary}</span>
        </div>
      ))}
    </div>
  );
}
