import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

/** Đoán ngôn ngữ Monaco theo đuôi file. */
function langOf(path = '') {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  return 'html';
}

/**
 * Xem & SỬA code bằng Monaco — có sidebar chọn file, tô màu cú pháp.
 * onChange(path, content): nếu được truyền, editor cho sửa và đẩy thay đổi lên App
 * (debounce 400ms để preview không reload giật mỗi phím). Không truyền => chỉ xem.
 */
export default function CodeViewer({ files, onChange }) {
  const [active, setActive] = useState(files?.[0]?.path);
  const timer = useRef(null);

  useEffect(() => {
    if (files?.length && !files.some((f) => f.path === active)) {
      setActive(files[0].path);
    }
  }, [files]); // eslint-disable-line

  function handleChange(value) {
    if (!onChange) return;
    clearTimeout(timer.current);
    const path = current.path;
    timer.current = setTimeout(() => onChange(path, value ?? ''), 400);
  }

  // Ép editor cho sửa ngay khi mount (options.readOnly đôi khi không áp đúng lúc tạo).
  function handleMount(editor) {
    editor.updateOptions({ readOnly: false });
    editor.focus();
  }

  if (!files?.length) {
    return <div className="h-full flex items-center justify-center text-sm text-slate-500">Chưa có code.</div>;
  }

  const current = files.find((f) => f.path === active) || files[0];

  return (
    <div className="h-full flex">
      <ul className="w-44 shrink-0 overflow-auto border-r border-slate-800 text-xs">
        {files.map((f) => (
          <li key={f.path}>
            <button
              onClick={() => setActive(f.path)}
              className={`w-full text-left px-3 py-1.5 font-mono truncate ${
                f.path === current.path ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {f.path}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-1 min-w-0">
        <Editor
          height="100%"
          theme="vs-dark"
          path={current.path}
          language={langOf(current.path)}
          value={current.content}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            readOnly: false, // tab Code cho sửa trực tiếp
            minimap: { enabled: false },
            fontSize: 12,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
          loading={<div className="h-full flex items-center justify-center text-sm text-slate-500">Đang tải editor…</div>}
        />
      </div>
    </div>
  );
}
