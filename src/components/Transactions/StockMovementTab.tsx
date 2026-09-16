import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { StockTransaction, User, WarehouseSettings } from '../../types';

interface StockMovementTabProps {
  transactions: StockTransaction[];
  currentUser: User;
  settings: WarehouseSettings;
  onAddNewMovement?: () => void;
}

export const StockMovementTab: React.FC<StockMovementTabProps> = ({
  transactions,
  currentUser,
  settings,
  onAddNewMovement
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Semua Jenis');
  const [selectedLocation, setSelectedLocation] = useState('Semua Lokasi');
  const [dateRange, setDateRange] = useState('01/05/2024 - 31/05/2024');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = transactions.filter(tx => {
    const matchSearch = 
      tx.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.serialNumber && tx.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.pic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = selectedType === 'Semua Jenis' || tx.type === selectedType;
    const matchLoc = selectedLocation === 'Semua Lokasi' || tx.fromLocation.includes(selectedLocation) || tx.toLocation.includes(selectedLocation);

    return matchSearch && matchType && matchLoc;
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
      ["No. Transaksi,Tanggal,Jenis,Unit / Produk,Serial Number,Dari,Ke,PIC,Status",
        ...filtered.map(t => `"${t.transactionNumber}","${t.timestamp}","${t.type}","${t.itemName}","${t.serialNumber || '-'}","${t.fromLocation}","${t.toLocation}","${t.pic}","${t.status}"`)
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

          {/* Date Picker matching Screenshot */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
            <span>{dateRange}</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                <th className="py-3 px-3.5">Dari</th>
                <th className="py-3 px-3.5">Ke</th>
                <th className="py-3 px-3.5">PIC</th>
                <th className="py-3 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((tx) => (
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
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{tx.itemName}</div>
                      {tx.serialNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">SN: {tx.serialNumber}</div>
                      )}
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada transaksi pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Screenshot */}
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Menampilkan <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong className="text-slate-800">{filtered.length}</strong> data
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
