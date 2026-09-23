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
  Eye
} from 'lucide-react';
import { InventoryItem, WarehouseSettings } from '../../types';
import { generateQrCodeDataUrl, generateBarcode1DDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';

export type StickerSize = '50x30' | '40x25' | '60x40' | '70x40';
export type StickerBarcodeType = 'qr_code' | 'barcode_1d' | 'combination';
export type TextDensity = 'auto' | 'compact' | 'normal';

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

export const DemoStickerPrintModal: React.FC<DemoStickerPrintModalProps> = ({
  isOpen,
  onClose,
  item,
  loanInfo,
  settings
}) => {
  // Determine loan info from props or item
  const activeLoan = loanInfo || item?.demoLoanInfo;

  // Custom Editable Fields
  const [headerText, setHeaderText] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [skuCode, setSkuCode] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  
  // Multi-SN Management State
  const [snEntries, setSnEntries] = useState<DemoSnEntry[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [copiesPerSn, setCopiesPerSn] = useState<number>(1);
  const [previewAllMode, setPreviewAllMode] = useState<boolean>(false);

  // Format & Layout Options
  const [barcodeType, setBarcodeType] = useState<StickerBarcodeType>('qr_code');
  const [stickerSize, setStickerSize] = useState<StickerSize>('50x30');
  const [textDensity, setTextDensity] = useState<TextDensity>('auto');
  const [showBorder, setShowBorder] = useState<boolean>(true);

  // Generated Visual Code Data URLs (Map of SN -> QR / Barcode)
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [barcode1DMap, setBarcode1DMap] = useState<Record<string, string>>({});

  // Helper to compute initial defaults
  const computeDefaults = () => {
    const company = settings?.companyName || 'PT REYCOM INTEGRATED SOLUSI';
    const defaultHeader = `PROPERTY OF ${company.toUpperCase()} - DEMO UNIT`;
    const defaultName = item?.name || activeLoan?.productName || 'Demo Unit Printer';
    const defaultSku = item?.sku || activeLoan?.productCode || '';

    // Customer and return date note
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

  // Populate form and parse multi-SNs when modal opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      const defs = computeDefaults();
      setHeaderText(defs.header);
      setProductName(defs.name);
      setSkuCode(defs.sku);
      setCustomNotes(defs.notes);

      // Parse all available serial numbers
      let rawSns: string[] = [];
      if (Array.isArray(activeLoan?.serialNumbers) && activeLoan.serialNumbers.length > 0) {
        rawSns = activeLoan.serialNumbers.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (activeLoan?.serialNumber) {
        rawSns = String(activeLoan.serialNumber).split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      } else if (item.serialNumber) {
        rawSns = String(item.serialNumber).split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
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

  // Selected SN entries to print
  const selectedSnEntries = useMemo(() => {
    return snEntries.filter(e => e.selected);
  }, [snEntries]);

  // Active SN for single live preview
  const activeSnEntry = useMemo(() => {
    if (selectedSnEntries.length === 0) return null;
    return selectedSnEntries[activePreviewIndex] || selectedSnEntries[0] || null;
  }, [selectedSnEntries, activePreviewIndex]);

  // Generate barcodes for all SNs
  useEffect(() => {
    if (!isOpen || snEntries.length === 0) return;

    let isMounted = true;
    const newQrMap: Record<string, string> = {};
    const newB1dMap: Record<string, string> = {};

    const generateAll = async () => {
      for (const entry of snEntries) {
        const valToEncode = (entry.sn || skuCode || productName || 'DEMO-UNIT').trim();
        
        // 1D Barcode (synchronous)
        newB1dMap[entry.id] = generateBarcode1DDataUrl(valToEncode, {
          width: stickerSize === '40x25' ? 1.5 : 2,
          height: stickerSize === '40x25' ? 30 : 44,
          displayValue: false
        });

        // QR Code (async)
        try {
          const qrUrl = await generateQrCodeDataUrl(valToEncode, { width: 260, margin: 1 });
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

  // SN management handlers
  const handleAddSnRow = () => {
    const newId = `sn-${Date.now()}-${snEntries.length}`;
    setSnEntries(prev => [...prev, { id: newId, sn: '', selected: true }]);
    setActivePreviewIndex(snEntries.length);
  };

  const handleUpdateSn = (id: string, newSn: string) => {
    setSnEntries(prev => prev.map(e => e.id === id ? { ...e, sn: newSn } : e));
  };

  const handleToggleSn = (id: string) => {
    setSnEntries(prev => {
      const next = prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e);
      return next;
    });
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

  // Size preset configurations
  const getSizeConfig = () => {
    switch (stickerSize) {
      case '40x25':
        return {
          label: '40 x 25 mm',
          desc: 'Kompak / Mini (Unit kecil / aksesoris)',
          widthMm: '40mm',
          heightMm: '25mm',
          previewWidth: 'w-[280px]',
          previewMinHeight: 'min-h-[175px]',
        };
      case '60x40':
        return {
          label: '60 x 40 mm',
          desc: 'Format Sedang (Lebih lega & jelas)',
          widthMm: '60mm',
          heightMm: '40mm',
          previewWidth: 'w-[360px]',
          previewMinHeight: 'min-h-[240px]',
        };
      case '70x40':
        return {
          label: '70 x 40 mm',
          desc: 'Format Ekstra / Box Karton Pengiriman',
          widthMm: '70mm',
          heightMm: '40mm',
          previewWidth: 'w-[390px]',
          previewMinHeight: 'min-h-[225px]',
        };
      case '50x30':
      default:
        return {
          label: '50 x 30 mm',
          desc: 'Standar Thermal Label Satuan (Paling Populer)',
          widthMm: '50mm',
          heightMm: '30mm',
          previewWidth: 'w-[325px]',
          previewMinHeight: 'min-h-[195px]',
        };
    }
  };

  const sizeCfg = getSizeConfig();

  // DYNAMIC FONT SIZING PER STIKER (Guarantee NO text cut-off)
  const getCalculatedFontSizes = (snText: string) => {
    const isMini = stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';
    const forceCompact = textDensity === 'compact';

    // 1. Header font size
    const headerLen = headerText.length;
    let headerPt = isMini ? 5.8 : isLarge ? 7.5 : 6.8;
    if (headerLen > 45 || forceCompact) headerPt -= 0.8;
    if (headerLen > 65) headerPt -= 0.6;

    // 2. Product Name font size (Dynamic wrap without truncation)
    const nameLen = productName.length;
    let namePt = isMini ? 7.2 : isLarge ? 9.5 : 8.2;
    if (nameLen > 40 || forceCompact) namePt -= 0.8;
    if (nameLen > 65) namePt -= 0.9;
    if (nameLen > 90) namePt -= 0.8;

    // 3. Serial Number font size
    const snLen = snText.length;
    let snPt = isMini ? 6.5 : isLarge ? 8.2 : 7.2;
    if (snLen > 22 || forceCompact) snPt -= 0.8;
    if (snLen > 30) snPt -= 0.8;

    // 4. Notes font size
    const notesLen = customNotes.length;
    let notesPt = isMini ? 5.8 : isLarge ? 7.2 : 6.5;
    if (notesLen > 45 || forceCompact) notesPt -= 0.7;
    if (notesLen > 70) notesPt -= 0.6;

    return {
      headerPt: `${Math.max(4.8, headerPt).toFixed(1)}pt`,
      namePt: `${Math.max(5.5, namePt).toFixed(1)}pt`,
      snPt: `${Math.max(5.2, snPt).toFixed(1)}pt`,
      notesPt: `${Math.max(4.8, notesPt).toFixed(1)}pt`
    };
  };

  // Render a single printable sticker HTML for a given SN entry
  const renderStickerHtml = (entry: DemoSnEntry, unitNumber: number) => {
    const isMini = stickerSize === '40x25';
    const isLarge = stickerSize === '60x40' || stickerSize === '70x40';
    const snText = entry.sn || '-';
    const fontSizes = getCalculatedFontSizes(snText);
    const qrUrl = qrCodeMap[entry.id] || '';
    const b1dUrl = barcode1DMap[entry.id] || '';

    return `
      <div class="demo-sticker-card" style="
        width: ${sizeCfg.widthMm};
        height: ${sizeCfg.heightMm};
        box-sizing: border-box;
        padding: ${isMini ? '1.8mm 2mm' : isLarge ? '3mm 3.5mm' : '2.2mm 2.5mm'};
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        ${showBorder ? 'border: 1px solid #000000;' : ''}
        position: relative;
      ">
        <!-- 1. HEADER BANNER: PROPERTY OF & DEMO UNIT BADGE -->
        <div style="border-bottom: 1.2px solid #000; padding-bottom: 1.5px; margin-bottom: 1px; display: flex; align-items: center; justify-content: space-between; gap: 4px;">
          <div style="font-size: ${fontSizes.headerPt}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; line-height: 1.15; word-break: break-word; overflow-wrap: break-word; flex: 1;">
            ${headerText || 'PROPERTY OF PT REYCOM INTEGRATED SOLUSI - DEMO UNIT'}
          </div>
          <div style="font-size: ${fontSizes.headerPt}; font-weight: 900; background: #000; color: #fff; padding: 1px 3px; border-radius: 2px; white-space: nowrap; letter-spacing: 0.05em;">
            DEMO #${unitNumber}
          </div>
        </div>

        <!-- 2. PRODUCT NAME (Multi-line Wrap, Dynamic Font, NO CUT-OFF) -->
        <div style="margin: 1px 0;">
          <div style="font-size: ${fontSizes.namePt}; font-weight: 900; line-height: 1.18; color: #000; word-break: break-word; overflow-wrap: break-word;">
            ${productName || item.name}
          </div>
        </div>

        <!-- 3. VISUAL CODE & SERIAL NUMBER -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 1px 0; min-height: 0;">
          ${barcodeType === 'qr_code' ? `
            <div style="display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0;">
              ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="height: ${isMini ? '32px' : isLarge ? '56px' : '44px'}; width: auto; object-fit: contain; display: block; shrink: 0;" />` : ''}
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-family: monospace; font-size: ${fontSizes.snPt}; font-weight: 900; line-height: 1.15; word-break: break-all;">
                  SN: ${snText}
                </div>
                ${skuCode ? `
                  <div style="font-family: monospace; font-size: ${fontSizes.notesPt}; color: #333; line-height: 1.15; word-break: break-all; margin-top: 1px;">
                    SKU: ${skuCode}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : barcodeType === 'barcode_1d' ? `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
              ${b1dUrl ? `<img src="${b1dUrl}" alt="Barcode 1D" style="width: 100%; max-height: ${isMini ? '26px' : isLarge ? '48px' : '36px'}; object-fit: contain; display: block;" />` : ''}
              <div style="font-family: monospace; font-size: ${fontSizes.snPt}; font-weight: 900; letter-spacing: 0.08em; line-height: 1.1; margin-top: 1px; word-break: break-all;">
                ${snText}
              </div>
            </div>
          ` : `
            <!-- Combination 1D + QR -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; width: 100%;">
              <div style="flex: 1; min-width: 0;">
                ${b1dUrl ? `<img src="${b1dUrl}" alt="Barcode" style="width: 100%; max-height: ${isMini ? '20px' : isLarge ? '38px' : '28px'}; object-fit: contain; display: block;" />` : ''}
                <div style="font-family: monospace; font-size: ${fontSizes.notesPt}; font-weight: 800; text-align: center; word-break: break-all;">
                  SN: ${snText}
                </div>
              </div>
              ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="height: ${isMini ? '26px' : isLarge ? '44px' : '34px'}; width: auto; object-fit: contain;" />` : ''}
            </div>
          `}
        </div>

        <!-- 4. CUSTOM NOTES / FOOTER -->
        <div style="border-top: 1px solid #000; padding-top: 1px; margin-top: 1px; display: flex; justify-content: space-between; align-items: flex-end; gap: 4px;">
          <div style="font-size: ${fontSizes.notesPt}; font-weight: 700; line-height: 1.15; color: #000; word-break: break-word; overflow-wrap: break-word; flex: 1;">
            ${customNotes || 'UNIT UJI COBA (TIDAK UNTUK DIPERJUALBELIKAN)'}
          </div>
          <div style="font-size: ${fontSizes.notesPt}; font-weight: 800; font-family: monospace; white-space: nowrap; color: #444;">
            ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
          </div>
        </div>
      </div>
    `;
  };

  // Trigger browser print for all selected SNs
  const handlePrintAllStickers = () => {
    if (selectedSnEntries.length === 0) {
      alert('Pilih minimal 1 Serial Number untuk dicetak.');
      return;
    }

    let allHtml = '';
    selectedSnEntries.forEach((entry, idx) => {
      const stickerHtml = renderStickerHtml(entry, idx + 1);
      const count = Math.max(1, copiesPerSn);
      for (let c = 0; c < count; c++) {
        allHtml += stickerHtml;
      }
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Stiker Unit Demo (${selectedSnEntries.length} SN)</title>
          <style>
            @page {
              size: ${sizeCfg.widthMm} ${sizeCfg.heightMm};
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .demo-sticker-card {
              border: ${showBorder ? '1px solid #000000' : 'none'} !important;
              margin: 0 !important;
            }
            @media screen {
              body {
                background: #f1f5f9;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .demo-sticker-card {
                border: 1px solid #000000 !important;
                margin-bottom: 12px !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-heading text-slate-900">
                  KONFIGURASI STIKER UNIT DEMO (MULTI-SN)
                </h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200 uppercase tracking-wide">
                  Batch Thermal Label Generator
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pilih atau masukkan nomor seri untuk setiap unit demo. Setiap unit akan otomatis dicetak dengan barcode & nomor serinya masing-masing.
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

        {/* Modal Body: 2 Columns */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* LEFT COLUMN: Controls, Text Customization & Multi-SN Table (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. SECTION DAFTAR SERIAL NUMBER (MULTI-UNIT SELECTION) */}
            <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {selectedSnEntries.length}
                  </div>
                  <div>
                    <label className="text-xs font-black text-purple-950 block">
                      Daftar Unit & Serial Number (SN)
                    </label>
                    <p className="text-[10px] text-purple-700">
                      {selectedSnEntries.length} dari {snEntries.length} unit dipilih untuk dicetak
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllSn}
                    className="px-2 py-1 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {snEntries.every(e => e.selected) ? 'Batalkan Semua' : `Pilih Semua (${snEntries.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSnRow}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah SN</span>
                  </button>
                </div>
              </div>

              {/* List of SN Rows */}
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {snEntries.map((entry, index) => {
                  const isSelectedInList = entry.selected;
                  const isCurrentPreview = activeSnEntry?.id === entry.id;

                  return (
                    <div 
                      key={entry.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCurrentPreview ? 'ring-2 ring-purple-500 bg-white border-purple-400' : isSelectedInList ? 'bg-white border-purple-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => handleToggleSn(entry.id)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        title="Centang untuk menyertakan SN ini dalam cetakan"
                      />

                      {/* Unit Badge */}
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-purple-100 text-purple-900 rounded border border-purple-200 whitespace-nowrap">
                        Unit #{index + 1}
                      </span>

                      {/* Input SN (Bisa diedit) */}
                      <input
                        type="text"
                        value={entry.sn}
                        onChange={(e) => handleUpdateSn(entry.id, e.target.value)}
                        placeholder={`Ketik Nomor Seri Unit #${index + 1}`}
                        className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />

                      {/* Preview Button */}
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

                      {/* Delete Button (if > 1) */}
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

              {/* Setting Salinan per Unit & Total Cetak */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-950 text-xs">Salinan per Unit:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCopiesPerSn(1)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${copiesPerSn === 1 ? 'bg-purple-600 text-white' : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'}`}
                    >
                      1x (Hanya Unit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopiesPerSn(2)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${copiesPerSn === 2 ? 'bg-purple-600 text-white' : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'}`}
                    >
                      2x (Unit + Kardus)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-black text-purple-900 bg-white border border-purple-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Total: {totalStickerCount} Lembar Stiker
                </div>
              </div>
            </div>

            {/* 2. Header / Label Kepemilikan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Header / Label Kepemilikan (Bisa Diedit)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const defs = computeDefaults();
                    setHeaderText(defs.header);
                  }}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="PROPERTY OF PT... - DEMO UNIT"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
              />
              {/* Quick Header Templates */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setHeaderText(`PROPERTY OF ${settings?.companyName || 'PT REYCOM INTEGRATED SOLUSI'} - DEMO UNIT`)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                >
                  Demo Default
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderText('UNIT TRIAL / POC - TIDAK UNTUK DIJUAL')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                >
                  Trial / POC
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderText('EXHIBITION & DEMO SAMPLE UNIT')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                >
                  Pameran / Expo
                </button>
              </div>
            </div>

            {/* 3. Nama Barang / Model & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Nama Barang / Model (Bisa Disingkat)
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                    Auto-Wrap Aktif
                  </span>
                </div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ketik nama printer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Kode SKU
                </label>
                <input
                  type="text"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  placeholder="Kode SKU"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* 4. Keterangan Tambahan / Customer Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Keterangan Tambahan (Customer / Sales / Due Date)
                </label>
                {activeLoan?.customerName && (
                  <button
                    type="button"
                    onClick={() => {
                      const cust = activeLoan.customerName;
                      const exp = activeLoan.expectedReturnDate ? new Date(activeLoan.expectedReturnDate).toLocaleDateString('id-ID') : '';
                      setCustomNotes(`Cust: ${cust}${exp ? ` (Batas: ${exp})` : ''}`);
                    }}
                    className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                  >
                    + Info Customer Demo
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Contoh: Cust: PT RDS (Batas: 24 Sep 2026) / Hubungi Sales: 0812-xxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-2xs"
              />
            </div>

            {/* 5. Barcode Format & Sticker Size Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Format Barcode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Format Barcode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setBarcodeType('qr_code')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'qr_code' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeType('barcode_1d')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'barcode_1d' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <BarcodeIcon className="w-4 h-4" />
                    <span>1D Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeType('combination')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${barcodeType === 'combination' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kombinasi</span>
                  </button>
                </div>
              </div>

              {/* Ukuran Kertas Stiker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Ukuran Label Thermal
                </label>
                <select
                  value={stickerSize}
                  onChange={(e) => setStickerSize(e.target.value as StickerSize)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="50x30">50 x 30 mm (Standar Unit Demo)</option>
                  <option value="40x25">40 x 25 mm (Kompak / Mini)</option>
                  <option value="60x40">60 x 40 mm (Ukuran Sedang / Lega)</option>
                  <option value="70x40">70 x 40 mm (Kardus / Box Luar)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  {sizeCfg.desc}
                </p>
              </div>

            </div>

            {/* Density & Border Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-700">Skala Huruf:</span>
                <div className="flex items-center gap-1">
                  {(['auto', 'compact', 'normal'] as TextDensity[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTextDensity(mode)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${textDensity === mode ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {mode === 'auto' ? 'Otomatis' : mode === 'compact' ? 'Rapat' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBorder}
                  onChange={(e) => setShowBorder(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="font-bold text-slate-700 text-[11px]">Garis Bingkai Label</span>
              </label>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Physical Thermal Sticker Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-100/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
            
            {/* Top Bar Preview & Switcher */}
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Pratinjau Fisik Stiker:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewAllMode(!previewAllMode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${previewAllMode ? 'bg-purple-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  title="Lihat semua stiker yang akan dicetak"
                >
                  <Layers className="w-3 h-3" />
                  <span>{previewAllMode ? 'Mode Tunggal' : `Lihat Semua (${selectedSnEntries.length})`}</span>
                </button>
                <span className="font-mono font-bold text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md">
                  {sizeCfg.label}
                </span>
              </div>
            </div>

            {/* If more than 1 SN selected, show tab navigation for individual preview */}
            {!previewAllMode && selectedSnEntries.length > 1 && (
              <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
                <span className="text-[10px] text-slate-500 font-bold shrink-0">Pilih Pratinjau:</span>
                {selectedSnEntries.map((entry, idx) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 transition-colors cursor-pointer ${activePreviewIndex === idx ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    Unit #{idx + 1} ({entry.sn || 'SN Kosong'})
                  </button>
                ))}
              </div>
            )}

            {/* THE ACTUAL THERMAL STICKER PREVIEW CONTAINER */}
            <div className="w-full flex flex-col items-center justify-center p-3 bg-slate-200/60 rounded-xl border border-dashed border-slate-300 overflow-y-auto max-h-[360px] min-h-[260px] space-y-4">
              
              {selectedSnEntries.length === 0 ? (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">Tidak ada nomor seri yang dipilih</p>
                  <p className="text-[11px] mt-1">Centang minimal 1 unit di kolom kiri untuk melihat pratinjau stiker.</p>
                </div>
              ) : previewAllMode ? (
                /* Multi-Sticker Column Preview */
                selectedSnEntries.map((entry, idx) => {
                  const snText = entry.sn || '-';
                  const fontSizes = getCalculatedFontSizes(snText);
                  const qrUrl = qrCodeMap[entry.id] || '';
                  const b1dUrl = barcode1DMap[entry.id] || '';

                  return (
                    <div key={entry.id} className="flex flex-col items-center w-full">
                      <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <span className="bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-mono">Stiker #{idx + 1}</span>
                        <span>Unit {idx + 1}: {snText}</span>
                      </div>
                      <div 
                        className={`${sizeCfg.previewWidth} ${sizeCfg.previewMinHeight} bg-white text-black p-3 rounded-sm shadow-md flex flex-col justify-between transition-all duration-150 relative select-none`}
                        style={{
                          border: showBorder ? '1.5px solid #000' : '1px dashed #cbd5e1',
                        }}
                      >
                        {/* Header */}
                        <div className="border-b border-black pb-1 mb-1 flex items-center justify-between gap-1">
                          <div className="font-black uppercase tracking-tight leading-tight flex-1 break-words" style={{ fontSize: fontSizes.headerPt }}>
                            {headerText || 'PROPERTY OF PT REYCOM INTEGRATED SOLUSI - DEMO UNIT'}
                          </div>
                          <div className="font-black bg-black text-white px-1 py-0.5 rounded-2xs uppercase whitespace-nowrap leading-none shrink-0" style={{ fontSize: fontSizes.headerPt }}>
                            DEMO #{idx + 1}
                          </div>
                        </div>

                        {/* Product Name */}
                        <div className="my-0.5">
                          <div className="font-black leading-tight text-slate-950 break-words" style={{ fontSize: fontSizes.namePt }}>
                            {productName || item.name}
                          </div>
                        </div>

                        {/* Visual Code */}
                        <div className="flex items-center justify-between gap-2 my-1">
                          {barcodeType === 'qr_code' ? (
                            <div className="flex items-center gap-2 w-full">
                              <div className="w-10 h-10 shrink-0 bg-white flex items-center justify-center">
                                {qrUrl ? <img src={qrUrl} alt="QR" className="w-full h-full object-contain" /> : <QrCode className="w-7 h-7 text-black" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-mono font-black text-slate-950 break-all leading-tight" style={{ fontSize: fontSizes.snPt }}>
                                  SN: {snText}
                                </div>
                                {skuCode && (
                                  <div className="font-mono text-slate-700 break-all leading-tight mt-0.5" style={{ fontSize: fontSizes.notesPt }}>
                                    SKU: {skuCode}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full flex flex-col items-center justify-center">
                              {b1dUrl && <img src={b1dUrl} alt="1D" className="w-full max-h-8 object-contain" />}
                              <div className="font-mono font-black text-slate-950 tracking-wider text-center break-all mt-0.5" style={{ fontSize: fontSizes.snPt }}>
                                {snText}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-black pt-1 mt-1 flex items-end justify-between gap-2 text-slate-900">
                          <div className="font-bold leading-tight flex-1 break-words" style={{ fontSize: fontSizes.notesPt }}>
                            {customNotes || 'UNIT UJI COBA (TIDAK UNTUK DIPERJUALBELIKAN)'}
                          </div>
                          <div className="font-mono font-bold text-slate-600 whitespace-nowrap" style={{ fontSize: fontSizes.notesPt }}>
                            {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : activeSnEntry ? (
                /* Single Active Unit Preview */
                <div 
                  className={`${sizeCfg.previewWidth} ${sizeCfg.previewMinHeight} bg-white text-black p-3.5 rounded-sm shadow-md flex flex-col justify-between transition-all duration-150 relative select-none`}
                  style={{
                    border: showBorder ? '1.5px solid #000' : '1px dashed #cbd5e1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* 1. Header with Property & Badge */}
                  <div className="border-b border-black pb-1 mb-1 flex items-center justify-between gap-1">
                    <div 
                      className="font-black uppercase tracking-tight leading-tight flex-1 break-words"
                      style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).headerPt }}
                    >
                      {headerText || 'PROPERTY OF PT REYCOM INTEGRATED SOLUSI - DEMO UNIT'}
                    </div>
                    <div 
                      className="font-black bg-black text-white px-1.5 py-0.5 rounded-2xs uppercase whitespace-nowrap leading-none shrink-0"
                      style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).headerPt }}
                    >
                      DEMO #{activePreviewIndex + 1}
                    </div>
                  </div>

                  {/* 2. Product Name (Clean wrap, no cut off) */}
                  <div className="my-0.5">
                    <div 
                      className="font-black leading-tight text-slate-950 break-words"
                      style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).namePt }}
                    >
                      {productName || item.name}
                    </div>
                  </div>

                  {/* 3. Barcode / QR Visual Representation for active SN */}
                  <div className="flex items-center justify-between gap-2 my-1">
                    {barcodeType === 'qr_code' ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 bg-white flex items-center justify-center">
                          {qrCodeMap[activeSnEntry.id] ? (
                            <img src={qrCodeMap[activeSnEntry.id]} alt="QR" className="w-full h-full object-contain" />
                          ) : (
                            <QrCode className="w-8 h-8 text-black" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-mono font-black text-slate-950 break-all leading-tight"
                            style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).snPt }}
                          >
                            SN: {activeSnEntry.sn || '-'}
                          </div>
                          {skuCode && (
                            <div 
                              className="font-mono text-slate-700 break-all leading-tight mt-0.5"
                              style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).notesPt }}
                            >
                              SKU: {skuCode}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : barcodeType === 'barcode_1d' ? (
                      <div className="w-full flex flex-col items-center justify-center">
                        {barcode1DMap[activeSnEntry.id] ? (
                          <img src={barcode1DMap[activeSnEntry.id]} alt="1D" className="w-full max-h-9 object-contain" />
                        ) : (
                          <div className="h-8 w-full bg-slate-100 flex items-center justify-center text-[10px] font-mono">Barcode 1D</div>
                        )}
                        <div 
                          className="font-mono font-black text-slate-950 tracking-wider text-center break-all mt-0.5"
                          style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).snPt }}
                        >
                          {activeSnEntry.sn || '-'}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          {barcode1DMap[activeSnEntry.id] && (
                            <img src={barcode1DMap[activeSnEntry.id]} alt="1D" className="w-full max-h-7 object-contain" />
                          )}
                          <div className="font-mono font-bold text-[9px] text-center truncate">
                            SN: {activeSnEntry.sn || '-'}
                          </div>
                        </div>
                        <div className="w-9 h-9 shrink-0">
                          {qrCodeMap[activeSnEntry.id] && (
                            <img src={qrCodeMap[activeSnEntry.id]} alt="QR" className="w-full h-full object-contain" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Footer Strip */}
                  <div className="border-t border-black pt-1 mt-1 flex items-end justify-between gap-2 text-slate-900">
                    <div 
                      className="font-bold leading-tight flex-1 break-words"
                      style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).notesPt }}
                    >
                      {customNotes || 'UNIT UJI COBA (TIDAK UNTUK DIPERJUALBELIKAN)'}
                    </div>
                    <div 
                      className="font-mono font-bold text-slate-600 whitespace-nowrap"
                      style={{ fontSize: getCalculatedFontSizes(activeSnEntry.sn).notesPt }}
                    >
                      {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>

                </div>
              ) : null}

            </div>

            {/* Multi-SN Summary Info Badge */}
            <div className="mt-3 w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mode Multi-SN Aktif:</span> Setiap stiker yang dicetak akan membawa Serial Number dan Barcode unik sesuai nomor seri masing-masing unit tanpa ada yang terpotong.
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
            <span>Target Cetak:</span>
            <strong className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-bold">
              {totalStickerCount} Lembar Stiker ({selectedSnEntries.length} Unit x {copiesPerSn} Salinan)
            </strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintAllStickers}
              disabled={selectedSnEntries.length === 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${selectedSnEntries.length > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {totalStickerCount}x Stiker Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
