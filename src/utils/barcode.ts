import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export const generateQrCodeDataUrl = async (
  value: string,
  options?: { width?: number; margin?: number }
): Promise<string> => {
  const safeValue = (value || '').trim() || 'RIS-INVENTORY';

  try {
    return await QRCode.toDataURL(safeValue, {
      errorCorrectionLevel: 'M',
      margin: options?.margin ?? 1,
      width: options?.width ?? 220,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });
  } catch {
    return '';
  }
};

export const generateBarcode1DDataUrl = (
  value: string,
  options?: { width?: number; height?: number; displayValue?: boolean }
): string => {
  const safeValue = (value || '').trim() || '00000000';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, safeValue, {
      format: 'CODE128',
      width: options?.width ?? 2,
      height: options?.height ?? 46,
      displayValue: options?.displayValue ?? true,
      fontSize: 12,
      font: 'monospace',
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000'
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate 1D barcode:', err);
    return '';
  }
};
