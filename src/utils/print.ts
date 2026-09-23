export const printHtmlDocument = (title: string, bodyHtml: string) => {
  const docHtml = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #fff; color: #111827; font-family: "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif; }
          body { padding: 22px; }
          .page { width: 100%; max-width: 820px; margin: 0 auto; }
          .doc {
            border: 1px solid #dfe3e8; border-radius: 14px; padding: 20px; background: #ffffff;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background: #f8fafc; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
          td { font-size: 12px; }
          .meta { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
          .brand { font-weight: 800; font-size: 17px; letter-spacing: -0.03em; }
          .muted { color: #64748b; }
          .total-box { width: 260px; margin-left: auto; margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
          .total-row strong { font-size: 14px; }
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
          .note { margin-top: 16px; font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
          @media print {
            body { margin: 0; }
            .page { width: 100%; max-width: none; margin: 0; }
            .doc, .label-box { box-shadow: none; }
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

export const printThermalStickerDocument = (
  title: string,
  stickerHtml: string,
  widthMm: string,
  heightMm: string
) => {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: ${widthMm} ${heightMm};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sticker-print-page {
      width: ${widthMm};
      height: ${heightMm};
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
    }
    @media screen {
      body {
        background: #f1f5f9;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .sticker-print-page {
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        background: #ffffff;
      }
    }
  </style>
</head>
<body>
  ${stickerHtml}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=650,height=550,noopener,noreferrer');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 280);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.srcdoc = fullHtml;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };
  document.body.appendChild(iframe);
};
