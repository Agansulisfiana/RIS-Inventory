import React, { useEffect, useState } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Calendar, 
  Clock, 
  FileText, 
  Wrench, 
  Image as ImageIcon, 
  History, 
  Edit3, 
  CheckCircle2, 
  Layers, 
  AlertTriangle,
  User as UserIcon,
  MapPin,
  Tag,
  Share2,
  Download
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getProductStockSummary } from '../../utils/inventoryStock';
import { generateQrCodeDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';
import { storageService } from '../../services/storage';

interface UnitDetailModalProps {
  item: InventoryItem | null;
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onOpenScanner?: () => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  item,
  items,
  currentUser,
  settings,
  onClose,
  onEdit,
  onOpenScanner
}) => {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'foto' | 'dokumen' | 'service'>('riwayat');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<string>('');
  const [transferDest, setTransferDest] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const value = item.barcode || item.serialNumber || item.assetCode || item.name;
    generateQrCodeDataUrl(value, { width: 220, margin: 1 }).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  const stockState = getProductStockSummary(items, item);

  const handlePrintQr = async () => {
    const qrValue = item.barcode || item.serialNumber || item.assetCode || item.name;
    const qrImage = await generateQrCodeDataUrl(qrValue, { width: 320, margin: 1 });

    const html = `
      <div class="doc" style="max-width: 380px; margin: 60px auto; border: 1px solid #dfe3e8; border-radius: 16px; padding: 18px; background: #fff;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div style="font-size: 10px; font-weight: 800; color: #334155; letter-spacing: 0.12em; text-transform: uppercase;">${settings.warehouseName}</div>
          <div style="font-size: 9px; background: #111827; color: white; border-radius: 6px; padding: 4px 6px; font-weight: 700;">${item.location}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="label-box" style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; padding: 8px;">
            <img src="${qrImage || qrCodeDataUrl}" alt="QR code" style="width: 100%; height: 100%; object-fit: contain; border-radius: 5px;" />
          </div>
          <div style="flex: 1;">
            <div style="font-size: 11px; font-weight: 800; color: #0f172a; font-family: monospace;">${item.serialNumber}</div>
            <div style="font-size: 9px; color: #64748b; font-family: monospace; margin-top: 4px;">${item.barcode}</div>
            <div style="font-size: 12px; font-weight: 800; margin-top: 10px;">${item.name}</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument('QR Unit', html);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'tersedia' || status === 'in_warehouse') {
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">Tersedia</span>;
    }
    if (status === 'on_demo' || status === 'demo_loaned') {
      return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold">On Demo</span>;
    }
    if (status === 'service') {
      return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">Service</span>;
    }
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
  };

  const handleOpenTransfer = () => {
    const whs = Object.keys(item.warehouseStocks || {});
    setTransferSource(whs[0] || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta');
    setTransferDest(whs[1] || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta');
    setTransferQty(0);
    setTransferOpen(true);
  };

  const handleSubmitTransfer = () => {
    const qty = Number(transferQty || 0);
    if (!transferSource || !transferDest) return alert('Pilih gudang sumber dan tujuan');
    if (transferSource === transferDest) return alert('Gudang sumber dan tujuan harus berbeda');
    const available = Number(item.warehouseStocks?.[transferSource] || 0);
    if (qty <= 0 || qty > available) return alert(`Jumlah tidak valid. Available di ${transferSource}: ${available}`);

    try {
      storageService.adjustItemStock(item.id, -qty, 'Transfer', `Transfer ke ${transferDest}`, currentUser, transferSource);
      storageService.adjustItemStock(item.id, qty, 'Transfer', `Transfer dari ${transferSource}`, currentUser, transferDest);
      // add explicit transfer transaction
      storageService.addTransaction({
        transactionNumber: `TR-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        type: 'Transfer',
        itemId: item.id,
        itemSku: item.sku,
        serialNumber: item.serialNumber,
        itemName: item.name,
        fromLocation: transferSource,
        toLocation: transferDest,
        quantity: qty,
        pic: currentUser.name,
        status: 'Selesai',
        notes: `Transfer ${qty} dari ${transferSource} ke ${transferDest}`
      });
      alert('Transfer berhasil');
      setTransferOpen(false);
      // quick refresh
      try { window.location.reload(); } catch {}
    } catch (err) {
      console.error(err);
      alert('Gagal melakukan transfer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Unit</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">Detail Unit</span>
            </div>
            <h2 className="text-lg font-black font-heading text-slate-900 mt-0.5">
              DETAIL UNIT
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Top Section: Photo & QR on Left, Key Details Grid on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left: Product Image & QR Code Box */}
            <div className="md:col-span-4 space-y-3">
              <div className="aspect-4/3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* QR Code Card */}
              <div className="print-area print-qr-label p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR code" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-7 h-7 text-slate-800" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 font-mono truncate">{item.serialNumber}</div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">{item.barcode}</div>
                  </div>
                </div>
                <button
                  onClick={handlePrintQr}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak QR</span>
                </button>
              </div>
            </div>

            {/* Right: Key Specification Attributes matching Screenshot */}
            <div className="md:col-span-8 grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Serial Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{item.serialNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Produk</span>
                <span className="font-bold text-slate-900">{item.name}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Asset Code</span>
                <span className="font-mono text-slate-700 font-semibold">{item.assetCode || `AST-${item.sku}`}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Status</span>
                <div className="mt-0.5">{getStatusBadge(item.status)}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Ketersediaan Unit</span>
                <div className="font-semibold text-slate-800">
                  {stockState.readyQuantity} ready • {stockState.demoQuantity} demo
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">Total fisik: {stockState.totalQuantity} {item.unit}</span>
                {item.warehouseStocks && Object.keys(item.warehouseStocks).length > 0 && (
                  <div className="mt-2 text-[12px] text-slate-700 space-y-1">
                    {Object.entries(item.warehouseStocks).map(([wh, q]) => (
                      <div key={wh} className="flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">{wh}</div>
                        <div className="font-mono font-bold">{q} {item.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Lokasi</span>
                <span className="font-semibold text-slate-800">{item.location}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">PIC</span>
                <span className="font-semibold text-slate-800">{item.pic || item.updatedBy || '-'}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Tgl Keluar</span>
                <span className="text-slate-700 font-medium">
                  {item.demoLoanInfo?.loanDate 
                    ? new Date(item.demoLoanInfo.loanDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Estimasi Kembali</span>
                <span className="text-slate-700 font-medium">
                  {item.demoLoanInfo?.expectedReturnDate 
                    ? new Date(item.demoLoanInfo.expectedReturnDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Kondisi</span>
                <span className="font-bold text-slate-800 capitalize">{item.condition}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Nilai Aset / Harga</span>
                <span className="font-bold font-mono text-slate-900">{formatCurrency(item.price)}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 text-[11px] block font-medium">Catatan</span>
                <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  {item.notes || item.demoLoanInfo?.notes || '-'}
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Tabs matching Screenshot: Riwayat, Foto, Dokumen, Service History */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('riwayat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'riwayat' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Riwayat
              </button>
              <button
                onClick={() => setActiveTab('foto')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'foto' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Foto
              </button>
              <button
                onClick={() => setActiveTab('dokumen')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'dokumen' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dokumen
              </button>
              <button
                onClick={() => setActiveTab('service')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'service' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Service History
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-3">
              {activeTab === 'riwayat' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.demoLoanInfo?.active ? 'Peminjaman Demo Unit Keluar' : 'Update Stok / Kondisi'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(item.lastUpdated).toLocaleString('id-ID')} oleh {item.updatedBy}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'foto' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {activeTab === 'dokumen' && (
                <div className="space-y-2 text-xs">
                  {item.documents && item.documents.length > 0 ? (
                    item.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">{doc.name}</span>
                          <span className="text-[10px] text-slate-400">({doc.date})</span>
                        </div>
                        <button className="text-blue-600 font-bold hover:underline">Download</button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">Tidak ada lampiran dokumen.</div>
                  )}
                </div>
              )}

              {activeTab === 'service' && (
                <div className="space-y-2 text-xs">
                  {item.serviceHistory && item.serviceHistory.length > 0 ? (
                    item.serviceHistory.map((srv, idx) => (
                      <div key={idx} className="p-2.5 bg-orange-50/50 rounded-lg border border-orange-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-950">{srv.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{srv.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">Teknisi: {srv.technician}</div>
                        <div className="text-[11px] text-slate-500 italic">{srv.notes}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">Belum ada riwayat service.</div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
