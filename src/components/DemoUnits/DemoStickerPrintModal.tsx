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
  Monitor
} from 'lucide-react';
import { InventoryItem, WarehouseSettings } from '../../types';
import { generateQrCodeDataUrl, generateBarcode1DDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';

export type StickerSize = '50x30' | '40x25' | '60x40' | '70x40';
export type StickerBarcodeType = 'qr_code' | 'barcode_1d' | 'combination';
export type TextDensity = 'auto' | 'compact' | 'normal';
export type TargetPrinterType = 'thermal_roll' | 'sheet_a4';

export interface DemoSnEntry {
  id: string;
  sn: string;
  selected: boolean;
}

export interface DemoStickerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  loanInfo?: any;
  settings: WarehouseSettings;
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

  // Target Printer & Layout Options
  const [targetPrinter, setTargetPrinter] = useState<TargetPrinterType>('thermal_roll');
  const [barcodeType, setBarcodeType] = useState<StickerBarcodeType>('qr_code');
  const [stickerSize, setStickerSize] = useState<StickerSize>('50x30');
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
          width: stickerSize === '40x25' ? 1.4 : 1.8,
          height: stickerSize === '40x25' ? 24 : 32,
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
      case '40x25':
        return {
          label: '40 x 25 mm',
          desc: 'Kompak / Mini (Unit kecil / aksesoris)',
          widthMm: '40mm',
          heightMm: '25mm',
          previewWidthPx: 300,
          previewHeightPx: 188,
          qrSizeMm: '9.5mm',
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
        };
      case '50x30':
      default:
        return {
          label: '50 x 30 mm',
          desc: 'Standar Thermal Label Satuan (Paling Populer)',
          widthMm: '50mm',
          heightMm: '30mm',
          previewWidthPx: 340,
          previewHeightPx: 204,
          qrSizeMm: '11.5mm',
        };
    }
  };

  const sizeCfg = getSizeConfig();

  // MICRO-TYPOGRAPHY SIZING (Khusus Label Thermal Presisi Tinggi)
  const getMicroFontSizes = (snText: string) => {
    const isMini = stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';
    const forceCompact = textDensity === 'compact';

    // 1. Header: font kecil tegas (5.2pt - 6.5pt)
    let headerPt = isMini ? 4.8 : isLarge ? 6.5 : 5.4;
    if (headerText.length > 40 || forceCompact) headerPt -= 0.5;

    // 2. Product Name: font bold jelas (7pt - 9pt)
    let namePt = isMini ? 6.8 : isLarge ? 9.0 : 7.8;
    if (productName.length > 30 || forceCompact) namePt -= 0.6;
    if (productName.length > 50) namePt -= 0.8;

    // 3. Serial Number: monospace tegas (6.8pt - 8.2pt)
    let snPt = isMini ? 6.2 : isLarge ? 8.2 : 7.2;
    if (snText.length > 18 || forceCompact) snPt -= 0.6;
    if (snText.length > 25) snPt -= 0.7;

    // 4. SKU & Notes: font rapi (5pt - 6.2pt)
    let smallPt = isMini ? 4.8 : isLarge ? 6.2 : 5.4;
    if (customNotes.length > 40 || forceCompact) smallPt -= 0.5;

    return {
      headerPt: `${Math.max(4.2, headerPt).toFixed(1)}pt`,
      namePt: `${Math.max(5.8, namePt).toFixed(1)}pt`,
      snPt: `${Math.max(5.4, snPt).toFixed(1)}pt`,
      smallPt: `${Math.max(4.5, smallPt).toFixed(1)}pt`,
    };
  };

  /**
   * GENERATOR KONTEN STIKER INDUSTRI (HTML/CSS Presisi)
   * Menggunakan CSS fixed-height rows sehingga 100% konsisten antara preview & hasil print
   */
  const renderStickerInnerHtml = (entry: DemoSnEntry, unitNumber: number) => {
    const snText = entry.sn || '-';
    const fontSizes = getMicroFontSizes(snText);
    const qrUrl = qrCodeMap[entry.id] || '';
    const b1dUrl = barcode1DMap[entry.id] || '';
    const isMini = stickerSize === '40x25';

    return `
      <!-- ROW 1: HEADER BANNER & BADGE -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 0.8px solid #000; padding-bottom: 1px; margin-bottom: 1.5px; gap: 4px; overflow: hidden; line-height: 1.15;">
        <div style="font-size: ${fontSizes.headerPt}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
          ${headerText || 'PROPERTY OF PT REYCOM INTEGRATED SOLUSI'}
        </div>
        ${showBadge ? `
          <div style="font-size: ${fontSizes.headerPt}; font-weight: 900; background: #000; color: #fff; padding: 0.5px 3px; border-radius: 1.5px; white-space: nowrap; letter-spacing: 0.04em;">
            DEMO #${unitNumber}
          </div>
        ` : ''}
      </div>

      <!-- ROW 2: NAMA PRODUK -->
      <div style="margin-bottom: 1.5px; overflow: hidden;">
        <div style="font-size: ${fontSizes.namePt}; font-weight: 900; line-height: 1.15; color: #000; word-break: break-word; overflow-wrap: break-word;">
          ${productName || item.name}
        </div>
      </div>

      <!-- ROW 3: KONTEN UTAMA (BARCODE/QR + DETAIL IDENTITAS) -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 5px; flex: 1; min-height: 0; margin-bottom: 1px;">
        ${barcodeType === 'qr_code' ? `
          <!-- Kolom QR Code -->
          <div style="width: ${sizeCfg.qrSizeMm}; height: ${sizeCfg.qrSizeMm}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="width: 100%; height: 100%; object-fit: contain; display: block;" />` : ''}
          </div>
          <!-- Kolom Info SN & SKU -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.18;">
            <div style="font-family: 'SF Pro Mono', Monaco, Consolas, 'Courier New', monospace; font-size: ${fontSizes.snPt}; font-weight: 900; color: #000; word-break: break-all;">
              SN: <span style="background: #f1f5f9; padding: 0 1px;">${snText}</span>
            </div>
            ${skuCode ? `
              <div style="font-family: 'SF Pro Mono', Monaco, Consolas, 'Courier New', monospace; font-size: ${fontSizes.smallPt}; color: #333; word-break: break-all; margin-top: 1px;">
                SKU: ${skuCode}
              </div>
            ` : ''}
            <div style="font-size: ${fontSizes.smallPt}; font-weight: 700; color: #444; margin-top: 0.5px; text-transform: uppercase;">
              UNIT DEMO / UJI COBA
            </div>
          </div>
        ` : barcodeType === 'barcode_1d' ? `
          <!-- Barcode 1D Vertikal/Horisontal -->
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            ${b1dUrl ? `<img src="${b1dUrl}" alt="1D Barcode" style="width: 96%; max-height: ${isMini ? '20px' : '28px'}; object-fit: contain; display: block;" />` : ''}
            <div style="font-family: 'SF Pro Mono', Monaco, Consolas, monospace; font-size: ${fontSizes.snPt}; font-weight: 900; letter-spacing: 0.06em; margin-top: 1px; word-break: break-all; text-align: center;">
              SN: ${snText}
            </div>
          </div>
        ` : `
          <!-- Kombinasi Barcode 1D + QR -->
          <div style="flex: 1; min-width: 0;">
            ${b1dUrl ? `<img src="${b1dUrl}" alt="1D" style="width: 100%; max-height: ${isMini ? '16px' : '22px'}; object-fit: contain; display: block;" />` : ''}
            <div style="font-family: monospace; font-size: ${fontSizes.smallPt}; font-weight: 800; text-align: center; word-break: break-all;">
              SN: ${snText}
            </div>
          </div>
          <div style="width: ${sizeCfg.qrSizeMm}; height: ${sizeCfg.qrSizeMm}; flex-shrink: 0;">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
          </div>
        `}
      </div>

      <!-- ROW 4: FOOTER NOTE & DATE -->
      <div style="border-top: 0.8px solid #000; padding-top: 1px; display: flex; justify-content: space-between; align-items: center; gap: 4px; overflow: hidden; line-height: 1.15;">
        <div style="font-size: ${fontSizes.smallPt}; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
          ${customNotes || 'TIDAK UNTUK DIPERJUALBELIKAN'}
        </div>
        <div style="font-size: ${fontSizes.smallPt}; font-weight: 800; font-family: monospace; white-space: nowrap; color: #333;">
          ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>
    `;
  };

  // Render Single Sticker Card HTML
  const renderStickerCardHtml = (entry: DemoSnEntry, unitNumber: number) => {
    const isMini = stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';

    return `
      <div class="demo-sticker-card" style="
        width: ${sizeCfg.widthMm};
        height: ${sizeCfg.heightMm};
        box-sizing: border-box;
        padding: ${isMini ? '1.5mm 2mm' : isLarge ? '2.5mm 3mm' : '1.8mm 2.2mm'};
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        ${showBorder ? 'border: 1px solid #000000;' : 'border: 1px dashed #cbd5e1;'}
        position: relative;
        page-break-after: always;
        break-after: page;
      ">
        ${renderStickerInnerHtml(entry, unitNumber)}
      </div>
    `;
  };

  // Trigger Print Browser
  const handlePrintAllStickers = () => {
    if (selectedSnEntries.length === 0) {
      alert('Pilih minimal 1 Serial Number untuk dicetak.');
      return;
    }

    let allHtml = '';
    selectedSnEntries.forEach((entry, idx) => {
      const stickerHtml = renderStickerCardHtml(entry, idx + 1);
      const count = Math.max(1, copiesPerSn);
      for (let c = 0; c < count; c++) {
        allHtml += stickerHtml;
      }
    });

    const isThermal = targetPrinter === 'thermal_roll';

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
              /* FORMAT PRINTER THERMAL ROLL: 1 Stiker = 1 Page Roll */
              @page {
                size: ${sizeCfg.widthMm} ${sizeCfg.heightMm};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .demo-sticker-card {
                width: ${sizeCfg.widthMm} !important;
                height: ${sizeCfg.heightMm} !important;
                margin: 0 !important;
                border: ${showBorder ? '1px solid #000000' : 'none'} !important;
                page-break-after: always !important;
                break-after: page !important;
              }
            ` : `
              /* FORMAT PRINTER A4 STANDAR (KYOCERA / LASER / INKJET) */
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
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        
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
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-purple-600" />
                  <span>Target Jenis Printer:</span>
                </label>
                <span className="text-[10px] font-bold text-purple-700">
                  {targetPrinter === 'thermal_roll' ? 'Zebra, TSC, Xprinter (Roll)' : 'Kyocera, HP, Canon (A4 Sheet)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPrinter('thermal_roll')}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${targetPrinter === 'thermal_roll' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'}`}
                >
                  <div className="text-[11px] font-bold">1. Printer Thermal Label (Roll)</div>
                  <div className={`text-[10px] ${targetPrinter === 'thermal_roll' ? 'text-purple-100' : 'text-slate-500'}`}>
                    1 stiker per lembar roll (50x30mm)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPrinter('sheet_a4')}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${targetPrinter === 'sheet_a4' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'}`}
                >
                  <div className="text-[11px] font-bold">2. Printer Standar (Lembar A4)</div>
                  <div className={`text-[10px] ${targetPrinter === 'sheet_a4' ? 'text-purple-100' : 'text-slate-500'}`}>
                    Grid berjejer di kertas A4 (Kyocera/Laser)
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

            {/* 3. HEADER & NAMA PRODUK */}
            <div className="space-y-3">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Header / Nama Perusahaan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={showBadge}
                      onChange={(e) => setShowBadge(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-purple-600"
                    />
                    <span>Tampilkan Badge DEMO #1</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="PROPERTY OF PT..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                />
              </div>

              {/* Nama Produk & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Nama Barang / Model
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nama printer/perangkat..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    SKU / Kode
                  </label>
                  <input
                    type="text"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    placeholder="SKU-XXXX"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Keterangan Tambahan / Customer Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Catatan Bawah / Footer (Customer & Batas Kembali)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Cust: PT RDS (s/d 24 Sep 2026)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* 4. UKURAN & FORMAT BARCODE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Format Barcode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setBarcodeType('qr_code')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'qr_code' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeType('barcode_1d')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'barcode_1d' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <BarcodeIcon className="w-3.5 h-3.5" />
                    <span>1D Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeType('combination')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'combination' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kombinasi</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Ukuran Label Thermal
                </label>
                <select
                  value={stickerSize}
                  onChange={(e) => setStickerSize(e.target.value as StickerSize)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="50x30">50 x 30 mm (Standar Unit Demo)</option>
                  <option value="40x25">40 x 25 mm (Kompak / Mini)</option>
                  <option value="60x40">60 x 40 mm (Ukuran Sedang / Lega)</option>
                  <option value="70x40">70 x 40 mm (Kardus / Box Luar)</option>
                </select>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{sizeCfg.desc}</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBorder}
                      onChange={(e) => setShowBorder(e.target.checked)}
                      className="w-3 h-3 rounded text-purple-600"
                    />
                    <span>Bingkai</span>
                  </label>
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
                <span className="font-mono font-bold text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md">
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
                          padding: '8px 10px',
                          border: showBorder ? '1.5px solid #000' : '1px dashed #cbd5e1',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                        dangerouslySetInnerHTML={{ __html: renderStickerInnerHtml(entry, idx + 1) }}
                      />
                    </div>
                  ))}
                </div>
              ) : activeSnEntry ? (
                /* SINGLE 1:1 ACCURATE PREVIEW */
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
            Target: <strong className="text-slate-900">{targetPrinter === 'thermal_roll' ? 'Roll Thermal 50x30mm' : 'Kertas Lembar A4 (Kantor)'}</strong> | 
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
