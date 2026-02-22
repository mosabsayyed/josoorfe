/**
 * Canvas Header Actions — Print, Share, Download
 *
 * Uses native browser print (not html2canvas screenshots).
 * Builds a clean standalone HTML document for print/download.
 */

/**
 * Build a standalone printable HTML document from the canvas content.
 * Extracts the rendered HTML from the DOM element and wraps it with print-ready styles.
 */
const buildPrintableHtml = (element: HTMLElement, title: string): string => {
  // Clone the element content to avoid modifying the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove interactive elements that shouldn't print
  clone.querySelectorAll('button, .no-print, [role="toolbar"]').forEach(el => el.remove());

  const content = clone.innerHTML;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }

    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      background: #fff;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      font-size: 14px;
    }

    h1, h2, h3, h4, h5, h6 {
      color: #111;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }

    h1 { font-size: 24px; border-bottom: 2px solid #d4a017; padding-bottom: 8px; }
    h2 { font-size: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    h3 { font-size: 17px; }

    p { margin: 0.5em 0; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
    }

    tr:nth-child(even) { background: #fafafa; }

    ul, ol { padding-left: 1.5em; }
    li { margin: 0.3em 0; }

    .josoor-chart-container,
    .hydrated-visualization-container,
    .visualization-placeholder,
    .recharts-wrapper,
    .highcharts-container,
    canvas {
      page-break-inside: avoid;
      margin: 1em 0;
    }

    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }

    /* Force light theme for print */
    [style*="background"] { background: transparent !important; }
    [style*="color: var("] { color: #1a1a1a !important; }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
};

/**
 * Print the current artifact using native browser print.
 * Opens a new window with clean printable content.
 */
export const printArtifact = async (artifact?: any) => {
  const element = document.getElementById('canvas-content-area');
  if (!element) {
    window.print();
    return;
  }

  const title = artifact?.title || 'Report';
  const printableHtml = buildPrintableHtml(element, title);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printableHtml);
    printWindow.document.close();

    // Wait for content to render, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      try { printWindow.print(); } catch (_) { /* already printed */ }
    }, 1500);
  }
};

/**
 * Download the current artifact as HTML file.
 * Clean, self-contained HTML that opens in any browser and prints well.
 */
export const downloadArtifact = async (artifact: any) => {
  const element = document.getElementById('canvas-content-area');
  if (!element) {
    // Fallback: save artifact JSON
    saveArtifact(artifact);
    return;
  }

  const title = artifact?.title || 'Report';
  const printableHtml = buildPrintableHtml(element, title);

  const blob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9-_ ]/g, '')}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Share the current artifact
 */
export const shareArtifact = async (artifact: any) => {
  const element = document.getElementById('canvas-content-area');

  // Try native share with HTML file
  if (navigator.share && element) {
    try {
      const title = artifact?.title || 'Report';
      const printableHtml = buildPrintableHtml(element, title);
      const blob = new Blob([printableHtml], { type: 'text/html' });
      const file = new File([blob], `${title}.html`, { type: 'text/html' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: artifact?.description || 'Report',
        });
        return;
      }
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  }

  // Fallback: share URL
  if (navigator.share) {
    try {
      await navigator.share({
        title: artifact?.title || 'Shared Artifact',
        text: artifact?.description || 'Check out this artifact',
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing url:', error);
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
};

/**
 * Save the current artifact as JSON (internal utility)
 */
export const saveArtifact = (artifact: any) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artifact, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${artifact.title || 'artifact'}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
