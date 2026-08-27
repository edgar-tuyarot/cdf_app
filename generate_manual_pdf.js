const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mdPath = path.join(__dirname, 'MANUAL_DE_USUARIO.md');
const htmlPath = path.join(__dirname, 'MANUAL_DE_USUARIO.html');
const pdfPath = path.join(__dirname, 'MANUAL_DE_USUARIO.pdf');

const markdownContent = fs.readFileSync(mdPath, 'utf-8');

// Convert Markdown to rich HTML
function parseMarkdownToHTML(md) {
  let html = md;

  // Code blocks / Mermaid diagrams
  html = html.replace(/```mermaid([\s\S]*?)```/g, (match, content) => {
    let diagramText = content.trim();
    return `<div class="diagram-box"><div class="diagram-title">⚡ Diagrama de Flujo / Proceso</div><pre class="mermaid-code">${diagramText}</pre></div>`;
  });

  // Callouts GitHub style: > [!NOTE], > [!IMPORTANT], > [!CAUTION]
  html = html.replace(/^>\s*\[!NOTE\]\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gm, (match, content) => {
    let cleanText = content.replace(/^>\s?/gm, '').trim();
    return `<div class="callout callout-note"><div class="callout-header">💡 NOTA IMPORTANTE</div><div class="callout-body">${cleanText}</div></div>`;
  });

  html = html.replace(/^>\s*\[!IMPORTANT\]\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gm, (match, content) => {
    let cleanText = content.replace(/^>\s?/gm, '').trim();
    return `<div class="callout callout-important"><div class="callout-header">⭐ INFORMACIÓN CLAVE</div><div class="callout-body">${cleanText}</div></div>`;
  });

  html = html.replace(/^>\s*\[!CAUTION\]\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gm, (match, content) => {
    let cleanText = content.replace(/^>\s?/gm, '').trim();
    return `<div class="callout callout-caution"><div class="callout-header">⚠️ ADVERTENCIA / PRECAUCIÓN</div><div class="callout-body">${cleanText}</div></div>`;
  });

  // Standard blockquotes
  html = html.replace(/^>\s?(.*)$/gm, '<blockquote class="quote">$1</blockquote>');

  // Headings
  html = html.replace(/^# (.*$)/gm, '<h1 class="page-title-break">$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="section-heading">$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3 class="subsection-heading">$1</h3>');

  // Tables
  html = html.replace(/((?:\|[^\n]+\|\n)+)/g, (match) => {
    const lines = match.trim().split('\n').filter(l => !l.match(/\|[\s-:]+\|/));
    if (lines.length === 0) return '';
    let tableHtml = '<div class="table-wrapper"><table class="custom-table">';
    lines.forEach((line, idx) => {
      const cells = line.split('|').filter((c, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
      if (idx === 0) {
        tableHtml += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul class="custom-list">$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="num-item">$1</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<table') || p.startsWith('<ul') || p.startsWith('<hr') || p.startsWith('<blockquote')) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join('\n\n');

  return html;
}

const parsedBody = parseMarkdownToHTML(markdownContent);

const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario Final - CDF Gestión</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 10.5pt;
      padding: 0 10px;
    }

    /* CARÁTULA / COVER PAGE */
    .cover-page {
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, #0b5394 0%, #1e6ec8 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 40px 20px;
      margin-bottom: 30px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }

    .cover-badge {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 25px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
      color: #ffffff;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 18pt;
      font-weight: 400;
      color: #e0f2fe;
      margin-bottom: 40px;
    }

    .cover-meta {
      font-size: 10pt;
      color: #bae6fd;
      border-top: 1px solid rgba(255, 255, 255, 0.25);
      padding-top: 20px;
      width: 80%;
      max-width: 450px;
      margin: 0 auto;
    }

    /* ENCABEZADOS */
    h1.page-title-break {
      font-size: 20pt;
      font-weight: 800;
      color: #0b5394;
      border-bottom: 3px solid #0b5394;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 20px;
      page-break-before: always;
    }

    h1.page-title-break:first-of-type {
      page-break-before: avoid;
    }

    h2.section-heading {
      font-size: 15pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      border-left: 4px solid #1e6ec8;
      padding-left: 10px;
    }

    h3.subsection-heading {
      font-size: 12pt;
      font-weight: 600;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    /* LISTAS */
    ul.custom-list {
      margin-left: 20px;
      margin-bottom: 14px;
    }

    li {
      margin-bottom: 6px;
    }

    /* TABLAS */
    .table-wrapper {
      margin: 18px 0;
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border-radius: 6px;
      overflow: hidden;
    }

    .custom-table th {
      background-color: #0b5394;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }

    .custom-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    .custom-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .custom-table tr:hover {
      background-color: #f1f5f9;
    }

    /* CALLOUT BOXES */
    .callout {
      border-radius: 8px;
      padding: 14px 16px;
      margin: 16px 0;
      font-size: 9.5pt;
    }

    .callout-header {
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .callout-note {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 5px solid #2563eb;
      color: #1e3a8a;
    }

    .callout-note .callout-header { color: #1d4ed8; }

    .callout-important {
      background-color: #fefce8;
      border: 1px solid #fef08a;
      border-left: 5px solid #eab308;
      color: #713f12;
    }

    .callout-important .callout-header { color: #a16207; }

    .callout-caution {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 5px solid #ef4444;
      color: #7f1d1d;
    }

    .callout-caution .callout-header { color: #dc2626; }

    /* DIAGRAMAS / PRE */
    .diagram-box {
      background: #0f172a;
      color: #38bdf8;
      padding: 14px 18px;
      border-radius: 8px;
      margin: 18px 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }

    .diagram-title {
      color: #94a3b8;
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
      border-bottom: 1px solid #334155;
      padding-bottom: 4px;
    }

    .mermaid-code {
      white-space: pre-wrap;
      line-height: 1.4;
    }

    .inline-code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 9pt;
      border: 1px solid #cbd5e1;
    }

    .quote {
      border-left: 3px solid #cbd5e1;
      padding-left: 12px;
      color: #475569;
      font-style: italic;
      margin: 10px 0;
    }

    .footer-page-num {
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 30px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-badge">Manual Operativo</div>
    <div class="cover-title">MANUAL DE USUARIO FINAL</div>
    <div class="cover-subtitle">CDF Gestión — Centro de Distribución y Fraccionamiento</div>
    <div class="cover-meta">
      <p><strong>Versión:</strong> 1.0.0 | <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
      <p>Documentación técnica y operativa oficial para usuarios y administradores.</p>
    </div>
  </div>

  <!-- DOCUMENT BODY -->
  ${parsedBody}

</body>
</html>`;

fs.writeFileSync(htmlPath, fullHTML, 'utf-8');
console.log('HTML generado con éxito:', htmlPath);

// Convert HTML to PDF via Edge Headless
const edgePath = `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`;
const cmd = `${edgePath} --headless --disable-gpu --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlPath}"`;

console.log('Ejecutando conversión a PDF...');
try {
  execSync(cmd);
  console.log('PDF generado exitosamente en:', pdfPath);
} catch (err) {
  console.error('Error al generar PDF:', err.message);
}
