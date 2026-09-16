import React, { useState } from 'react';
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
import { formatCurrency } from '../../utils/currency';
import { getInventoryStockState } from '../../utils/inventoryStock';

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
  const [demoQuantity, setDemoQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [borrowerName, setBorrowerName] = useState(currentUser.name);
  const [borrowerContact, setBorrowerContact] = useState('');
  const [borrowerDepartment, setBorrowerDepartment] = useState('Sales Enterprise');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
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
    return {
      item,
      stock,
      isReady: stock.catalogStatus === 'tersedia' && !stock.isDemo && stock.readyQuantity > 0
    };
  });
  const availableProductsForDemo = demoProductOptions.filter(option => option.isReady);
  const selectedDemoItem = items.find(item => item.id === selectedDemoItemId);
  const maxDemoQuantity = selectedDemoItem ? getInventoryStockState(selectedDemoItem).readyQuantity : 1;

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
    if (!customerName.trim()) {
      alert('Nama customer / instansi wajib diisi!');
      return;
    }
    if (!expectedReturnDate) {
      alert('Tentukan tanggal estimasi pengembalian!');
      return;
    }

    onCheckoutDemo(selectedDemoItemId, {
      borrowerName: borrowerName.trim(),
      customerName: customerName.trim(),
      borrowerContact: borrowerContact.trim(),
      borrowerDepartment,
      quantity: demoQuantity,
      loanDate: new Date().toISOString(),
      expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      purpose: purpose.trim() || 'POC Demo Uji Coba Kartu',
      notes: notes.trim(),
      active: true,
      loanedBy: currentUser.name,
      documentNumber: `DO-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setIsCheckoutModalOpen(false);
    setSelectedDemoItemId('');
    setDemoQuantity(1);
    setCustomerName('');
    setExpectedReturnDate('');
    setPurpose('');
    setNotes('');
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

                      {/* Check-in Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenCheckin(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto shadow-xs transition-colors cursor-pointer"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Check-in Kembali</span>
                        </button>
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

            <form onSubmit={handleConfirmCheckout} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Produk Ready Stock <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={selectedDemoItemId}
                  onChange={(e) => { setSelectedDemoItemId(e.target.value); setDemoQuantity(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">-- Pilih Produk Ready Stock --</option>
                  {demoProductOptions.map(({ item, stock, isReady }) => (
                    <option key={item.id} value={item.id} disabled={!isReady}>
                      {item.name} ({isReady ? `Ready: ${stock.readyQuantity} ${item.unit}` : `Tidak tersedia: ${stock.catalogStatus === 'service' ? 'Sedang servis' : stock.isDemo ? 'Sedang dipinjam demo' : 'Stok habis'}`} | Rak: {item.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jumlah Unit Dipinjam untuk Demo <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={maxDemoQuantity}
                    value={demoQuantity}
                    disabled={!selectedDemoItem}
                    onChange={(e) => setDemoQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="pb-2 text-right text-[11px] text-purple-800">
                  <div className="font-bold">Maks. {maxDemoQuantity} {selectedDemoItem?.unit || 'unit'} siap</div>
                  <div>Ready setelah checkout: {Math.max(0, maxDemoQuantity - demoQuantity)} {selectedDemoItem?.unit || 'unit'}</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Customer / Instansi Tujuan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Bank Central Asia Tbk"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Sales Peminjam</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Kontak Peminjam</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Estimasi Tanggal Kembali <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tujuan / Keperluan Demo</label>
                <input
                  type="text"
                  placeholder="POC Pencetakan Kartu ID Pegawai..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Kelengkapan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Disertakan 1 roll color ribbon & 100 blank card..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none"
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
