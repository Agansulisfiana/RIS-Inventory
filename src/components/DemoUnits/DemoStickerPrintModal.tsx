import React, { useEffect, useState, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Tag, 
  QrCode, 
  Barcode as BarcodeIcon, 
  RotateCcw, 
  Building2, 
  Sparkles, 
  Sliders, 
  Check, 
  Plus, 
  Trash2, 
  Layers, 
  ChevronRight, 
  Eye, 
  FileText, 
  Monitor,
  MinusCircle,
  Edit3
} from 'lucide-react';
import { InventoryItem, WarehouseSettings } from '../../types';
import { generateQrCodeDataUrl, generateBarcode1DDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';

export type StickerSize = '50x30' | '40x20' | '40x25' | '60x40' | '70x40';
export type StickerBarcodeType = 'qr_code' | 'barcode_1d' | 'combination';
export type TextDensity = 'auto' | 'compact' | 'normal';
export type TargetPrinterType = 'thermal_roll' | 'sheet_a4';

export interface DemoSnEntry {
  id: string;
  sn: string;
  selected: boolean;
  isCustom?: boolean;
}

export interface DemoStickerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  loanInfo?: any;
  settings: WarehouseSettings;
  allItems?: InventoryItem[];
}

/**
 * Smart Serial Number Tokenizer:
 * Mampu memisahkan nomor seri yang dipisahkan oleh:
 * - Koma (,)
 * - Titik (.) seperti "SN-185961. SN-12312"
 * - Titik koma (;)
 * - Baris baru (\n)
 * - Garis miring (/) atau pipa (|)
 * - Kata sambung "dan" / "&"
 */
export const parseSmartSerialNumbers = (rawInput: any): string[] => {
  if (!rawInput) return [];
  if (Array.isArray(rawInput)) {
    return rawInput.flatMap(item => parseSmartSerialNumbers(item));
  }
  const str = String(rawInput).trim();
  if (!str) return [];

  // Pisahkan dengan regex cerdas
  const tokens = str
    .split(/[\r\n,;|/]+|(?<=[A-Za-z0-9])\s*\.\s*(?=[A-Za-z0-9])|\s{2,}|\s+(?:dan|and|&)\s+/i)
    .map(s => s.trim().replace(/^[.\s-]+|[.\s-]+$/g, ''))
    .filter(Boolean);

  // Jika token masih menggabungkan pola SN terpisah (misal "SN-12345 SN-67890")
  const result: string[] = [];
  for (const token of tokens) {
    const subMatches = token.match(/(?:SN\s*[:#-]?\s*[\w-]+|[\w-]{4,})/gi);
    if (subMatches && subMatches.length > 1 && token.includes(' ')) {
      result.push(...subMatches.map(m => m.trim()));
    } else {
      result.push(token);
    }
  }

  return result.length > 0 ? result : [str];
};

export const DemoStickerPrintModal: React.FC<DemoStickerPrintModalProps> = ({
  isOpen,
  onClose,
  item,
  loanInfo,
  settings
}) => {
  const activeLoan = loanInfo || item?.demoLoanInfo;

  // Custom Editable Fields
  const [headerText, setHeaderText] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [skuCode, setSkuCode] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showBadge, setShowBadge] = useState<boolean>(true);
  
  // Multi-SN Management State
  const [snEntries, setSnEntries] = useState<DemoSnEntry[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [copiesPerSn, setCopiesPerSn] = useState<number>(1);
  const [previewAllMode, setPreviewAllMode] = useState<boolean>(false);

  // Target Printer & Layout Options - Default: Thermal Roll Ukuran 80mm & Ukuran 40x20 2-Line
  const [targetPrinter, setTargetPrinter] = useState<TargetPrinterType>('thermal_roll');
  const [barcodeType, setBarcodeType] = useState<StickerBarcodeType>('qr_code');
  const [stickerSize, setStickerSize] = useState<StickerSize>('40x20');
  const [textDensity, setTextDensity] = useState<TextDensity>('auto');
  const [showBorder, setShowBorder] = useState<boolean>(true);

  // Generated Visual Code Data URLs (Map of ID -> QR / Barcode)
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [barcode1DMap, setBarcode1DMap] = useState<Record<string, string>>({});

  // Helper defaults
  const computeDefaults = () => {
    const company = settings?.companyName || 'PT REYCOM INTEGRATED SOLUSI';
    const defaultHeader = `PROPERTY OF ${company.toUpperCase()}`;
    const defaultName = item?.name || activeLoan?.productName || 'Demo Unit Printer';
    const defaultSku = item?.sku || activeLoan?.productCode || '';

    let defaultNote = '';
    const cust = activeLoan?.customerName || activeLoan?.companyName || '';
    const expDateStr = activeLoan?.expectedReturnDate 
      ? new Date(activeLoan.expectedReturnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    
    if (cust && expDateStr) {
      defaultNote = `Cust: ${cust} (s/d ${expDateStr})`;
    } else if (cust) {
      defaultNote = `Cust: ${cust}`;
    } else if (expDateStr) {
      defaultNote = `Batas Kembali: ${expDateStr}`;
    }

    return {
      header: defaultHeader,
      name: defaultName,
      sku: defaultSku,
      notes: defaultNote
    };
  };

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen && item) {
      const defs = computeDefaults();
      setHeaderText(defs.header);
      setProductName(defs.name);
      setSkuCode(defs.sku);
      setCustomNotes(defs.notes);

      // Smart SN Extraction: prioritaskan array SN atau serialNumber string
      let rawSns: string[] = [];
      if (Array.isArray(activeLoan?.serialNumbers) && activeLoan.serialNumbers.length > 0) {
        rawSns = parseSmartSerialNumbers(activeLoan.serialNumbers);
      } else if (activeLoan?.serialNumber) {
        rawSns = parseSmartSerialNumbers(activeLoan.serialNumber);
      } else if (item.serialNumber) {
        rawSns = parseSmartSerialNumbers(item.serialNumber);
      }

      if (rawSns.length === 0) {
        rawSns = [''];
      }

      const initialEntries: DemoSnEntry[] = rawSns.map((sn, idx) => ({
        id: `sn-${Date.now()}-${idx}`,
        sn,
        selected: true
      }));

      setSnEntries(initialEntries);
      setActivePreviewIndex(0);
      setCopiesPerSn(1);
    }
  }, [isOpen, item]);

  // Selected SNs
  const selectedSnEntries = useMemo(() => {
    return snEntries.filter(e => e.selected);
  }, [snEntries]);

  // Active SN for preview
  const activeSnEntry = useMemo(() => {
    if (selectedSnEntries.length === 0) return null;
    return selectedSnEntries[activePreviewIndex] || selectedSnEntries[0] || null;
  }, [selectedSnEntries, activePreviewIndex]);

  // Generate barcodes
  useEffect(() => {
    if (!isOpen || snEntries.length === 0) return;

    let isMounted = true;
    const newQrMap: Record<string, string> = {};
    const newB1dMap: Record<string, string> = {};

    const generateAll = async () => {
      for (const entry of snEntries) {
        const valToEncode = (entry.sn || skuCode || productName || 'DEMO-UNIT').trim();
        
        // 1D Barcode
        newB1dMap[entry.id] = generateBarcode1DDataUrl(valToEncode, {
          width: (stickerSize === '40x20' || stickerSize === '40x25') ? 1.3 : 1.8,
          height: (stickerSize === '40x20' || stickerSize === '40x25') ? 18 : 32,
          displayValue: false
        });

        // QR Code
        try {
          const qrUrl = await generateQrCodeDataUrl(valToEncode, { width: 240, margin: 1 });
          newQrMap[entry.id] = qrUrl;
        } catch {
          newQrMap[entry.id] = '';
        }
      }

      if (isMounted) {
        setBarcode1DMap(newB1dMap);
        setQrCodeMap(newQrMap);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [snEntries, skuCode, productName, isOpen, stickerSize]);

  if (!isOpen || !item) return null;

  // SN Handlers
  const handleAddSnRow = () => {
    const newId = `sn-${Date.now()}-${snEntries.length}`;
    setSnEntries(prev => [...prev, { id: newId, sn: '', selected: true }]);
    setActivePreviewIndex(snEntries.length);
  };

  const handleUpdateSn = (id: string, newSn: string) => {
    setSnEntries(prev => prev.map(e => e.id === id ? { ...e, sn: newSn } : e));
  };

  const handleToggleSn = (id: string) => {
    setSnEntries(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  };

  const handleDeleteSnRow = (id: string) => {
    if (snEntries.length <= 1) return;
    setSnEntries(prev => prev.filter(e => e.id !== id));
    setActivePreviewIndex(0);
  };

  const handleSelectAllSn = () => {
    const allSelected = snEntries.every(e => e.selected);
    setSnEntries(prev => prev.map(e => ({ ...e, selected: !allSelected })));
  };

  // Dimensions Preset
  const getSizeConfig = () => {
    switch (stickerSize) {
      case '40x20':
      case '40x25':
        return {
          label: '40 x 20 mm (2 Line)',
          desc: 'Roll 80mm: 2 Kolom Sejajar (Twin Line)',
          widthMm: '40mm',
          heightMm: '20mm',
          previewWidthPx: 270,
          previewHeightPx: 135,
          qrSizeMm: '7.5mm',
          isTwoLine: true,
        };
      case '60x40':
        return {
          label: '60 x 40 mm',
          desc: 'Format Sedang (Lebih lega & jelas)',
          widthMm: '60mm',
          heightMm: '40mm',
          previewWidthPx: 380,
          previewHeightPx: 253,
          qrSizeMm: '14mm',
          isTwoLine: false,
        };
      case '70x40':
        return {
          label: '70 x 40 mm',
          desc: 'Format Ekstra / Box Karton Pengiriman',
          widthMm: '70mm',
          heightMm: '40mm',
          previewWidthPx: 420,
          previewHeightPx: 240,
          qrSizeMm: '14.5mm',
          isTwoLine: false,
        };
      case '50x30':
      default:
        return {
          label: '50 x 30 mm',
          desc: 'Standar Thermal Label Satuan Roll 80mm',
          widthMm: '50mm',
          heightMm: '30mm',
          previewWidthPx: 340,
          previewHeightPx: 204,
          qrSizeMm: '11.5mm',
          isTwoLine: false,
        };
    }
  };

  const sizeCfg = getSizeConfig();

  // MICRO-TYPOGRAPHY SIZING (Khusus Label Thermal Presisi Tinggi)
  const getMicroFontSizes = (snText: string, isTwoLine: boolean = false) => {
    const isMini = stickerSize === '40x20' || stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';
    const forceCompact = textDensity === 'compact' || isTwoLine || isMini;

    // 1. Header: font kecil tegas (4.5pt - 6.5pt)
    let headerPt = isMini ? 4.5 : isLarge ? 6.5 : 5.4;
    if (headerText.length > 35 || forceCompact) headerPt -= 0.4;

    // 2. Product Name: font bold jelas (5.8pt - 9pt)
    let namePt = isMini ? 6.0 : isLarge ? 9.0 : 7.8;
    if (productName.length > 25 || forceCompact) namePt -= 0.5;
    if (productName.length > 40) namePt -= 0.5;

    // 3. Serial Number: monospace tegas (5.6pt - 8.2pt)
    let snPt = isMini ? 5.8 : isLarge ? 8.2 : 7.2;
    if (snText.length > 16 || forceCompact) snPt -= 0.5;
    if (snText.length > 22) snPt -= 0.5;

    // 4. SKU & Notes: font rapi (4.4pt - 6.2pt)
    let smallPt = isMini ? 4.4 : isLarge ? 6.2 : 5.4;
    if (customNotes.length > 35 || forceCompact) smallPt -= 0.4;

    return {
      headerPt: `${Math.max(4.0, headerPt).toFixed(1)}pt`,
      namePt: `${Math.max(5.2, namePt).toFixed(1)}pt`,
      snPt: `${Math.max(5.0, snPt).toFixed(1)}pt`,
      smallPt: `${Math.max(4.0, smallPt).toFixed(1)}pt`,
    };
  };

  /**
   * GENERATOR KONTEN STIKER INDUSTRI (HTML/CSS Presisi)
   * Menggunakan CSS fixed-height rows sehingga 100% konsisten antara preview & hasil print
   */
  const renderStickerInnerHtml = (entry: DemoSnEntry, unitNumber: number, isTwoLine: boolean = false) => {
    const snText = entry.sn || '-';
    const isMini = stickerSize === '40x20' || stickerSize === '40x25';
    const fontSizes = getMicroFontSizes(snText, isTwoLine);
    const qrUrl = qrCodeMap[entry.id] || '';
    const b1dUrl = barcode1DMap[entry.id] || '';

    return `
      <!-- ROW 1: HEADER BANNER & BADGE -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 0.6px solid #000; padding-bottom: 0.5px; margin-bottom: 1px; gap: 3px; overflow: hidden; line-height: 1.1;">
        <div style="font-size: ${fontSizes.headerPt}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
          ${headerText || 'PROPERTY OF PT REYCOM INTEGRATED SOLUSI'}
        </div>
        ${showBadge ? `
          <div style="font-size: ${fontSizes.headerPt}; font-weight: 900; background: #000; color: #fff; padding: 0.5px 2px; border-radius: 1px; white-space: nowrap; letter-spacing: 0.02em;">
            #${unitNumber}
          </div>
        ` : ''}
      </div>

      <!-- ROW 2: NAMA PRODUK -->
      <div style="margin-bottom: 1px; overflow: hidden; line-height: 1.1;">
        <div style="font-size: ${fontSizes.namePt}; font-weight: 900; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${productName || item.name}
        </div>
      </div>

      <!-- ROW 3: KONTEN UTAMA (BARCODE/QR + DETAIL IDENTITAS) -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 3px; flex: 1; min-height: 0; margin-bottom: 1px; overflow: hidden;">
        ${barcodeType === 'qr_code' ? `
          <!-- Kolom QR Code -->
          <div style="width: ${isMini ? '7.5mm' : sizeCfg.qrSizeMm}; height: ${isMini ? '7.5mm' : sizeCfg.qrSizeMm}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="width: 100%; height: 100%; object-fit: contain; display: block;" />` : ''}
          </div>
          <!-- Kolom Info SN & SKU -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.15;">
            <div style="font-family: 'SF Pro Mono', Monaco, Consolas, 'Courier New', monospace; font-size: ${fontSizes.snPt}; font-weight: 900; color: #000; word-break: break-all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              SN: <span style="background: #f1f5f9; padding: 0 1px;">${snText}</span>
            </div>
            ${skuCode ? `
              <div style="font-family: 'SF Pro Mono', Monaco, Consolas, 'Courier New', monospace; font-size: ${fontSizes.smallPt}; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 0.5px;">
                SKU: ${skuCode}
              </div>
            ` : ''}
            <div style="font-size: ${fontSizes.smallPt}; font-weight: 700; color: #555; text-transform: uppercase; margin-top: 0.5px;">
              DEMO UNIT
            </div>
          </div>
        ` : barcodeType === 'barcode_1d' ? `
          <!-- Barcode 1D Vertikal/Horisontal -->
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            ${b1dUrl ? `<img src="${b1dUrl}" alt="1D Barcode" style="width: 98%; max-height: ${isMini ? '15px' : '28px'}; object-fit: contain; display: block;" />` : ''}
            <div style="font-family: 'SF Pro Mono', Monaco, Consolas, monospace; font-size: ${fontSizes.snPt}; font-weight: 900; letter-spacing: 0.04em; margin-top: 0.5px; word-break: break-all; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
              SN: ${snText}
            </div>
          </div>
        ` : `
          <!-- Kombinasi Barcode 1D + QR -->
          <div style="flex: 1; min-width: 0;">
            ${b1dUrl ? `<img src="${b1dUrl}" alt="1D" style="width: 100%; max-height: ${isMini ? '13px' : '22px'}; object-fit: contain; display: block;" />` : ''}
            <div style="font-family: monospace; font-size: ${fontSizes.smallPt}; font-weight: 800; text-align: center; word-break: break-all; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              SN: ${snText}
            </div>
          </div>
          <div style="width: ${isMini ? '7mm' : sizeCfg.qrSizeMm}; height: ${isMini ? '7mm' : sizeCfg.qrSizeMm}; flex-shrink: 0;">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
          </div>
        `}
      </div>

      <!-- ROW 4: FOOTER NOTE & DATE -->
      <div style="border-top: 0.6px solid #000; padding-top: 0.5px; display: flex; justify-content: space-between; align-items: center; gap: 3px; overflow: hidden; line-height: 1.1;">
        <div style="font-size: ${fontSizes.smallPt}; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
          ${customNotes || 'TIDAK DIPERJUALBELIKAN'}
        </div>
        <div style="font-size: ${fontSizes.smallPt}; font-weight: 800; font-family: monospace; white-space: nowrap; color: #333;">
          ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>
    `;
  };

  // Render Single Sticker Card HTML
  const renderStickerCardHtml = (entry: DemoSnEntry, unitNumber: number, isTwoLine: boolean = false) => {
    const isMini = stickerSize === '40x20' || stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';
    const cardWidth = isTwoLine ? '38.5mm' : sizeCfg.widthMm;
    const cardHeight = isTwoLine ? '19.5mm' : sizeCfg.heightMm;

    return `
      <div class="demo-sticker-card" style="
        width: ${cardWidth};
        height: ${cardHeight};
        box-sizing: border-box;
        padding: ${isMini ? '1mm 1.4mm' : isLarge ? '2.5mm 3mm' : '1.8mm 2.2mm'};
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        ${showBorder ? 'border: 0.8px solid #000000;' : 'border: 0.8px dashed #cbd5e1;'}
        position: relative;
        ${isTwoLine ? 'page-break-after: avoid; break-after: avoid;' : 'page-break-after: always; break-after: page;'}
      ">
        ${renderStickerInnerHtml(entry, unitNumber, isTwoLine)}
      </div>
    `;
  };

  // Trigger Print Browser
  const handlePrintAllStickers = () => {
    if (selectedSnEntries.length === 0) {
      alert('Pilih minimal 1 Serial Number untuk dicetak.');
      return;
    }

    const itemsToPrint: Array<{ entry: DemoSnEntry; unitNumber: number }> = [];
    selectedSnEntries.forEach((entry, idx) => {
      const count = Math.max(1, copiesPerSn);
      for (let c = 0; c < count; c++) {
        itemsToPrint.push({ entry, unitNumber: idx + 1 });
      }
    });

    const isThermal = targetPrinter === 'thermal_roll';
    const isTwoLine = (stickerSize === '40x20' || stickerSize === '40x25') && isThermal;

    let allHtml = '';

    if (isThermal && isTwoLine) {
      // PRINTER THERMAL ROLL UKURAN 80mm - DUA LINE (2 Stiker Berdampingan per Baris Roll)
      for (let i = 0; i < itemsToPrint.length; i += 2) {
        const item1 = itemsToPrint[i];
        const item2 = itemsToPrint[i + 1];
        const sticker1Html = renderStickerCardHtml(item1.entry, item1.unitNumber, true);
        const sticker2Html = item2
          ? renderStickerCardHtml(item2.entry, item2.unitNumber, true)
          : '<div style="width: 38.5mm; height: 19.5mm; visibility: hidden;"></div>';

        allHtml += `
          <div class="thermal-row-80mm" style="
            width: 80mm;
            height: 20mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
            padding: 0 1mm;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          ">
            ${sticker1Html}
            ${sticker2Html}
          </div>
        `;
      }
    } else if (isThermal) {
      // PRINTER THERMAL ROLL UKURAN 80mm - SATU LINE (Centered di Roll 80mm)
      for (let i = 0; i < itemsToPrint.length; i++) {
        const item = itemsToPrint[i];
        const stickerHtml = renderStickerCardHtml(item.entry, item.unitNumber, false);
        allHtml += `
          <div class="thermal-row-80mm" style="
            width: 80mm;
            height: ${sizeCfg.heightMm};
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          ">
            ${stickerHtml}
          </div>
        `;
      }
    } else {
      // FORMAT PRINTER A4 STANDAR
      itemsToPrint.forEach(item => {
        allHtml += renderStickerCardHtml(item.entry, item.unitNumber, false);
      });
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Stiker Unit Demo (${selectedSnEntries.length} SN)</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            ${isThermal ? `
              /* FORMAT PRINTER THERMAL ROLL UKURAN 80MM */
              @page {
                size: 80mm ${sizeCfg.heightMm};
                margin: 0;
              }
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
              .thermal-row-80mm {
                margin: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .demo-sticker-card {
                margin: 0 !important;
              }
            ` : `
              /* FORMAT PRINTER A4 STANDAR */
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                padding: 10mm;
                display: flex;
                flex-wrap: wrap;
                align-content: flex-start;
                gap: 5mm;
              }
              .demo-sticker-card {
                width: ${sizeCfg.widthMm} !important;
                height: ${sizeCfg.heightMm} !important;
                border: 1px solid #000000 !important;
                box-shadow: none !important;
                page-break-after: auto !important;
                break-after: auto !important;
              }
            `}

            @media screen {
              body {
                background: #f1f5f9;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
              }
              .thermal-row-80mm {
                background: #fff;
                border: 1px dashed #94a3b8 !important;
                margin-bottom: 10px !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
              .demo-sticker-card {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                background: #fff;
              }
            }
          </style>
        </head>
        <body>
          ${allHtml}
        </body>
      </html>
    `;

    printHtmlDocument(`Stiker Demo - ${selectedSnEntries.length} Unit`, fullHtml);
  };

  const totalStickerCount = selectedSnEntries.length * copiesPerSn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-heading text-slate-900">
                  CETAK STIKER UNIT DEMO (MULTI-SN)
                </h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200 uppercase tracking-wide">
                  Presisi Thermal 1:1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Setiap stiker mencetak satu Serial Number unik secara berurutan tanpa bertumpuk atau terpotong.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container (Scrollable) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
          
          {/* LEFT COLUMN: Controls, Multi-SN Table, Custom Fields (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. SELEKSI TARGET PRINTER */}
            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-purple-600" />
                  <span>Target Jenis Printer:</span>
                </label>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-md">
                  {targetPrinter === 'thermal_roll' ? 'Printer Thermal Roll (Ukuran 80)' : 'Format Lembar Kertas A4'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPrinter('thermal_roll')}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    targetPrinter === 'thermal_roll' 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-600/30' 
                      : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold">1. Printer Thermal Label (Roll 80)</div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      targetPrinter === 'thermal_roll' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                    }`}>
                      Ukuran 80
                    </span>
                  </div>
                  <div className={`text-[11px] font-medium ${targetPrinter === 'thermal_roll' ? 'text-purple-100' : 'text-slate-500'}`}>
                    Lebar Roll 80mm
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPrinter('sheet_a4')}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    targetPrinter === 'sheet_a4' 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-600/30' 
                      : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold">2. Printer Standar (Lembar A4)</div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      targetPrinter === 'sheet_a4' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Kertas A4
                    </span>
                  </div>
                  <div className={`text-[11px] font-medium ${targetPrinter === 'sheet_a4' ? 'text-purple-100' : 'text-slate-500'}`}>
                    Grid berjejer rapi di kertas HVS / Stiker A4
                  </div>
                </button>
              </div>
            </div>

            {/* 2. DAFTAR SERIAL NUMBER (MULTI-SN SELECTOR) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {selectedSnEntries.length}
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-900 block">
                      Daftar Unit & Serial Number (SN)
                    </label>
                    <p className="text-[10px] text-slate-500">
                      {selectedSnEntries.length} dari {snEntries.length} unit dipilih untuk dicetak
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllSn}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {snEntries.every(e => e.selected) ? 'Batalkan Semua' : `Pilih Semua (${snEntries.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSnRow}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah SN</span>
                  </button>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {snEntries.map((entry, index) => {
                  const isSelectedInList = entry.selected;
                  const isCurrentPreview = activeSnEntry?.id === entry.id;

                  return (
                    <div 
                      key={entry.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${isCurrentPreview ? 'ring-2 ring-purple-500 bg-white border-purple-400' : isSelectedInList ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}
                    >
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => handleToggleSn(entry.id)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        title="Centang untuk menyertakan SN ini dalam cetakan"
                      />

                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 whitespace-nowrap">
                        Unit #{index + 1}
                      </span>

                      <input
                        type="text"
                        value={entry.sn}
                        onChange={(e) => handleUpdateSn(entry.id, e.target.value)}
                        placeholder={`Nomor Seri Unit #${index + 1}`}
                        className="flex-1 px-2 py-1 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const idxInSelected = selectedSnEntries.findIndex(e => e.id === entry.id);
                          if (idxInSelected !== -1) {
                            setActivePreviewIndex(idxInSelected);
                          } else {
                            handleToggleSn(entry.id);
                            setActivePreviewIndex(selectedSnEntries.length);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${isCurrentPreview ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                        title="Lihat tampilan stiker untuk nomor seri ini"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      {snEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSnRow(entry.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Hapus unit ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Salinan & Total */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs">Salinan per Unit:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCopiesPerSn(1)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${copiesPerSn === 1 ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      1x (Hanya Unit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopiesPerSn(2)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${copiesPerSn === 2 ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      2x (Unit + Kardus)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-black text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  Total Cetak: {totalStickerCount} Lembar
                </div>
              </div>
            </div>

            {/* 3. DETAIL KONTEN & IDENTITAS STIKER */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Detail Informasi Stiker</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={showBadge}
                    onChange={(e) => setShowBadge(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Tampilkan Badge DEMO #1</span>
                </label>
              </div>

              {/* Header Nama Perusahaan */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Header / Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="PROPERTY OF PT..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              {/* Nama Produk & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Nama Barang / Model
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nama printer/perangkat..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    SKU / Kode
                  </label>
                  <input
                    type="text"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    placeholder="SKU-XXXX"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Catatan Bawah */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Catatan Bawah / Footer (Customer &amp; Batas Kembali)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Cust: PT RDS (s/d 24 Sep 2026)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>

            {/* 4. UKURAN & FORMAT BARCODE */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>Pengaturan Barcode &amp; Ukuran Label</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Format Barcode
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setBarcodeType('qr_code')}
                      className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'qr_code' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarcodeType('barcode_1d')}
                      className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'barcode_1d' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <BarcodeIcon className="w-3.5 h-3.5" />
                      <span>1D Barcode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarcodeType('combination')}
                      className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'combination' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kombinasi</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Ukuran Label Thermal
                  </label>
                  <select
                    value={stickerSize}
                    onChange={(e) => setStickerSize(e.target.value as StickerSize)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                  >
                    <option value="40x20">40 x 20 mm (2 Line / Roll 80mm)</option>
                    <option value="50x30">50 x 30 mm (Standar Satuan Roll 80mm)</option>
                    <option value="60x40">60 x 40 mm (Ukuran Sedang / Lega)</option>
                    <option value="70x40">70 x 40 mm (Kardus / Box Luar)</option>
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="truncate pr-1">{sizeCfg.desc}</span>
                    <label className="flex items-center gap-1 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={showBorder}
                        onChange={(e) => setShowBorder(e.target.checked)}
                        className="w-3 h-3 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Bingkai</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: 1:1 TRUE WYSIWYG PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center bg-slate-100/90 p-4 rounded-2xl border border-slate-200">
            
            {/* Preview Toolbar */}
            <div className="w-full flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Monitor className="w-4 h-4 text-purple-600" />
                <span>Pratinjau Nyata 1:1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewAllMode(!previewAllMode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${previewAllMode ? 'bg-purple-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{previewAllMode ? 'Mode Tunggal' : `Lihat Semua (${selectedSnEntries.length})`}</span>
                </button>
                <span className="font-mono font-bold text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                  {sizeCfg.label}
                </span>
              </div>
            </div>

            {/* Individual SN Switcher */}
            {!previewAllMode && selectedSnEntries.length > 1 && (
              <div className="w-full flex items-center gap-1 overflow-x-auto pb-1.5 mb-2">
                {selectedSnEntries.map((entry, idx) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 transition-colors cursor-pointer ${activePreviewIndex === idx ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    Unit #{idx + 1}: {entry.sn || 'Tanpa SN'}
                  </button>
                ))}
              </div>
            )}

            {/* PREVIEW CONTAINER */}
            <div className="w-full flex-1 flex flex-col items-center justify-center p-3 bg-slate-200/50 rounded-xl border border-dashed border-slate-300 overflow-y-auto max-h-[380px] min-h-[240px]">
              
              {selectedSnEntries.length === 0 ? (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">Tidak ada nomor seri yang dipilih</p>
                  <p className="text-[11px] mt-1">Centang minimal 1 unit di sebelah kiri.</p>
                </div>
              ) : previewAllMode ? (
                sizeCfg.isTwoLine && targetPrinter === 'thermal_roll' ? (
                  /* 2-LINE ROLL 80MM PREVIEW (ALL) */
                  <div className="space-y-3 w-full flex flex-col items-center">
                    {Array.from({ length: Math.ceil(selectedSnEntries.length / 2) }).map((_, rowIdx) => {
                      const entry1 = selectedSnEntries[rowIdx * 2];
                      const entry2 = selectedSnEntries[rowIdx * 2 + 1];
                      return (
                        <div key={rowIdx} className="flex flex-col items-center w-full">
                          <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                            <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono">
                              Baris Roll #{rowIdx + 1} (2 Line Sejajar)
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-md border-2 border-dashed border-purple-400 shadow-xs flex items-center justify-between gap-2 max-w-full overflow-x-auto">
                            <div
                              style={{
                                width: '180px',
                                height: '90px',
                                padding: '4px 6px',
                                border: showBorder ? '1px solid #000' : '1px dashed #cbd5e1',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxSizing: 'border-box'
                              }}
                              dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(entry1, rowIdx * 2 + 1, true) }}
                            />
                            {entry2 ? (
                              <div
                                style={{
                                  width: '180px',
                                  height: '90px',
                                  padding: '4px 6px',
                                  border: showBorder ? '1px solid #000' : '1px dashed #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  boxSizing: 'border-box'
                                }}
                                dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(entry2, rowIdx * 2 + 2, true) }}
                              />
                            ) : (
                              <div 
                                style={{ width: '180px', height: '90px' }} 
                                className="border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 italic"
                              >
                                (Kosong)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    {selectedSnEntries.map((entry, idx) => (
                      <div key={entry.id} className="flex flex-col items-center">
                        <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono">Stiker #{idx + 1}</span>
                          <span>SN: {entry.sn || '-'}</span>
                        </div>
                        <div 
                          style={{
                            width: `${sizeCfg.previewWidthPx}px`,
                            height: `${sizeCfg.previewHeightPx}px`,
                            padding: '6px 8px',
                            border: showBorder ? '1.5px solid #000' : '1px dashed #cbd5e1',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(entry, idx + 1, false) }}
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : activeSnEntry ? (
                /* SINGLE PREVIEW */
                sizeCfg.isTwoLine && targetPrinter === 'thermal_roll' ? (
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full mb-2">
                      Simulasi 2 Baris Sejajar pada Roll 80mm
                    </div>
                    <div className="bg-white p-2 rounded-lg border-2 border-dashed border-purple-400 shadow-sm flex items-center justify-center gap-2">
                      <div
                        style={{
                          width: '185px',
                          height: '92px',
                          padding: '4px 6px',
                          border: showBorder ? '1px solid #000' : '1px dashed #cbd5e1',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                        dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(activeSnEntry, activePreviewIndex + 1, true) }}
                      />
                      <div
                        style={{
                          width: '185px',
                          height: '92px',
                          padding: '4px 6px',
                          border: showBorder ? '1px solid #000' : '1px dashed #cbd5e1',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: renderStickerInnerHtml(
                            selectedSnEntries[activePreviewIndex + 1] || activeSnEntry, 
                            selectedSnEntries[activePreviewIndex + 1] ? activePreviewIndex + 2 : activePreviewIndex + 1, 
                            true
                          ) 
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Ukuran 40x20mm (2 Line Sejajar) pas untuk Roll Thermal 80mm</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div 
                      style={{
                        width: `${sizeCfg.previewWidthPx}px`,
                        height: `${sizeCfg.previewHeightPx}px`,
                        padding: '8px 10px',
                        border: showBorder ? '1.5px solid #000' : '1px dashed #cbd5e1',
                        boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.15)',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(activeSnEntry, activePreviewIndex + 1) }}
                    />
                    <div className="text-[10px] text-slate-500 font-medium mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Format proporsi fisik 1:1 sesuai cetakan printer</span>
                    </div>
                  </div>
                )
              ) : null}

            </div>

            {/* Mode Info Notice */}
            <div className="w-full mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-[10px] text-emerald-800">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>Mode Multi-SN Aktif:</strong> {selectedSnEntries.length} stiker akan dicetak terpisah dengan nomor seri masing-masing secara berurutan.
              </span>
            </div>

          </div>

        </div>

        {/* Modal Footer Bottom Action */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="text-xs text-slate-600">
            Target: <strong className="text-slate-900">{targetPrinter === 'thermal_roll' ? `Roll Thermal 80mm (${sizeCfg.label})` : 'Kertas Lembar A4'}</strong> | 
            Total: <strong className="text-purple-700">{totalStickerCount} Stiker</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintAllStickers}
              disabled={selectedSnEntries.length === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {totalStickerCount > 1 ? `${totalStickerCount}x ` : ''}Stiker Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
