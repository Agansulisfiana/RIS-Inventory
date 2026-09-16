import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Tag, 
  Plus, 
  Edit3 
} from 'lucide-react';
import { InventoryItem, User as AppUser, WarehouseSettings, ItemCondition } from '../../types';
import { storageService } from '../../services/storage';
import { exportService } from '../../services/exportService';

interface DemoUnitsTabProps {
  items: InventoryItem[];
  currentUser: AppUser;
  settings: WarehouseSettings;
  onRefreshData: () => void;
  onOpenScanner: (mode?: 'lookup' | 'inbound' | 'outbound' | 'demo_loan' | 'demo_return') => void;
}

export const DemoUnitsTab: React.FC<DemoUnitsTabProps> = ({
  items,
  currentUser,
  settings,
  onRefreshData,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'loaned' | 'warehouse'>('ALL');

  // Return Modal State
  const [returnItem, setReturnItem] = useState<InventoryItem | null>(null);
  const [returnCondition, setReturnCondition] = useState<ItemCondition>('bagus');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnLocation, setReturnLocation] = useState('');

  // New Loan Modal State
  const [newLoanItem, setNewLoanItem] = useState<InventoryItem | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [borrowerDept, setBorrowerDept] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  // Filter all items that are either categorized as Demo, have demoLoanInfo, or are loaned
  const demoItems = items.filter(item => 
    item.category.toLowerCase().includes('demo') || 
    item.status === 'demo_loaned' || 
    item.demoLoanInfo !== undefined
  );

  const activeLoanedItems = demoItems.filter(i => i.status === 'demo_loaned');
  const availableInWarehouse = demoItems.filter(i => i.status === 'in_warehouse');

  const filteredItems = demoItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.demoLoanInfo?.borrowerName && item.demoLoanInfo.borrowerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.demoLoanInfo?.purpose && item.demoLoanInfo.purpose.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'loaned' ? item.status === 'demo_loaned' :
      item.status === 'in_warehouse';

    return matchesSearch && matchesStatus;
  });

  const handleReturnSubmit = () => {
    if (!returnItem) return;
    storageService.returnDemoUnitToWarehouse(
      returnItem.id,
      {
        condition: returnCondition,
        rackLocation: returnLocation || returnItem.location,
        returnNotes: returnNotes || 'Unit demo kembali ke gudang dengan lengkap'
      },
      currentUser
    );
    setReturnItem(null);
    setReturnNotes('');
    onRefreshData();
  };

  const handleLoanSubmit = () => {
    if (!newLoanItem || !borrowerName) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    storageService.loanDemoUnit(
      newLoanItem.id,
      {
        borrowerName,
        borrowerContact,
        borrowerDepartment: borrowerDept,
        expectedReturnDate: expectedReturnDate || defaultDate.toISOString(),
        purpose: loanPurpose || 'Demo Presentasi Tender',
        notes: loanNotes
      },
      currentUser
    );
    setNewLoanItem(null);
    setBorrowerName('');
    setBorrowerContact('');
    setLoanPurpose('');
    setLoanNotes('');
    onRefreshData();
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const isOverdue = (expectedDate: string) => {
    if (!expectedDate) return false;
    return new Date() > new Date(expectedDate);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              Demo Unit & Display Tracker
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Pelacakan & Pengembalian Demo Unit Real-Time
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring lokasi demo unit yang dipinjam sales/klien, batas waktu pengembalian, dan retur otomatis ke gudang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportService.exportDemoUnitsToExcel(items, settings)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>

          <button
            type="button"
            onClick={() => exportService.exportDemoUnitsToPDF(items, settings)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            PDF
          </button>

          <button
            type="button"
            onClick={() => onOpenScanner('demo_return')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Scan Retur ke Gudang
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-blue-600 font-semibold">Sedang Dipinjamkan (Di Luar Gudang)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeLoanedItems.length} Unit
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeLoanedItems.filter(i => i.demoLoanInfo && isOverdue(i.demoLoanInfo.expectedReturnDate)).length} unit melewati batas waktu
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-emerald-600 font-semibold">Tersedia di Gudang (Ready Stock)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {availableInWarehouse.length} Unit
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Siap dipinjamkan untuk demo baru</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Total Unit Demo Terdaftar</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {demoItems.length} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aset khusus presentasi & pameran</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari unit demo, nama peminjam, tujuan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({demoItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('loaned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'loaned' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sedang Dipinjam ({activeLoanedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('warehouse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'warehouse' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Di Gudang ({availableInWarehouse.length})
          </button>
        </div>
      </div>

      {/* Demo Units Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isLoaned = item.status === 'demo_loaned';
            const overdue = isLoaned && item.demoLoanInfo && isOverdue(item.demoLoanInfo.expectedReturnDate);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-5 space-y-4 shadow-sm transition-all ${
                  isLoaned 
                    ? overdue 
                      ? 'border-red-300 bg-red-50/20' 
                      : 'border-blue-200 bg-blue-50/10' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.sku}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                        isLoaned 
                          ? overdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isLoaned ? (overdue ? '⏰ TERLAMBAT PENGEMBALIAN' : 'SEDANG DIPINJAM') : 'TERSEDIA DI GUDANG'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-500">{item.brand} • Lokasi Gudang: {item.location}</p>
                  </div>
                </div>

                {/* Loan Info Details if Active */}
                {isLoaned && item.demoLoanInfo ? (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Peminjam / Sales:</span>
                        <strong className="text-blue-800 font-semibold">{item.demoLoanInfo.borrowerName}</strong>
                        <div className="text-slate-500 text-[11px]">{item.demoLoanInfo.borrowerContact}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Est. Tanggal Pengembalian:</span>
                        <strong className={`font-mono text-[11px] ${overdue ? 'text-rose-600 font-bold' : 'text-amber-800'}`}>
                          {formatDate(item.demoLoanInfo.expectedReturnDate)}
                        </strong>
                        <div className="text-slate-400 text-[10px]">
                          Dipinjam sejak: {formatDate(item.demoLoanInfo.loanDate)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Tujuan & Klien:</span>
                      <p className="text-slate-700 text-xs">{item.demoLoanInfo.purpose || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unit demo berada di {item.location}, siap untuk dipinjamkan kembali.</span>
                  </div>
                )}

                {/* Live Notes */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-800">Keterangan Status Real-Time:</strong>
                  <p className="italic mt-0.5 text-[11px]">{item.notes || 'Tidak ada catatan.'}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {isLoaned ? (
                    <>
                      <button
                        type="button"
                        onClick={() => exportService.exportDemoLoanReceiptPDF(item, item.demoLoanInfo, settings, { autoSave: false, autoPrint: true })}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Cetak Surat Peminjaman Demo"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Cetak Surat Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReturnItem(item);
                          setReturnLocation(item.location);
                          setReturnCondition('bagus');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Proses Retur ke Gudang (Real-Time)
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNewLoanItem(item);
                        setBorrowerName('');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Pinjamkan Unit Demo
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada unit demo yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {returnItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Retur Unit Demo ke Gudang</h3>
                  <p className="text-xs text-slate-500">{returnItem.name}</p>
                </div>
              </div>
              <button onClick={() => setReturnItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Peminjam: <strong className="text-blue-700">{returnItem.demoLoanInfo?.borrowerName}</strong></div>
                <div className="text-[11px] text-slate-500 mt-1">Tujuan: {returnItem.demoLoanInfo?.purpose}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kondisi Fisik Saat Kembali:</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as ItemCondition)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bagus">Bagus & Lengkap</option>
                    <option value="baru">Seperti Baru</option>
                    <option value="perlu_servis">Perlu Servis / Pengecekan</option>
                    <option value="rusak">Ada Kerusakan</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Lokasi Rak Simpan:</label>
                  <input
                    type="text"
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                    placeholder="Zona Demo - Rak D1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Catatan Hasil Pengecekan:</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Kondisi fungsi 100% normal, kelengkapan adaptor dan standing braket lengkap..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReturnItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReturnSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Pulihkan Status ke Gudang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      {newLoanItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Form Peminjaman Demo Unit</h3>
                  <p className="text-xs text-slate-500">{newLoanItem.name}</p>
                </div>
              </div>
              <button onClick={() => setNewLoanItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Nama Peminjam:*</label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Ahmad Fauzi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">No. Kontak Peminjam:</label>
                  <input
                    type="text"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Divisi / Departemen:</label>
                  <input
                    type="text"
                    value={borrowerDept}
                    onChange={(e) => setBorrowerDept(e.target.value)}
                    placeholder="B2B Government"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Est. Tanggal Kembali:</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Tujuan / Nama Klien Demo:</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="POC Tender Presentasi di Dinas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Catatan Kelengkapan:</label>
                <textarea
                  rows={2}
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Kelengkapan remote, kabel, dan tas bawaan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setNewLoanItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLoanSubmit}
                disabled={!borrowerName}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Konfirmasi Peminjaman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
