import React, { useEffect, useState } from 'react';
import { 
  PlayCircle, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Building, 
  User as UserIcon, 
  Calendar,
  X,
  Check,
  ShieldAlert
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { exportService } from '../../services/exportService';
import { RisLogo } from '../Common/RisLogo';
import { formatCurrency } from '../../utils/currency';
import { canSelectForDemo, getInventoryStockState } from '../../utils/inventoryStock';

interface DemoCenterTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onCheckoutDemo: (itemId: string, info: any) => void;
  onCheckinDemo: (itemId: string, returnNotes: string, condition: string) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const DemoCenterTab: React.FC<DemoCenterTabProps> = ({
  items,
  currentUser,
  settings,
  onCheckoutDemo,
  onCheckinDemo,
  onSelectItem
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'overdue' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedItemForCheckin, setSelectedItemForCheckin] = useState<InventoryItem | null>(null);

  // Form Checkout Demo
  const [selectedDemoItemId, setSelectedDemoItemId] = useState('');
  const [latestDemoReceipt, setLatestDemoReceipt] = useState<{ item: InventoryItem; info: any } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [demoQuantity, setDemoQuantity] = useState(1);
  const [outgoingDocumentNumber, setOutgoingDocumentNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [accessoriesNotes, setAccessoriesNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [borrowerName, setBorrowerName] = useState(currentUser.name);
  const [borrowerContact, setBorrowerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [requestFrom, setRequestFrom] = useState('Sales');
  const [companyName, setCompanyName] = useState('');
  const [borrowerDepartment, setBorrowerDepartment] = useState('Sales Enterprise');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Form Check-in Return
  const [returnCondition, setReturnCondition] = useState<InventoryItem['condition']>('bagus');
  const [returnNotes, setReturnNotes] = useState('');

  // All demo items
  const demoItems = items.filter(i => i.status === 'on_demo' || (i.demoLoanInfo && i.demoLoanInfo.active));
  const demoUnitsQty = demoItems.reduce((total, item) => total + getInventoryStockState(item).demoQuantity, 0);
  
  // Overdue calculation (expected return date < today)
  const today = new Date();
  const overdueItems = demoItems.filter(i => {
    if (!i.demoLoanInfo?.expectedReturnDate) return false;
    const exp = new Date(i.demoLoanInfo.expectedReturnDate);
    return exp < today;
  });

  // Keep every SKU visible in the checkout list. Products that are not ready
  // remain visible with their status, but cannot be selected for a new loan.
  const demoProductOptions = items.map(item => {
    const stock = getInventoryStockState(item);
    const isReady = canSelectForDemo(item) && stock.readyQuantity > 0;

    return {
      item,
      stock,
      isReady
    };
  });
  const availableProductsForDemo = demoProductOptions.filter(option => option.isReady);
  const selectedDemoItem = items.find(item => item.id === selectedDemoItemId);
  const maxDemoQuantity = selectedDemoItem ? getInventoryStockState(selectedDemoItem).readyQuantity : 1;

  useEffect(() => {
    if (!selectedDemoItem) {
      setProductName('');
      setProductCode('');
      setSerialNumber('');
      return;
    }

    setProductName(selectedDemoItem.name);
    setProductCode(selectedDemoItem.sku);
    setSerialNumber(selectedDemoItem.serialNumber || '');
  }, [selectedDemoItem]);

  const filteredItems = (activeSubTab === 'overdue' ? overdueItems : demoItems).filter(item => {
    const loan = item.demoLoanInfo;
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan?.customerName && loan.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loan?.borrowerName && loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenCheckin = (item: InventoryItem) => {
    setSelectedItemForCheckin(item);
    setReturnCondition(item.condition || 'bagus');
    setReturnNotes('');
    setIsCheckinModalOpen(true);
  };

  const handleConfirmCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForCheckin) return;
    onCheckinDemo(selectedItemForCheckin.id, returnNotes, returnCondition);
    setIsCheckinModalOpen(false);
    setSelectedItemForCheckin(null);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemoItemId) {
      alert('Pilih printer demo yang akan dipinjamkan!');
      return;
    }
    if (!Number.isInteger(demoQuantity) || demoQuantity < 1 || demoQuantity > maxDemoQuantity) {
      alert(`Jumlah unit demo harus antara 1 sampai ${maxDemoQuantity} unit.`);
      return;
    }
    if (!outgoingDocumentNumber.trim()) {
      alert('No Surat Keluar wajib diisi!');
      return;
    }
    if (!companyName.trim()) {
      alert('Nama perusahaan wajib diisi!');
      return;
    }
    if (!borrowerName.trim()) {
      alert('Nama peminjam wajib diisi!');
      return;
    }
    if (!borrowerContact.trim() && !contactEmail.trim()) {
      alert('Kontak atau email peminjam wajib diisi!');
      return;
    }
    if (!expectedReturnDate) {
      alert('Tentukan tanggal estimasi pengembalian!');
      return;
    }

    const receiptInfo = {
      outgoingDocumentNumber: outgoingDocumentNumber.trim(),
      documentNumber: outgoingDocumentNumber.trim() || `DO-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: productName.trim() || selectedDemoItem?.name,
      productCode: productCode.trim() || selectedDemoItem?.sku,
      serialNumber: serialNumber.trim() || selectedDemoItem?.serialNumber,
      accessoriesNotes: accessoriesNotes.trim(),
      borrowerName: borrowerName.trim(),
      customerName: companyName.trim(),
      companyName: companyName.trim(),
      borrowerContact: borrowerContact.trim(),
      contactEmail: contactEmail.trim(),
      requestFrom: requestFrom.trim(),
      borrowerDepartment,
      loanPeriod: loanPeriod.trim() || '1 Bulan',
      quantity: demoQuantity,
      loanDate: new Date().toISOString(),
      expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      purpose: purpose.trim() || 'POC Demo Uji Coba Kartu',
      notes: notes.trim(),
      active: true,
      loanedBy: currentUser.name,
    };

    const success = onCheckoutDemo(selectedDemoItemId, receiptInfo);
    if ((success as any) === false) {
      return;
    }

    if (selectedDemoItem) {
      setLatestDemoReceipt({ item: selectedDemoItem, info: receiptInfo });
      setIsReceiptModalOpen(true);
    }

    setIsCheckoutModalOpen(false);
    setSelectedDemoItemId('');
    setDemoQuantity(1);
    setOutgoingDocumentNumber('');
    setProductName('');
    setProductCode('');
    setSerialNumber('');
    setAccessoriesNotes('');
    setCustomerName('');
    setBorrowerName(currentUser.name);
    setBorrowerContact('');
    setContactEmail('');
    setRequestFrom('Sales');
    setCompanyName('');
    setExpectedReturnDate('');
    setLoanPeriod('');
    setPurpose('');
    setNotes('');
  };

  const handleOpenDemoReceipt = (item: InventoryItem) => {
    if (!item.demoLoanInfo) {
      alert('Belum ada data tanda terima untuk unit demo ini.');
      return;
    }
    setLatestDemoReceipt({ item, info: item.demoLoanInfo });
    setIsReceiptModalOpen(true);
  };

  const handleSaveDemoReceipt = () => {
    if (!latestDemoReceipt) return;
    exportService.exportDemoLoanReceiptPDF(latestDemoReceipt.item, latestDemoReceipt.info, settings, {
      autoSave: true,
      autoPrint: false
    });
  };

  const handlePrintDemoReceipt = () => {
    if (!latestDemoReceipt) return;
    exportService.exportDemoLoanReceiptPDF(latestDemoReceipt.item, latestDemoReceipt.info, settings, {
      autoSave: false,
      autoPrint: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <PlayCircle className="w-4 h-4" />
            <span>PUSAT KONTROL UNIT DEMO (POC)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            MANAJEMEN UNIT PINJAMAN DEMO
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Monitoring masa peminjaman unit printer demo customer, pencegahan keterlambatan, dan riwayat sirkulasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCheckoutModalOpen(true)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Checkout Peminjaman Demo Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unit Sedang Dipinjam (POC)</span>
          <div className="text-2xl font-black font-heading text-purple-600">
            {demoUnitsQty} Unit
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{demoItems.length} item terdaftar di demo • di lokasi klien customer</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Peringatan Terlambat Kembali</span>
          <div className="text-2xl font-black font-heading text-rose-600 flex items-center gap-2">
            <span>{overdueItems.length} Unit</span>
            {overdueItems.length > 0 && <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />}
          </div>
          <div className="text-[11px] text-rose-600 font-bold">Perlu follow-up tim sales segera</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Produk Siap Dipinjamkan</span>
          <div className="text-2xl font-black font-heading text-emerald-600">
            {availableProductsForDemo.length} SKU Ready
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Tersedia di stok gudang</div>
        </div>
      </div>

      {/* Sub-tab Navigation & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'active' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Peminjaman Aktif ({demoItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab('overdue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'overdue' 
                ? 'bg-rose-600 text-white' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Terlambat Kembali ({overdueItems.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama printer, customer, PIC peminjam, atau serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Demo List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Unit Printer Demo</th>
                <th className="py-3.5 px-4">Customer / Instansi</th>
                <th className="py-3.5 px-4">PIC Sales Peminjam</th>
                <th className="py-3.5 px-4">Tgl Pinjam & Tenggat</th>
                <th className="py-3.5 px-4">Status & Keterangan</th>
                <th className="py-3.5 px-4 text-right">Aksi Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data peminjaman unit demo yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const loan = item.demoLoanInfo;
                  const expDate = loan?.expectedReturnDate ? new Date(loan.expectedReturnDate) : null;
                  const isLate = expDate ? expDate < today : false;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Printer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=100&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <button
                              onClick={() => onSelectItem(item)}
                              className="font-bold text-slate-900 hover:text-purple-600 text-left transition-colors cursor-pointer line-clamp-1"
                            >
                              {item.name}
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SN: {item.serialNumber} • SKU: {item.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loan?.customerName || item.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tujuan: {loan?.purpose || 'POC Demo'}
                          </div>
                        </div>
                      </td>

                      {/* Borrower PIC */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{loan?.borrowerName || item.pic}</div>
                          <div className="text-[10px] text-slate-400">{loan?.borrowerContact || '-'}</div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-slate-500">
                            Pinjam: {loan?.loanDate ? new Date(loan.loanDate).toLocaleDateString('id-ID') : '-'}
                          </div>
                          <div className={`font-bold text-xs flex items-center gap-1 ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                            <Calendar className="w-3 h-3" />
                            <span>Kembali: {expDate ? expDate.toLocaleDateString('id-ID') : '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isLate ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Terlambat</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-purple-500" />
                            <span>Masa Pinjam Aktif</span>
                          </span>
                        )}
                      </td>

                      {/* Receipt & Check-in Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenDemoReceipt(item)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Surat Demo</span>
                          </button>
                          <button
                            onClick={() => handleOpenCheckin(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Check-in Kembali</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Check-in Pengembalian */}
      {isCheckinModalOpen && selectedItemForCheckin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">CHECK-IN PENGEMBALIAN DEMO</h3>
              </div>
              <button onClick={() => setIsCheckinModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckin} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{selectedItemForCheckin.name}</div>
                <div className="text-slate-500 font-mono mt-0.5">SN: {selectedItemForCheckin.serialNumber}</div>
                <div className="text-slate-600 mt-1">Customer: {selectedItemForCheckin.demoLoanInfo?.customerName || selectedItemForCheckin.location}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kondisi Fisik Saat Kembali</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="bagus">Bagus (Fungsi Normal, Siap Dipinjamkan/Dijual)</option>
                  <option value="perlu_servis">Perlu Servis / Pembersihan Workshop</option>
                  <option value="rusak">Rusak / Ada Kerusakan Komponen</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Pengembalian & Kelengkapan</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Kabel power, adaptor, ribbon sisa, dan kartu tester telah dicek..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi Unit Kembali ke Gudang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tanda Terima Demo */}
      {isReceiptModalOpen && latestDemoReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">SURAT PEMINJAMAN UNIT DEMO</h3>
              </div>
              <button onClick={() => { setIsReceiptModalOpen(false); setLatestDemoReceipt(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Paper Preview */}
            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-slate-100/60">
              <div className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-xs text-slate-900 font-sans space-y-4 text-xs">
                
                {/* 1. Header with Logo & PT Name */}
                <div className="flex items-center gap-3">
                  <RisLogo size={36} />
                  <div className="text-base sm:text-lg font-black text-slate-700 tracking-tight uppercase font-heading">
                    {settings?.companyName || 'PT. REYCOM INTEGRATED SOLUSI'}
                  </div>
                </div>

                {/* 2. Document Title */}
                <div className="text-center pt-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    SURAT PEMINJAMAN UNIT DEMO
                  </h2>
                </div>

                {/* 3. Metadata No Surat & Date */}
                <div className="space-y-1 text-slate-800 text-[11px] font-medium">
                  <div>No Surat : <span className="font-semibold">{latestDemoReceipt.info.outgoingDocumentNumber || latestDemoReceipt.info.documentNumber || '-'}</span></div>
                  <div>Jakarta, {latestDemoReceipt.info.loanDate ? new Date(latestDemoReceipt.info.loanDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>

                {/* 4. Section Subheader: TANDA TERIMA */}
                <div className="text-center pt-1">
                  <span className="font-black text-xs sm:text-sm text-slate-900 underline underline-offset-4 uppercase">
                    TANDA TERIMA
                  </span>
                </div>

                {/* 5. Main Form Table */}
                {(() => {
                  const accText = (latestDemoReceipt.info.accessoriesNotes || '').toLowerCase();
                  const isBox = accText.includes('box') || accText.includes('kardus') || accText.includes('dus');
                  const isCable = accText.includes('kabel') || accText.includes('power') || accText.includes('cable');
                  const isAdaptor = accText.includes('adaptor') || accText.includes('adapter') || accText.includes('charger');

                  const loanDateStr = latestDemoReceipt.info.loanDate ? new Date(latestDemoReceipt.info.loanDate).toLocaleDateString('id-ID') : '-';
                  const returnDateStr = latestDemoReceipt.info.expectedReturnDate ? new Date(latestDemoReceipt.info.expectedReturnDate).toLocaleDateString('id-ID') : '-';
                  const periodText = latestDemoReceipt.info.loanPeriod ? `${latestDemoReceipt.info.loanPeriod} (${loanDateStr} s/d ${returnDateStr})` : `(${loanDateStr} s/d ${returnDateStr})`;

                  return (
                    <div className="border border-black divide-y divide-black text-[11px]">
                      {/* Nama Barang */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Nama Barang</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.item.name || latestDemoReceipt.info.productName || '-'}</div>
                      </div>

                      {/* Kode Barang */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Kode Barang</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.item.sku || latestDemoReceipt.info.productCode || '-'}</div>
                      </div>

                      {/* Serial Number */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Serial Number</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.item.serialNumber || latestDemoReceipt.info.serialNumber || '-'}</div>
                      </div>

                      {/* Kelengkapan / Accessories */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white flex flex-col justify-start">
                          <span>Kelengkapan /</span>
                          <span>Accessories</span>
                        </div>
                        <div className="p-2 space-y-2">
                          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium text-[11px]">
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isBox ? 'bg-black text-white' : 'bg-white'}`}>
                                {isBox ? '✓' : ''}
                              </span>
                              <span>Box / Kardus</span>
                            </label>
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isCable ? 'bg-black text-white' : 'bg-white'}`}>
                                {isCable ? '✓' : ''}
                              </span>
                              <span>Kabel Power</span>
                            </label>
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isAdaptor ? 'bg-black text-white' : 'bg-white'}`}>
                                {isAdaptor ? '✓' : ''}
                              </span>
                              <span>Adaptor</span>
                            </label>
                          </div>
                          {latestDemoReceipt.info.accessoriesNotes && (
                            <div className="text-[10px] text-slate-700 italic pt-1 border-t border-slate-200">
                              {latestDemoReceipt.info.accessoriesNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Periode / Lama Waktu Peminjaman */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white flex flex-col justify-start">
                          <span>Periode / Lama Waktu</span>
                          <span>Peminjaman</span>
                        </div>
                        <div className="p-1.5 text-slate-900 font-medium">{periodText}</div>
                      </div>

                      {/* Tujuan / Keperluan */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Tujuan / Keperluan</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.info.purpose || 'POC Demo'}</div>
                      </div>

                      {/* Nama Peminjam */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Nama Peminjam</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.info.borrowerName || '-'}</div>
                      </div>

                      {/* Nama Perusahaan (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">Nama Perusahaan</div>
                        <div className="p-1.5 text-slate-900 font-bold">{latestDemoReceipt.info.companyName || latestDemoReceipt.info.customerName || '-'}</div>
                      </div>

                      {/* PIC Perusahaan (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">PIC Perusahaan</div>
                        <div className="p-1.5 text-slate-900 font-bold">{latestDemoReceipt.info.picReceiver || latestDemoReceipt.info.borrowerName || '-'}</div>
                      </div>

                      {/* No Telp & Email (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">No Telp & Email</div>
                        <div className="p-1.5 text-slate-900 font-medium">
                          {[latestDemoReceipt.info.borrowerContact, latestDemoReceipt.info.contactEmail].filter(Boolean).join('  /  ') || '-'}
                        </div>
                      </div>

                      {/* Keterangan */}
                      <div className="p-2 space-y-1 min-h-[70px]">
                        <div className="font-bold text-slate-900">Keterangan :</div>
                        <div className="text-[11px] text-slate-700 whitespace-pre-wrap">
                          {latestDemoReceipt.info.notes || latestDemoReceipt.item.notes || '-'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Signatures (Bottom) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-black p-2 flex flex-col justify-between h-28 text-center">
                    <div className="font-bold text-slate-900">Yang Menerima,</div>
                    <div className="text-slate-900 font-medium">
                      ( {latestDemoReceipt.info.borrowerName || '                                          '} )
                    </div>
                  </div>
                  <div className="border border-black p-2 flex flex-col justify-between h-28 text-center">
                    <div className="font-bold text-slate-900">Yang Menyerahkan,</div>
                    <div className="text-slate-900 font-medium">
                      ( {latestDemoReceipt.info.loanedBy || settings?.picName || '                                          '} )
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsReceiptModalOpen(false); setLatestDemoReceipt(null); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveDemoReceipt}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Save File (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handlePrintDemoReceipt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout Demo Baru */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-base">FORM PEMINJAMAN UNIT DEMO (CHECKOUT)</h3>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="p-5 sm:p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-purple-600">Data Unit</p>
                    <h4 className="text-sm font-black text-slate-900">Unit & Dokumen Demo</h4>
                  </div>
                  <span className="rounded-full border border-purple-200 bg-purple-100 px-2 py-1 text-[10px] font-bold text-purple-700">Form Pinjaman</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Pilih Produk Ready Stock <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={selectedDemoItemId}
                      onChange={(e) => { setSelectedDemoItemId(e.target.value); setDemoQuantity(1); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="">-- Pilih Produk Ready Stock --</option>
                      {demoProductOptions.map(({ item, stock, isReady }) => (
                        <option key={item.id} value={item.id} disabled={!isReady}>
                          {item.name} ({isReady ? `Ready: ${stock.readyQuantity} ${item.unit}` : `Tidak tersedia: ${stock.catalogStatus === 'service' ? 'Sedang servis' : stock.isDemo ? 'Sedang dipinjam demo' : 'Stok habis'}`} | Rak: {item.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">No Surat Keluar <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="SK-2026-001"
                        value={outgoingDocumentNumber}
                        onChange={(e) => setOutgoingDocumentNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Request From</label>
                      <select
                        value={requestFrom}
                        onChange={(e) => setRequestFrom(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Customer">Customer</option>
                        <option value="Warehouse">Warehouse</option>
                        <option value="Project">Project</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Nama Barang</label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Kode Barang</label>
                      <input
                        type="text"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">SN Barang</label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Periode (Lama Waktu)</label>
                      <input
                        type="text"
                        placeholder="14 Hari / 1 Bulan"
                        value={loanPeriod}
                        onChange={(e) => setLoanPeriod(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Keterangan Aksesoris</label>
                    <textarea
                      rows={2}
                      value={accessoriesNotes}
                      onChange={(e) => setAccessoriesNotes(e.target.value)}
                      placeholder="1 unit kabel power, 1 unit adaptor, 1 box ribbon, 100 lembar blank card..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">Peminjam</p>
                    <h4 className="text-sm font-black text-slate-900">Identitas & Keperluan</h4>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Customer</span>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Nama Perusahaan <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PT. Bank Central Asia Tbk"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Nama Peminjam <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Kontak</label>
                      <input
                        type="text"
                        placeholder="0812-xxxx-xxxx"
                        value={borrowerContact}
                        onChange={(e) => setBorrowerContact(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-slate-700">Email</label>
                      <input
                        type="email"
                        placeholder="sales@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Tujuan / Keperluan</label>
                    <input
                      type="text"
                      placeholder="POC Pencetakan Kartu ID Pegawai..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-purple-600">Jadwal</p>
                    <h4 className="text-sm font-black text-slate-900">Durasi & Pengembalian</h4>
                  </div>
                  <span className="rounded-full border border-purple-200 bg-white px-2 py-1 text-[10px] font-bold text-purple-700">Qty Demo</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Jumlah Unit Dipinjam untuk Demo <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={maxDemoQuantity}
                      value={demoQuantity}
                      disabled={!selectedDemoItem}
                      onChange={(e) => setDemoQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 font-bold shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="text-right text-[11px] text-purple-800">
                    <div className="font-bold">Maks. {maxDemoQuantity} {selectedDemoItem?.unit || 'unit'} siap</div>
                    <div>Ready setelah checkout: {Math.max(0, maxDemoQuantity - demoQuantity)} {selectedDemoItem?.unit || 'unit'}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block font-bold text-slate-700">Estimasi Tanggal Kembali <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 font-bold shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Catatan Kelengkapan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Disertakan 1 roll color ribbon & 100 blank card..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Keluarkan Unit Demo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
