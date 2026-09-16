import React, { useEffect, useRef, useState } from 'react';
import { Printer, X, Download, Tag, QrCode } from 'lucide-react';
import { InventoryItem, WarehouseSettings } from '../../types';
import { generateQrCodeDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';

interface BarcodePrintModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  settings: WarehouseSettings;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  item,
  isOpen,
  onClose,
  settings
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    generateQrCodeDataUrl(item.barcode || item.serialNumber || item.name, { width: 220, margin: 1 }).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!isOpen || !item) return null;

  const handlePrint = async () => {
    const qrUrl = await generateQrCodeDataUrl(item.barcode || item.serialNumber || item.name, { width: 320, margin: 1 });
    const html = `
      <div class="doc" style="max-width: 300px; margin: 50px auto; border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #334155;">${settings.warehouseName}</div>
          <div style="font-size: 8px; background: #111827; color: white; padding: 3px 5px; border-radius: 5px; font-weight: 700;">${item.location}</div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; font-weight: 900; line-height: 1.3; color: #0f172a;">${item.name}</div>
        <div style="display: flex; justify-content: space-between; color: #475569; font-size: 9px; margin-top: 6px;">
          <span>${item.brand}</span>
          <span>SKU: ${item.sku}</span>
        </div>
        <div style="margin-top: 8px; display: flex; align-items: center; justify-content: center; padding: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;">
          <img src="${qrUrl}" alt="QRCode" style="width: 100%; max-width: 180px; height: auto; display: block;" />
        </div>
        <div style="text-align:center; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; margin-top: 6px; font-family: monospace;">${item.barcode}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#475569; border-top:1px solid #e2e8f0; margin-top:8px; padding-top:8px;">
          <span>${item.category}</span>
          <span style="font-weight:900; color:#111827;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}</span>
        </div>
      </div>
    `;

    printHtmlDocument('Label Barcode', html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cetak Label Barcode Fisik</h3>
              <p className="text-xs text-slate-400">Ukuran Standar Thermal Sticker (50x30mm / A4)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Label Card */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-400 text-center mb-2">
            Pratinjau Hasil Cetak Label:
          </div>

          <div
            ref={printAreaRef}
            className="print-area print-qr-label bg-white text-black p-4 rounded-xl shadow-lg border-2 border-slate-300 max-w-xs mx-auto space-y-2 select-none"
          >
            <div className="flex items-center justify-between border-b border-black/20 pb-1">
              <span className="text-[10px] font-bold tracking-tight uppercase truncate max-w-[170px]">
                {settings.warehouseName}
              </span>
              <span className="text-[9px] font-mono bg-black text-white px-1.5 py-0.5 rounded">
                {item.location}
              </span>
            </div>

            <div className="text-xs font-black leading-tight truncate">
              {item.name}
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-700 font-semibold">
              <span>{item.brand}</span>
              <span>SKU: {item.sku}</span>
            </div>

            {/* Visual Crisp Barcode */}
            <div className="pt-1 text-center">
              <div className="w-full flex items-center justify-center bg-white px-2 py-1">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QRCode" className="w-full max-w-[160px] h-auto block" />
                ) : (
                  <div className="h-12 w-full flex items-stretch justify-center gap-0.5 bg-white px-2">
                    <QrCode className="w-10 h-10 text-slate-800" />
                  </div>
                )}
              </div>
              <div className="text-[11px] font-mono tracking-widest mt-1 font-bold">
                {item.barcode}
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-gray-600 border-t border-black/10 pt-1">
              <span>Kategori: {item.category}</span>
              <span className="font-bold text-black">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-blue-400">💡 Petunjuk Penggunaan:</p>
            <p>1. Hubungkan printer label thermal (Zebra, Xprinter, Honeywell) atau printer biasa.</p>
            <p>2. Tekan tombol <strong>"Cetak Sekarang"</strong> lalu pilih ukuran kertas yang sesuai.</p>
            <p>3. Tempelkan label pada kemasan barang atau rak penyimpanan.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Printer className="w-4 h-4" />
            Cetak Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
