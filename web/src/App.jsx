import { useState } from 'react';
import JSZip from 'jszip';
import * as api from './api.js';
import ChatPanel from './components/ChatPanel.jsx';
import PreviewPanel from './components/PreviewPanel.jsx';
import CodeViewer from './components/CodeViewer.jsx';
import AgentSteps from './components/AgentSteps.jsx';
import BrandPanel from './components/BrandPanel.jsx';
import ComponentPanel from './components/ComponentPanel.jsx';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [steps, setSteps] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tab, setTab] = useState('preview'); // 'preview' | 'code'
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [brandId, setBrandId] = useState('');

  async function handleSend(text) {
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    setError('');
    try {
      // Lần đầu -> generate (kèm brandId nếu chọn); đã có project -> edit.
      const result = files.length
        ? await api.edit({ files, instruction: text })
        : await api.generate({ description: text, brandId: brandId || null });

      setFiles(result.files);
      setSteps(result.agentSteps || []);
      setMeta(result.meta || null);
      setVersion((v) => v + 1);
      setMessages((m) => [...m, { role: 'assistant', content: result.summary || 'Đã cập nhật.' }]);
    } catch (e) {
      setError(e.message);
      setMessages((m) => [...m, { role: 'assistant', content: `Lỗi: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  // Sửa code tay trong tab Code → cập nhật file; PreviewPanel theo dõi `files` nên tự render lại.
  function updateFileContent(path, content) {
    setFiles((fs) => fs.map((f) => (f.path === path ? { ...f, content } : f)));
  }

  async function downloadProject() {
    // Đóng gói toàn bộ file thành .zip mở chạy được ngay (index.html ở gốc).
    const zip = new JSZip();
    for (const f of files) {
      zip.file(f.path.replace(/^\//, ''), f.content); // bỏ "/" đầu để giải nén ra đúng cây thư mục
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webgen-project.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col text-slate-100">
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div>
          <span className="font-semibold tracking-tight">WebGen</span>
          <span className="ml-2 text-xs text-slate-500">Multi-Agent Frontend Assistant · skeleton</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {meta && <span>{meta.model} · {meta.latencyMs}ms</span>}
          <button
            onClick={downloadProject}
            disabled={!files.length}
            className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
          >
            Tải .zip
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[380px_1fr]">
        {/* Trái: chat + agent steps */}
        <aside className="flex flex-col border-r border-slate-800 p-4 min-h-0">
          <div className="mb-3 space-y-2">
            <BrandPanel value={brandId} onChange={setBrandId} />
            <ComponentPanel />
          </div>
          <div className="mb-3">
            <AgentSteps steps={steps} />
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel messages={messages} onSend={handleSend} busy={busy} />
          </div>
        </aside>

        {/* Phải: preview / code */}
        <main className="flex flex-col min-h-0">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 bg-slate-900/40">
            {['preview', 'code'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-sm ${
                  tab === t ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'preview' ? 'Preview' : 'Code'}
              </button>
            ))}
            {error && <span className="ml-auto text-xs text-rose-400">{error}</span>}
          </div>
          <div className="flex-1 min-h-0 bg-white">
            {tab === 'preview' ? (
              <PreviewPanel files={files} version={version} />
            ) : (
              <div className="h-full bg-slate-950">
                <CodeViewer files={files} onChange={updateFileContent} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
