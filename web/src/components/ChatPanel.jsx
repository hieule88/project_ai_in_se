import { useState } from 'react';

/** Chat đa lượt. onSend(text) do App xử lý (generate lần đầu, edit các lần sau). */
export default function ChatPanel({ messages, onSend, busy }) {
  const [text, setText] = useState('');

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Mô tả website bạn muốn. Ví dụ: <em>"Landing page cho quán cà phê, có menu và nút đặt bàn"</em>.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 ${
              m.role === 'user' ? 'bg-sky-600/20 text-sky-100 ml-6' : 'bg-slate-800 text-slate-200 mr-6'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="text-sm text-sky-400 animate-pulse mr-6">Đang xử lý…</div>}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Nhập mô tả hoặc yêu cầu chỉnh sửa…"
          className="flex-1 resize-none rounded-lg bg-slate-800 text-slate-100 text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-medium"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
