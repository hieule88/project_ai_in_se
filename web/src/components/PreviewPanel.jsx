import { useMemo } from 'react';

/**
 * Preview LOCAL bằng iframe srcDoc — KHÔNG cần internet, không cần bundler ngoài.
 * Lắp các file thành 1 trang HTML tự chứa rồi nhồi vào iframe.
 */
export default function PreviewPanel({ files, version }) {
  const srcDoc = useMemo(() => buildHtml(files), [files, version]);

  if (!files?.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-500">
        Preview sẽ hiện ở đây sau khi sinh website.
      </div>
    );
  }

  return (
    <iframe
      title="preview"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-forms allow-popups allow-modals"
      style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
    />
  );
}

/** Gộp files thành 1 HTML hoàn chỉnh: dùng /index.html, inline css/js nếu bị tách file. */
function buildHtml(files) {
  if (!files?.length) return '';
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content]));
  let html = byPath['/index.html'] || files[0].content;

  // Nếu index.html link tới file css/js riêng -> nhúng thẳng vào (iframe không tự tải được).
  html = html.replace(
    /<link[^>]*href=["']\.?\/?([^"']+\.css)["'][^>]*>/gi,
    (m, p) => {
      const css = byPath['/' + p] ?? byPath[p];
      return css ? `<style>\n${css}\n</style>` : m;
    }
  );
  html = html.replace(
    /<script[^>]*src=["']\.?\/?([^"']+\.js)["'][^>]*><\/script>/gi,
    (m, p) => {
      const js = byPath['/' + p] ?? byPath[p];
      return js ? `<script>\n${js}\n</script>` : m;
    }
  );
  return html;
}
