import React, { useEffect, useRef, useState } from 'react';
import { 
  Printer, 
  X, 
  Download, 
  Tag, 
  QrCode, 
  Barcode as BarcodeIcon, 
  Layers, 
  Check, 
  Settings2,
  Copy,
  Building2,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { InventoryItem, WarehouseSettings } from '../../types';
import { generateQrCodeDataUrl, generateBarcode1DDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';

interface BarcodePrintModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  settings: WarehouseSettings;
}

export type StickerSize = '50x30' | '40x20' | '70x40';
export type StickerFormat = 'barcode_1d' | 'combination' | 'qr_code';

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  item,
  isOpen,
  onClose,
  settings
}) => {
  const [stickerFormat, setStickerFormat] = useState<StickerFormat>('barcode_1d');
  const [stickerSize, setStickerSize] = useState<StickerSize>('50x30');
  const [copies, setCopies] = useState<number>(1);
  
  // Customization Toggles
  const [showCompany, setShowCompany] = useState<boolean>(true);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [showSn, setShowSn] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(true);

  // Generated Data URLs
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [barcode1DDataUrl, setBarcode1DDataUrl] = useState<string>('');

  const barcodeValue = item ? (item.barcode || item.serialNumber || item.sku || item.name) : '';
  const serialNumberValue = item?.serialNumber || item?.sku || '-';

  useEffect(() => {
    if (!item || !isOpen) return;

    let isMounted = true;

    // Generate QR Code
    generateQrCodeDataUrl(barcodeValue, { width: 240, margin: 1 }).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    });

    // Generate 1D Code128 Barcode
    const b1d = generateBarcode1DDataUrl(barcodeValue, {
      width: stickerSize === '40x20' ? 1.6 : 2,
      height: stickerSize === '40x20' ? 32 : (stickerSize === '70x40' ? 56 : 42),
      displayValue: false
    });
    setBarcode1DDataUrl(b1d);

    return () => {
      isMounted = false;
    };
  }, [item, isOpen, barcodeValue, stickerSize]);

  if (!isOpen || !item) return null;

  // Compute sticker CSS dimensions based on size preset
  const getSizeConfig = () => {
    switch (stickerSize) {
      case '40x20':
        return {
          label: '40 x 20 mm',
          desc: 'Label Mini (SN & Komponen Kecil)',
          widthMm: '40mm',
          heightMm: '20mm',
          previewWidth: 'w-[260px]',
          previewMinHeight: 'min-h-[140px]',
          fontSizeScale: 'text-[9px]'
        };
      case '70x40':
        return {
          label: '70 x 40 mm',
          desc: 'Label Box / Karton Pengiriman Ekspedisi',
          widthMm: '70mm',
          heightMm: '40mm',
          previewWidth: 'w-[360px]',
          previewMinHeight: 'min-h-[220px]',
          fontSizeScale: 'text-[11px]'
        };
      case '50x30':
      default:
        return {
          label: '50 x 30 mm',
          desc: 'Standar Thermal Label Satuan Unit',
          widthMm: '50mm',
          heightMm: '30mm',
          previewWidth: 'w-[310px]',
          previewMinHeight: 'min-h-[190px]',
          fontSizeScale: 'text-[10px]'
        };
    }
  };

  const sizeCfg = getSizeConfig();
  const printDateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Generate single sticker HTML snippet for printing
  const generateStickerHtml = () => {
    const isMini = stickerSize === '40x20';
    const isLarge = stickerSize === '70x40';

    return `
      <div class="sticker-card" style="
        width: ${sizeCfg.widthMm};
        height: ${sizeCfg.heightMm};
        box-sizing: border-box;
        padding: ${isMini ? '2mm' : isLarge ? '4mm' : '2.5mm'};
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        border: 1px dashed #cbd5e1;
        margin-bottom: 3mm;
      ">
        <!-- Top Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 1.5px; margin-bottom: 1.5px; font-size: ${isMini ? '6.5pt' : '7.5pt'}; font-weight: 800; line-height: 1.1;">
          ${showCompany ? `<span style="text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${settings.companyName || 'PT REYCOM INTEGRATED SOLUSI'}</span>` : '<span></span>'}
          ${showLocation ? `<span style="font-family: monospace; font-weight: 900; background: #000; color: #fff; padding: 1px 3px; border-radius: 2px;">${item.location || 'RAK-01'}</span>` : ''}
        </div>

        <!-- Product Name & Key Identifiers -->
        <div>
          <div style="font-size: ${isMini ? '7pt' : isLarge ? '9.5pt' : '8pt'}; font-weight: 900; line-height: 1.15; color: #000; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${isMini ? '6pt' : '6.5pt'}; color: #222; margin-top: 1px; font-family: monospace;">
            ${showSku ? `<span>SKU: <strong>${item.sku}</strong></span>` : ''}
            ${showSn ? `<span>SN: <strong>${serialNumberValue}</strong></span>` : ''}
          </div>
        </div>

        <!-- Barcode / QR Visual Representation -->
        <div style="text-align: center; margin: 1.5px 0;">
          ${stickerFormat === 'barcode_1d' ? `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <img src="${barcode1DDataUrl}" alt="Barcode 1D" style="width: 100%; max-height: ${isMini ? '24px' : isLarge ? '48px' : '36px'}; object-fit: contain; display: block;" />
              <div style="font-family: monospace; font-size: ${isMini ? '6.5pt' : '7.5pt'}; font-weight: 900; letter-spacing: 0.14em; margin-top: 1px;">
                ${barcodeValue}
              </div>
            </div>
          ` : stickerFormat === 'qr_code' ? `
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
              <img src="${qrCodeDataUrl}" alt="QR" style="height: ${isMini ? '28px' : isLarge ? '56px' : '44px'}; width: auto; object-fit: contain; display: block;" />
              <div style="font-family: monospace; font-size: ${isMini ? '6pt' : '7pt'}; font-weight: 800; text-align: left;">
                <div>${barcodeValue}</div>
                ${showSn ? `<div style="color: #444;">SN: ${serialNumberValue}</div>` : ''}
              </div>
            </div>
          ` : `
            <!-- Combination 1D + QR -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
              <div style="flex: 1; text-align: left;">
                <img src="${barcode1DDataUrl}" alt="Barcode" style="width: 100%; max-height: ${isMini ? '20px' : isLarge ? '38px' : '28px'}; object-fit: contain; display: block;" />
                <div style="font-family: monospace; font-size: 6pt; font-weight: 800; letter-spacing: 0.1em; text-align: center;">${barcodeValue}</div>
              </div>
              <img src="${qrCodeDataUrl}" alt="QR" style="height: ${isMini ? '24px' : isLarge ? '46px' : '34px'}; width: auto; object-fit: contain;" />
            </div>
          `}
        </div>

        <!-- Footer Strip -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 1px; font-size: ${isMini ? '5.5pt' : '6.5pt'}; color: #333;">
          <span>${item.category || item.brand || 'Unit Satuan'}</span>
          ${showDate ? `<span>Tgl: ${printDateStr}</span>` : ''}
          ${showPrice ? `<span style="font-weight: 900; color: #000;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}</span>` : ''}
        </div>
      </div>
    `;
  };

  const handlePrint = () => {
    const singleSticker = generateStickerHtml();
    const count = Math.max(1, copies);
    let allStickersHtml = '';
    for (let i = 0; i < count; i++) {
      allStickersHtml += singleSticker;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Stiker Barcode Satuan - ${item.name}</title>
          <style>
            @page {
              size: ${sizeCfg.widthMm} ${sizeCfg.heightMm};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-card {
              border: none !important;
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
              .sticker-card {
                border: 1px solid #cbd5e1 !important;
                margin-bottom: 10px !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
            }
          </style>
        </head>
        <body>
          ${allStickersHtml}
        </body>
      </html>
    `;

    printHtmlDocument(`Stiker Barcode - ${item.serialNumber || item.sku}`, html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-4">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-heading text-slate-900">
                  CETAK STIKER BARCODE SATUAN
                </h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-md border border-blue-200">
                  Label Thermal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cetak label barcode 1D / QR khusus unit satuan untuk ditempel pada unit printer, kardus, atau rak
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

        {/* Modal Content: 2 Columns (Controls on Left, Live Thermal Sticker on Right) */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* Left Column: Settings & Configuration */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Format Stiker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Format Tampilan Barcode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'barcode_1d', label: 'Barcode 1D', icon: <BarcodeIcon className="w-3.5 h-3.5" /> },
                  { id: 'combination', label: 'Kombinasi', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'qr_code', label: 'QR Code 2D', icon: <QrCode className="w-3.5 h-3.5" /> }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setStickerFormat(fmt.id as StickerFormat)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      stickerFormat === fmt.id
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.icon}
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Ukuran Kertas Stiker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Ukuran Label Stiker Thermal
              </label>
              <div className="space-y-1.5">
                {[
                  { id: '50x30', label: '50 x 30 mm', badge: 'Standar Thermal Satuan', desc: 'Cocok untuk body unit & kardus satuan' },
                  { id: '40x20', label: '40 x 20 mm', badge: 'Ukuran Mini', desc: 'Cocok untuk serial number & sparepart kecil' },
                  { id: '70x40', label: '70 x 40 mm', badge: 'Ukuran Box Besar', desc: 'Cocok untuk kardus pengiriman ekspedisi' }
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setStickerSize(sz.id as StickerSize)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      stickerSize === sz.id
                        ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{sz.label}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          stickerSize === sz.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sz.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{sz.desc}</div>
                    </div>
                    {stickerSize === sz.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Copy / Eksemplar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>Jumlah Cetak Stiker</span>
                <span className="text-slate-400 font-normal text-[11px]">Satuan / Lembar</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopies(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      copies === num
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1.5 text-center text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Elemen Informasi Stiker (Checklist) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Elemen Data Label
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompany}
                    onChange={(e) => setShowCompany(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Nama Perusahaan</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Lokasi Rak Gudang</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSn}
                    onChange={(e) => setShowSn(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Serial Number (SN)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={(e) => setShowSku(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Kode SKU Produk</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Harga Satuan</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tanggal Cetak</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Live Sticker Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-slate-700">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Fisik Stiker:</span>
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                {sizeCfg.label}
              </span>
            </div>

            {/* Scaled Sticker Card */}
            <div 
              className={`bg-white text-black p-3 rounded-lg shadow-md border-2 border-slate-300 ${sizeCfg.previewWidth} ${sizeCfg.previewMinHeight} flex flex-col justify-between select-none transition-all duration-200`}
            >
              {/* Sticker Header */}
              <div className="flex items-center justify-between border-b border-black pb-1 mb-1 text-[10px] font-extrabold leading-tight">
                {showCompany ? (
                  <span className="truncate max-w-[170px] uppercase tracking-tight text-slate-900">
                    {settings.companyName || 'PT REYCOM INTEGRATED SOLUSI'}
                  </span>
                ) : <span />}
                {showLocation && (
                  <span className="font-mono bg-black text-white px-1 py-0.2 rounded text-[9px] font-bold">
                    {item.location || 'RAK-01'}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-0.5">
                <div className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                  {item.name}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-700 font-semibold">
                  {showSku && <span>SKU: {item.sku}</span>}
                  {showSn && <span>SN: {serialNumberValue}</span>}
                </div>
              </div>

              {/* Barcode / QR Center Representation */}
              <div className="my-2 text-center">
                {stickerFormat === 'barcode_1d' ? (
                  <div className="flex flex-col items-center justify-center">
                    {barcode1DDataUrl ? (
                      <img src={barcode1DDataUrl} alt="Barcode 1D" className="w-full max-h-11 object-contain block" />
                    ) : (
                      <div className="h-9 w-full bg-slate-100 flex items-center justify-center text-xs font-mono font-bold">
                        ||| | |||| | |||
                      </div>
                    )}
                    <div className="font-mono text-xs font-black tracking-widest text-slate-900 mt-0.5">
                      {barcodeValue}
                    </div>
                  </div>
                ) : stickerFormat === 'qr_code' ? (
                  <div className="flex items-center justify-center gap-3">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR" className="h-12 w-12 object-contain" />
                    ) : (
                      <QrCode className="w-10 h-10 text-slate-800" />
                    )}
                    <div className="font-mono text-left text-[10px] font-bold text-slate-800">
                      <div>{barcodeValue}</div>
                      {showSn && <div className="text-slate-500 text-[9px]">SN: {serialNumberValue}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      {barcode1DDataUrl ? (
                        <img src={barcode1DDataUrl} alt="Barcode" className="w-full max-h-9 object-contain block" />
                      ) : null}
                      <div className="font-mono text-[9px] font-bold text-center mt-0.5">{barcodeValue}</div>
                    </div>
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR" className="h-10 w-10 object-contain shrink-0" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Sticker Footer */}
              <div className="flex items-center justify-between border-t border-black pt-1 text-[9px] text-slate-700 font-medium">
                <span>{item.category || item.brand}</span>
                {showDate && <span>Tgl: {printDateStr}</span>}
                {showPrice && (
                  <span className="font-black text-black">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="mt-4 text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
              Kompatibel dengan printer label thermal: <strong>Xprinter, Zebra, TSC, Honeywell, Sato, Brother</strong>, dan printer desktop biasa.
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Target cetak: <strong className="text-slate-800">{copies} lembar</strong> stiker satuan
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {copies > 1 ? `${copies}x ` : ''}Stiker Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
