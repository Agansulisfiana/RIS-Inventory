export const printHtmlDocument = (title: string, bodyHtml: string) => {
  const docHtml = `<!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-variant-numeric: tabular-nums;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { padding: 24px; }
          .page { width: 100%; max-width: 820px; margin: 0 auto; }
          .doc {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            background: #ffffff;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
          }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
          th {
            background: #f1f5f9;
            color: #1e293b;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1.5px solid #94a3b8;
          }
          td { font-size: 11.5px; line-height: 1.45; }
          .meta {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .brand { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; color: #0f172a; }
          .muted { color: #64748b; font-size: 11px; }
          .total-box { width: 280px; margin-left: auto; margin-top: 12px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11.5px; }
          .total-row strong { font-size: 13.5px; }
          .label-box {
            width: 160px; max-width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; margin: 0 auto; background: #fff;
          }
          .label-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 8px; font-weight: 700; text-transform: uppercase; }
          .label-name { font-size: 12px; font-weight: 900; margin-top: 8px; line-height: 1.3; }
          .barcode {
            display: block; width: 100%; height: 42px; margin: 8px 0 6px; background: repeating-linear-gradient(
              90deg,
              #000 0,
              #000 1px,
              transparent 1px,
              transparent 2px
            );
            border-radius: 4px;
            overflow: hidden;
          }
          .code { text-align: center; font-size: 10px; letter-spacing: 0.14em; font-weight: 700; }
          .note {
            margin-top: 14px;
            font-size: 11px;
            color: #334155;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            .page { width: 100% !important; max-width: none !important; margin: 0 !important; }
            .doc {
              border: 1px solid #94a3b8 !important;
              box-shadow: none !important;
              padding: 14px 18px !important;
              border-radius: 6px !important;
            }
            .label-box { box-shadow: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${bodyHtml}
        </div>
      </body>
    </html>
  `;

  const tryPrintWindow = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700,noopener,noreferrer');

    if (!printWindow) {
      return false;
    }

    printWindow.document.write(docHtml);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    return true;
  };

  if (tryPrintWindow()) {
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.srcdoc = docHtml;

  const printFromIframe = () => {
    try {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.focus();
        iframeWindow.print();
      } else {
        window.print();
      }
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }
  };

  iframe.addEventListener('load', printFromIframe, { once: true });
  document.body.appendChild(iframe);
};
