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
  Download,
  Building2,
  Warehouse,
  Phone,
  MessageSquare,
  ExternalLink,
  Plus,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Barcode as BarcodeIcon
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings, ServiceTicket, StockTransaction } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getProductStockSummary } from '../../utils/inventoryStock';
import { generateQrCodeDataUrl } from '../../utils/barcode';
import { printHtmlDocument } from '../../utils/print';
import { storageService } from '../../services/storage';
import { exportService } from '../../services/exportService';
import { BarcodePrintModal } from './BarcodePrintModal';
import { DemoStickerPrintModal } from '../DemoUnits/DemoStickerPrintModal';

interface UnitDetailModalProps {
  item: InventoryItem | null;
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onOpenScanner?: () => void;
  onRefreshData?: () => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  item,
  items,
  currentUser,
  settings,
  onClose,
  onEdit,
  onOpenScanner,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'foto' | 'dokumen' | 'service'>('riwayat');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  
  // Service Ticket creation states inside the tab
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [serviceProblem, setServiceProblem] = useState('');
  const [serviceDiagnosis, setServiceDiagnosis] = useState('');
  const [serviceTechnician, setServiceTechnician] = useState(currentUser?.name || 'Teknisi Lab');
  const [serviceStatus, setServiceStatus] = useState<'Proses' | 'Selesai' | 'Menunggu Spare Part'>('Selesai');
  const [serviceSpareParts, setServiceSpareParts] = useState('');
  const [serviceCost, setServiceCost] = useState<number>(0);
  const [serviceNotes, setServiceNotes] = useState('');
  const [updateItemStatusToService, setUpdateItemStatusToService] = useState(false);
  const [serviceSuccessMsg, setServiceSuccessMsg] = useState('');

  // Transfer Modal States
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<string>('');
  const [transferDest, setTransferDest] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(0);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [showDemoStickerModal, setShowDemoStickerModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!item) return;

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

  // Check if there are units currently on demo
  const isCurrentlyOnDemo = 
    stockState.demoQuantity > 0 || 
    item.status === 'on_demo' || 
    item.status === 'demo_loaned' || 
    Boolean(item.demoLoanInfo?.active);

  // Calculate remaining days for demo loan
  const getDemoDaysInfo = () => {
    if (!item.demoLoanInfo?.expectedReturnDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDate = new Date(item.demoLoanInfo.expectedReturnDate);
    returnDate.setHours(0, 0, 0, 0);
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Terlambat ${Math.abs(diffDays)} Hari`,
        color: 'bg-rose-100 text-rose-800 border-rose-200',
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return {
        label: 'Jatuh Tempo Hari Ini',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        isOverdue: false
      };
    } else {
      return {
        label: `Sisa ${diffDays} Hari`,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        isOverdue: false
      };
    }
  };

  const demoDaysInfo = getDemoDaysInfo();

  // Print official Demo Loan Letter (PDF)
  const handlePrintDemoLoanReceipt = () => {
    if (!item.demoLoanInfo) return;
    try {
      exportService.exportDemoLoanReceiptPDF(item, item.demoLoanInfo, settings, { autoSave: false, autoPrint: true });
    } catch (err) {
      console.error(err);
      alert('Gagal membuat dokumen surat peminjaman demo.');
    }
  };

  // WhatsApp Contact Helper
  const getWhatsAppUrl = () => {
    if (!item.demoLoanInfo?.borrowerContact) return null;
    let cleanPhone = item.demoLoanInfo.borrowerContact.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const borrower = item.demoLoanInfo.borrowerName || 'Bapak/Ibu';
    const company = settings.companyName || 'PT Reycom Integrated Solusi';
    const returnDateStr = item.demoLoanInfo.expectedReturnDate 
      ? new Date(item.demoLoanInfo.expectedReturnDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      : '-';

    const text = encodeURIComponent(
      `Halo ${borrower}, kami dari ${company} menginformasikan status unit demo:\n\n` +
      `• Produk: ${item.name}\n` +
      `• Serial Number: ${item.serialNumber}\n` +
      `• Tanggal Batas Kembali: ${returnDateStr}\n\n` +
      `Mohon konfirmasi status dan kondisi unit demo tersebut. Terima kasih.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Print QR
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
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Tersedia</span>;
    }
    if (status === 'on_demo' || status === 'demo_loaned') {
      return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>On Demo</span>;
    }
    if (status === 'service') {
      return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>Service Lab</span>;
    }
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
  };

  // Handle Save New Service Ticket
  const handleSaveServiceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceProblem.trim()) {
      alert('Mohon isi keluhan atau tindakan service.');
      return;
    }

    try {
      const ticketNumber = `SV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      const nowIso = new Date().toISOString();

      const newTicket: Omit<ServiceTicket, 'id'> = {
        ticketNumber,
        itemId: item.id,
        itemName: item.name,
        serialNumber: item.serialNumber,
        customerName: item.demoLoanInfo?.companyName || item.demoLoanInfo?.customerName || 'Internal Warehouse',
        problem: serviceProblem,
        diagnosis: serviceDiagnosis || '-',
        technician: serviceTechnician,
        entryDate: nowIso,
        estimatedCompletion: nowIso,
        completionDate: serviceStatus === 'Selesai' ? nowIso : undefined,
        status: serviceStatus,
        spareParts: serviceSpareParts ? [{ name: serviceSpareParts, qty: 1, cost: serviceCost || 0 }] : [],
        costTotal: serviceCost || 0,
        notes: serviceNotes
      };

      storageService.createServiceTicket(newTicket, currentUser);

      // Also append to item.serviceHistory
      const updatedItem = { ...item };
      if (!updatedItem.serviceHistory) updatedItem.serviceHistory = [];
      updatedItem.serviceHistory.unshift({
        date: new Date().toLocaleDateString('id-ID'),
        action: serviceProblem,
        technician: serviceTechnician,
        notes: `${serviceDiagnosis ? `Diagnosa: ${serviceDiagnosis}. ` : ''}${serviceNotes ? `Catatan: ${serviceNotes}. ` : ''}${serviceSpareParts ? `Sparepart: ${serviceSpareParts}. ` : ''}`
      });

      if (updateItemStatusToService) {
        updatedItem.status = 'service';
      } else if (serviceStatus === 'Selesai' && item.status === 'service') {
        updatedItem.status = 'tersedia';
      }

      storageService.saveItem(updatedItem, currentUser);

      // Success feedback
      setServiceSuccessMsg(`Tiket ${ticketNumber} berhasil dicatat.`);
      setShowAddServiceForm(false);
      setServiceProblem('');
      setServiceDiagnosis('');
      setServiceSpareParts('');
      setServiceCost(0);
      setServiceNotes('');

      setTimeout(() => setServiceSuccessMsg(''), 4000);

      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat tiket service.');
    }
  };

  // Query service records
  const allTickets = storageService.getServiceTickets();
  const matchedServiceTickets = allTickets.filter(t => 
    t.itemId === item.id || 
    (t.serialNumber && item.serialNumber && t.serialNumber.toLowerCase() === item.serialNumber.toLowerCase()) ||
    (t.itemName && item.name && t.itemName.toLowerCase() === item.name.toLowerCase())
  );

  // Query transaction movements
  const allTransactions = storageService.getTransactions();
  const matchedTransactions = allTransactions.filter(t => 
    t.itemId === item.id || 
    (t.serialNumber && item.serialNumber && t.serialNumber.toLowerCase() === item.serialNumber.toLowerCase()) ||
    (t.itemSku && item.sku && t.itemSku.toLowerCase() === item.sku.toLowerCase())
  );

  // Parse Physical Warehouse Rack Location
  const rackLocation = item.location && !item.location.toLowerCase().includes('customer:')
    ? item.location
    : 'Rak Utama (A01)';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Unit</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">Detail Unit & Alokasi Stok</span>
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

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
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

              {/* QR Code & Stiker Barcode Satuan Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
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
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="Cetak Cepat QR Code Unit"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak QR</span>
                  </button>
                </div>

                {/* Fitur Cetak Stiker Barcode & Demo Satuan */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowBarcodePrintModal(true)}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    title="Buka Generator Label Stiker Thermal Satuan (50x30mm)"
                  >
                    <BarcodeIcon className="w-4 h-4" />
                    <span>Cetak Stiker Barcode Satuan</span>
                  </button>

                  {(item.status === 'on_demo' || item.status === 'demo_loaned' || item.demoLoanInfo || item.category?.toLowerCase().includes('demo')) && (
                    <button
                      onClick={() => setShowDemoStickerModal(true)}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      title="Buka Konfigurasi Stiker Unit Demo (Bisa Ganti Teks Bebas & Tidak Terpotong)"
                    >
                      <Tag className="w-4 h-4" />
                      <span>Cetak Stiker Unit Demo (Custom Teks)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Specs Badges */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Kategori:</span>
                  <span className="font-semibold text-slate-800">{item.category}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Merek:</span>
                  <span className="font-semibold text-slate-800">{item.brand}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Kondisi:</span>
                  <span className="font-bold text-slate-800 capitalize">{item.condition}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Nilai Aset:</span>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(item.price)}</span>
                </div>
              </div>
            </div>

            {/* Right: Key Specification Attributes & Physical Location */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Product Title & Basic Codes */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Serial Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{item.serialNumber}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Produk</span>
                  <span className="font-bold text-slate-900 leading-snug">{item.name}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Asset Code</span>
                  <span className="font-mono text-slate-700 font-semibold">{item.assetCode || `AST-${item.sku}`}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Status</span>
                  <div className="mt-0.5">{getStatusBadge(item.status)}</div>
                </div>
              </div>

              {/* SECTION: RINCIAN POSISI & ALOKASI STOK FISIK */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Rincian Posisi & Alokasi Fisik Barang
                  </span>
                  <div className="text-xs font-semibold text-slate-700">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">{stockState.readyQuantity} ready</span>
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">{stockState.demoQuantity} demo</span>
                    <span className="ml-1 text-[11px] text-slate-400 font-normal">(Total: {stockState.totalQuantity} {item.unit})</span>
                  </div>
                </div>

                {/* 1. Posisi Stok di Gudang Fisik (Ready) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                        <Warehouse className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {item.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Lokasi Rak Simpan:</span>
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            {rackLocation}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-700">
                        {stockState.readyQuantity} {item.unit}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">Tersedia di Rak</span>
                    </div>
                  </div>

                  {/* If there are multiple warehouses in warehouseStocks */}
                  {item.warehouseStocks && Object.keys(item.warehouseStocks).length > 1 && (
                    <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(item.warehouseStocks).map(([wh, q]) => (
                        <div key={wh} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-600 truncate">{wh}</span>
                          <span className="font-mono font-bold text-slate-900 shrink-0 ml-1">{q} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Posisi Unit Demo (Jika ada unit yang dipinjam demo) */}
                {isCurrentlyOnDemo && (
                  <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                            <span>Sedang Dipinjam Demo</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200/70 text-purple-800 font-extrabold font-mono">
                              {stockState.demoQuantity || item.demoLoanInfo?.quantity || 1} {item.unit}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                            {item.demoLoanInfo?.companyName || item.demoLoanInfo?.customerName || (item.location.startsWith('Customer:') ? item.location.replace('Customer:', '').trim() : 'Customer Rekanan')}
                          </div>
                        </div>
                      </div>

                      {demoDaysInfo && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${demoDaysInfo.color} shrink-0`}>
                          {demoDaysInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Detailed Demo Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] bg-white/80 p-2.5 rounded-lg border border-purple-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">PIC Peminjam:</span>
                        <span className="font-bold text-slate-800">{item.demoLoanInfo?.borrowerName || item.pic || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kontak / HP:</span>
                        <span className="font-mono text-slate-700 font-semibold">{item.demoLoanInfo?.borrowerContact || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lokasi / Ruangan:</span>
                        <span className="text-slate-800 font-medium truncate block" title={item.demoLoanInfo?.borrowerDepartment || item.location}>
                          {item.demoLoanInfo?.borrowerDepartment || (item.location.startsWith('Customer:') ? item.location : 'Kantor Klien')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tgl Keluar:</span>
                        <span className="text-slate-700 font-medium">
                          {item.demoLoanInfo?.loanDate 
                            ? new Date(item.demoLoanInfo.loanDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Estimasi Kembali:</span>
                        <span className="font-bold text-slate-900">
                          {item.demoLoanInfo?.expectedReturnDate 
                            ? new Date(item.demoLoanInfo.expectedReturnDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Keperluan:</span>
                        <span className="text-slate-700 font-medium truncate block" title={item.demoLoanInfo?.purpose}>
                          {item.demoLoanInfo?.purpose || 'Uji Coba POC'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Demo */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handlePrintDemoLoanReceipt}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Cetak Surat Peminjaman Demo</span>
                      </button>

                      {item.demoLoanInfo?.borrowerContact && getWhatsAppUrl() && (
                        <a
                          href={getWhatsAppUrl()!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp PIC</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Posisi di Service / Workshop (Jika status service) */}
                {item.status === 'service' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">Sedang di Workshop Lab</div>
                        <div className="text-[11px] text-amber-800">
                          Teknisi Penanggung Jawab: <span className="font-bold">{item.pic || 'Teknisi Lab'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-200/70 text-amber-900 rounded-md text-[10px] font-bold">
                      Dalam Perbaikan
                    </span>
                  </div>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Catatan / Spesifikasi</span>
                <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  {item.notes || item.demoLoanInfo?.notes || 'Tidak ada catatan tambahan.'}
                </p>
              </div>

            </div>

          </div>

          {/* Bottom Tabs: Riwayat, Foto, Dokumen, Service History */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('riwayat')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'riwayat' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat Mutasi</span>
                  {matchedTransactions.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-700">
                      {matchedTransactions.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('service')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'service' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Riwayat Servis</span>
                  {(matchedServiceTickets.length > 0 || (item.serviceHistory && item.serviceHistory.length > 0)) && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-orange-100 text-orange-800">
                      {matchedServiceTickets.length + (item.serviceHistory?.length || 0)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('foto')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'foto' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto</span>
                </button>
                <button
                  onClick={() => setActiveTab('dokumen')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'dokumen' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dokumen</span>
                </button>
              </div>

              {activeTab === 'service' && !showAddServiceForm && (
                <button
                  onClick={() => setShowAddServiceForm(true)}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Servis Baru</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="pt-3">
              
              {/* --- TAB 1: RIWAYAT MUTASI STOK --- */}
              {activeTab === 'riwayat' && (
                <div className="space-y-2 text-xs">
                  {matchedTransactions.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {matchedTransactions.map((trx, idx) => (
                        <div key={trx.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-md bg-white border border-slate-200 text-blue-600 mt-0.5">
                              <History className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span>{trx.type}</span>
                                <span className="text-[10px] text-slate-400 font-mono">#{trx.transactionNumber}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                Dari: <span className="font-medium text-slate-800">{trx.fromLocation}</span> &rarr; Ke: <span className="font-medium text-slate-800">{trx.toLocation}</span>
                              </div>
                              {trx.notes && (
                                <div className="text-[10px] text-slate-500 italic mt-0.5">{trx.notes}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {trx.quantity} {item.unit}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-slate-500">Oleh: {trx.pic}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800">
                          {item.demoLoanInfo?.active ? 'Peminjaman Demo Unit Keluar' : 'Update Stok / Posisi Fisik'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Terakhir diperbarui: {new Date(item.lastUpdated).toLocaleString('id-ID')} oleh {item.updatedBy || 'Staff Gudang'}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-600 mt-1 italic">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 2: RIWAYAT SERVIS & PEMELIHARAAN (SERVICE HISTORY) --- */}
              {activeTab === 'service' && (
                <div className="space-y-3 text-xs">
                  {serviceSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      {serviceSuccessMsg}
                    </div>
                  )}

                  {/* Form Tambah Catatan Servis Baru */}
                  {showAddServiceForm && (
                    <form onSubmit={handleSaveServiceRecord} className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-orange-200/80">
                        <span className="font-bold text-orange-950 flex items-center gap-1.5 text-xs">
                          <Wrench className="w-3.5 h-3.5 text-orange-600" />
                          Catat Riwayat Servis / Pemeliharaan Unit Ini
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddServiceForm(false)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Keluhan / Tindakan Servis *
                          </label>
                          <input
                            type="text"
                            required
                            value={serviceProblem}
                            onChange={(e) => setServiceProblem(e.target.value)}
                            placeholder="Contoh: Pembersihan print head & kalibrasi roller"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Teknisi Penanggung Jawab *
                          </label>
                          <input
                            type="text"
                            required
                            value={serviceTechnician}
                            onChange={(e) => setServiceTechnician(e.target.value)}
                            placeholder="Nama Teknisi"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Diagnosa / Solusi Perbaikan
                          </label>
                          <input
                            type="text"
                            value={serviceDiagnosis}
                            onChange={(e) => setServiceDiagnosis(e.target.value)}
                            placeholder="Contoh: Sensor debu dibersihkan dengan IPA 99%"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Status Servis
                          </label>
                          <select
                            value={serviceStatus}
                            onChange={(e) => setServiceStatus(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          >
                            <option value="Selesai">Selesai (Perangkat Sudah Siap)</option>
                            <option value="Proses">Sedang Dalam Proses Pengerjaan</option>
                            <option value="Menunggu Spare Part">Menunggu Pengadaan Spare Part</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Sparepart yang Diganti (Opsional)
                          </label>
                          <input
                            type="text"
                            value={serviceSpareParts}
                            onChange={(e) => setServiceSpareParts(e.target.value)}
                            placeholder="Contoh: Roller Karet Part #10291"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Total Biaya (IDR)
                          </label>
                          <input
                            type="number"
                            value={serviceCost}
                            onChange={(e) => setServiceCost(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Catatan Tambahan
                        </label>
                        <textarea
                          rows={2}
                          value={serviceNotes}
                          onChange={(e) => setServiceNotes(e.target.value)}
                          placeholder="Kondisi setelah perbaikan, catatan garansi, dll..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        />
                      </div>

                      {serviceStatus !== 'Selesai' && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="check-service-status"
                            checked={updateItemStatusToService}
                            onChange={(e) => setUpdateItemStatusToService(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="check-service-status" className="text-[11px] text-slate-700 font-medium">
                            Ubah status barang di inventaris menjadi <span className="font-bold text-orange-800">"Service"</span> saat ini
                          </label>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-200">
                        <button
                          type="button"
                          onClick={() => setShowAddServiceForm(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Simpan Catatan Servis
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Combined Service Tickets & Legacy Service History */}
                  {matchedServiceTickets.length > 0 || (item.serviceHistory && item.serviceHistory.length > 0) ? (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {/* 1. From Service Tickets Table */}
                      {matchedServiceTickets.map((st) => (
                        <div key={st.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">{st.ticketNumber}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                st.status === 'Selesai' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : st.status === 'Proses' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {st.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(st.entryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-800">{st.problem}</div>
                          {st.diagnosis && (
                            <div className="text-[11px] text-slate-600">
                              <span className="text-slate-400">Tindakan / Diagnosa:</span> {st.diagnosis}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <div>Teknisi: <span className="font-semibold text-slate-700">{st.technician}</span></div>
                            {st.costTotal && st.costTotal > 0 ? (
                              <div className="font-mono font-bold text-slate-800">Biaya: {formatCurrency(st.costTotal)}</div>
                            ) : null}
                          </div>
                        </div>
                      ))}

                      {/* 2. From Legacy item.serviceHistory */}
                      {item.serviceHistory && item.serviceHistory.map((srv, idx) => (
                        <div key={`srv-legacy-${idx}`} className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-950 text-xs">{srv.action}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{srv.date}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">Teknisi: <span className="font-medium text-slate-800">{srv.technician}</span></div>
                          {srv.notes && <div className="text-[11px] text-slate-500 italic">{srv.notes}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-700">Belum ada catatan servis</div>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Unit ini belum pernah dicatat dalam perbaikan atau pemeliharaan servis lab.
                      </p>
                      {!showAddServiceForm && (
                        <button
                          onClick={() => setShowAddServiceForm(true)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Catat Servis Sekarang</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3: FOTO --- */}
              {activeTab === 'foto' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                    <img 
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80'} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 p-1.5 text-[10px] text-white text-center font-medium">
                      Foto Utama Unit
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 4: DOKUMEN --- */}
              {activeTab === 'dokumen' && (
                <div className="space-y-2 text-xs">
                  {/* Generated Demo Loan Doc if active */}
                  {isCurrentlyOnDemo && item.demoLoanInfo && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-purple-950">Surat Peminjaman Unit Demo Resmi</div>
                          <div className="text-[10px] text-purple-700">
                            No. Dokumen: {item.demoLoanInfo.outgoingDocumentNumber || item.demoLoanInfo.documentNumber || 'Surat Demo RIS'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handlePrintDemoLoanReceipt}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  )}

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
                  ) : !isCurrentlyOnDemo ? (
                    <div className="p-4 text-center text-slate-400 text-xs">Tidak ada lampiran dokumen.</div>
                  ) : null}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Terakhir diupdate: <span className="font-semibold text-slate-700">{new Date(item.lastUpdated).toLocaleDateString('id-ID')}</span> oleh <span className="font-semibold text-slate-700">{item.updatedBy}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Modal Cetak Stiker Barcode Satuan */}
      {showBarcodePrintModal && (
        <BarcodePrintModal
          item={item}
          isOpen={showBarcodePrintModal}
          onClose={() => setShowBarcodePrintModal(false)}
          settings={settings}
        />
      )}

      {/* Modal Cetak Stiker Demo Satuan */}
      {showDemoStickerModal && (
        <DemoStickerPrintModal
          item={item}
          isOpen={showDemoStickerModal}
          onClose={() => setShowDemoStickerModal(false)}
          settings={settings}
        />
      )}
    </div>
  );
};
