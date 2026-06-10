/**
 * Cấu hình Monaco chạy LOCAL/OFFLINE (không tải từ CDN) — phù hợp môi trường dev bị
 * chặn bundler ngoài. Dùng web worker do Vite đóng gói sẵn (?worker).
 * Import file này MỘT LẦN (ở main.jsx) trước khi render editor.
 */
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { loader } from '@monaco-editor/react';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    if (label === 'json') return new jsonWorker();
    return new editorWorker();
  },
};

// Nói @monaco-editor/react dùng bản monaco local thay vì tải qua CDN.
loader.config({ monaco });
