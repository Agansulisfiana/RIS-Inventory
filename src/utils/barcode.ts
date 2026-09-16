import QRCode from 'qrcode';

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
