import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { StockTransaction, InventoryItem, User, WarehouseSettings } from '../../types';

interface StockMovementTabProps {
  transactions: StockTransaction[];
  items?: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onAddNewMovement?: () => void;
}

export const StockMovementTab: React.FC<StockMovementTabProps> = ({
  transactions,
  items,
  currentUser,
  settings,
  onAddNewMovement
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Semua Jenis');
  const [selectedLocation, setSelectedLocation] = useState('Semua Lokasi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom'>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // Quick Preset Handlers
  const handlePresetSelect = (preset: 'all' | 'today' | 'last7' | 'last30' | 'thisMonth') => {
    const now = new Date();
    setActivePreset(preset);
    setCurrentPage(1);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === 'last7') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === 'last30') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
      setIsDatePickerOpen(false);
      return;
    }
  };

  const handleResetDate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStartDate('');
    setEndDate('');
    setActivePreset('all');
    setCurrentPage(1);
    setIsDatePickerOpen(false);
  };

  const getDateLabel = () => {
    if (!startDate && !endDate) return 'Pilih Tanggal';
    if (activePreset === 'today') return 'Hari Ini';
    if (activePreset === 'last7') return '7 Hari Terakhir';
    if (activePreset === 'last30') return '30 Hari Terakhir';
    if (activePreset === 'thisMonth') return 'Bulan Ini';

    const fmt = (dStr: string) => {
      try {
        const [y, m, d] = dStr.split('-');
        return `${d}/${m}/${y}`;
      } catch {
        return dStr;
      }
    };

    if (startDate && endDate) {
      if (startDate === endDate) return fmt(startDate);
      return `${fmt(startDate)} - ${fmt(endDate)}`;
    }
    if (startDate) return `≥ ${fmt(startDate)}`;
    if (endDate) return `≤ ${fmt(endDate)}`;
    return 'Pilih Tanggal';
  };

  const isDateFiltered = Boolean(startDate || endDate);

  const filtered = transactions.filter(tx => {
    const matchSearch = 
      tx.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.serialNumber && tx.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.pic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = selectedType === 'Semua Jenis' || tx.type === selectedType;
    const matchLoc = selectedLocation === 'Semua Lokasi' || tx.fromLocation.includes(selectedLocation) || tx.toLocation.includes(selectedLocation);

    let matchDate = true;
    if (startDate || endDate) {
      try {
        const txDate = new Date(tx.timestamp);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) matchDate = false;
        }
      } catch {
        matchDate = true;
      }
    }

    return matchSearch && matchType && matchLoc && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === 'On Demo') {
      return <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">On Demo</span>;
    }
    if (status === 'Selesai') {
      return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Selesai</span>;
    }
    return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{status}</span>;
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["No. Transaksi,Tanggal,Jenis,Unit / Produk,Qty Mutasi,Satuan,Serial Number,Dari,Ke,PIC,Status,Keterangan",
        ...filtered.map(t => {
          const matchedItem = items?.find(i => i.id === t.itemId || i.sku === t.itemSku);
          const u = t.unit || matchedItem?.unit || 'Unit';
          return `"${t.transactionNumber}","${t.timestamp}","${t.type}","${t.itemName}","${t.quantity}","${u}","${t.serialNumber || '-'}","${t.fromLocation}","${t.toLocation}","${t.pic}","${t.status}","${t.notes || '-'}"`;
        })
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Movement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Header matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Transaksi</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Stock Movement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-0.5">
            STOCK MOVEMENT
          </h1>
        </div>
      </div>

      {/* Filter and Action Bar matching Screenshot */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          
          {/* Semua Jenis Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua Jenis">Semua Jenis</option>
            <option value="Demo Out">Demo Out</option>
            <option value="Demo In">Demo In</option>
            <option value="Transfer">Transfer</option>
            <option value="Service In">Service In</option>
            <option value="Goods Receipt">Goods Receipt</option>
            <option value="Masuk">Masuk</option>
            <option value="Keluar">Keluar</option>
          </select>

          {/* Semua Lokasi Dropdown - generated from settings and transactions */}
          <select
            value={selectedLocation}
            onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(() => {
              const opts = new Set<string>();
              opts.add('Semua Lokasi');
              // add warehouses from settings
              (settings.warehouses || []).forEach(w => opts.add(w));
              // common logical locations
              opts.add('Customer');
              opts.add('Workshop');
              // include distinct locations from transactions
              transactions.forEach(t => {
                if (t.fromLocation) opts.add(t.fromLocation);
                if (t.toLocation) opts.add(t.toLocation);
              });

              return Array.from(opts).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ));
            })()}
          </select>

          {/* Interactive Date Range Filter Popover */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isDateFiltered
                  ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Filter rentang tanggal mutasi"
            >
              <Calendar className={`w-3.5 h-3.5 ${isDateFiltered ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{getDateLabel()}</span>
              {isDateFiltered ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleResetDate}
                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors ml-0.5 cursor-pointer"
                  title="Hapus filter tanggal"
                >
                  <X className="w-3 h-3 text-blue-700" />
                </span>
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Dropdown / Popover Dialog */}
            {isDatePickerOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Filter Periode Tanggal
                  </span>
                  {isDateFiltered && (
                    <button
                      type="button"
                      onClick={handleResetDate}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('all')}
                    className={`px-2 py-1.5 text-xs rounded-lg font-medium text-left transition-colors cursor-pointer ${
                      activePreset === 'all' && !isDateFiltered
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Semua Waktu
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('today')}
                    className={`px-2 py-1.5 text-xs rounded-lg font-medium text-left transition-colors cursor-pointer ${
                      activePreset === 'today'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('last7')}
                    className={`px-2 py-1.5 text-xs rounded-lg font-medium text-left transition-colors cursor-pointer ${
                      activePreset === 'last7'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('last30')}
                    className={`px-2 py-1.5 text-xs rounded-lg font-medium text-left transition-colors cursor-pointer ${
                      activePreset === 'last30'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('thisMonth')}
                    className={`col-span-2 px-2 py-1.5 text-xs rounded-lg font-medium text-left transition-colors cursor-pointer ${
                      activePreset === 'thisMonth'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Bulan Ini (1 s/d Akhir Bulan)
                  </button>
                </div>

                {/* Custom Range Inputs */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilih Rentang Kustom
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">Dari Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setActivePreset('custom');
                          setCurrentPage(1);
                        }}
                        className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setActivePreset('custom');
                          setCurrentPage(1);
                        }}
                        className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-full text-center"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Export Button matching Screenshot */}
        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Add New Movement Button */}
        <button
          onClick={onAddNewMovement}
          className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pergerakan Baru</span>
        </button>
      </div>

      {/* Main Table matching Screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5">No. Transaksi</th>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Unit / Produk</th>
                <th className="py-3 px-3.5 text-center">Qty / Unit</th>
                <th className="py-3 px-3.5">Dari</th>
                <th className="py-3 px-3.5">Ke</th>
                <th className="py-3 px-3.5">PIC</th>
                <th className="py-3 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((tx) => {
                  const matchedItem = items?.find(i => i.id === tx.itemId || i.sku === tx.itemSku);
                  const itemUnit = tx.unit || matchedItem?.unit || 'Unit';
                  const isPositive = ['Masuk', 'Goods Receipt', 'Demo In', 'INBOUND'].includes(tx.type) || 
                                     (tx.type === 'Opname Adjustment' && (tx.newQuantity || 0) > (tx.previousQuantity || 0));
                  const isNegative = ['Penjualan', 'Demo Out', 'Keluar', 'OUTBOUND'].includes(tx.type) || 
                                     (tx.type === 'Opname Adjustment' && (tx.newQuantity || 0) < (tx.previousQuantity || 0));

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5 font-bold font-mono text-blue-600 whitespace-nowrap">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {tx.type}
                      </td>
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{tx.itemName}</span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                            {tx.quantity} {itemUnit}
                          </span>
                        </div>
                        {tx.serialNumber && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 break-words line-clamp-2" title={tx.serialNumber}>
                            <span className="text-slate-400 font-sans font-medium">SN:</span> {tx.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-0.5 font-bold text-xs px-2.5 py-1 rounded-lg border shadow-2xs ${
                          isPositive
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : isNegative
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : 'text-blue-700 bg-blue-50 border-blue-200'
                        }`}>
                          {isPositive && '+'}
                          {isNegative && '-'}
                          {tx.quantity} {itemUnit}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        {tx.fromLocation}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        {tx.toLocation}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {tx.pic}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada transaksi pada filter yang dipilih.
                    {isDateFiltered && (
                      <div className="mt-1.5">
                        <button 
                          type="button"
                          onClick={handleResetDate} 
                          className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                        >
                          Hapus filter tanggal ({getDateLabel()})
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Screenshot */}
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            {filtered.length === 0 ? (
              <span>Menampilkan <strong className="text-slate-800">0</strong> data</span>
            ) : (
              <span>
                Menampilkan <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong className="text-slate-800">{filtered.length}</strong> data
              </span>
            )}
            {isDateFiltered && (
              <span className="ml-2 text-blue-600 font-medium">
                (Filter Tanggal: {getDateLabel()})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
