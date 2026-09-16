import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface UnitListTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSelectItem: (item: InventoryItem) => void;
  onAddNewUnit: () => void;
  onOpenScanner: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export const UnitListTab: React.FC<UnitListTabProps> = ({
  items,
  currentUser,
  settings,
  onSelectItem,
  onAddNewUnit,
  onOpenScanner,
  onEditItem,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedLocation, setSelectedLocation] = useState('Semua Lokasi');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filtered = items.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pic && item.pic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'Semua Kategori' || item.category === selectedCategory;
    
    let matchStatus = true;
    if (selectedStatus === 'Tersedia') matchStatus = item.status === 'tersedia' || item.status === 'in_warehouse';
    else if (selectedStatus === 'On Demo') matchStatus = item.status === 'on_demo' || item.status === 'demo_loaned';
    else if (selectedStatus === 'Service') matchStatus = item.status === 'service';
    else if (selectedStatus === 'Rusak / Hilang') matchStatus = item.status === 'rusak' || item.status === 'hilang';

    const matchLoc = selectedLocation === 'Semua Lokasi' || item.location.includes(selectedLocation);

    return matchSearch && matchCategory && matchStatus && matchLoc;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === 'tersedia' || status === 'in_warehouse') {
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Tersedia</span>;
    }
    if (status === 'on_demo' || status === 'demo_loaned') {
      return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[11px] font-bold">On Demo</span>;
    }
    if (status === 'service') {
      return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Service</span>;
    }
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold">{status}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            DAFTAR UNIT / ASSET
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola data master inventaris, status penempatan, dan pelacakan serial number unit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Scan QR</span>
          </button>
          
          <button
            onClick={onAddNewUnit}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Unit</span>
          </button>
        </div>
      </div>

      {/* Filter and Action Bar matching Screenshot */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Serial Number, SKU, Nama..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filter Dropdowns matching Screenshot: Semua Kategori, Semua Status, Semua Lokasi */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua Kategori">Semua Kategori</option>
            {(settings?.categories || []).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="On Demo">On Demo</option>
            <option value="Service">Service</option>
            <option value="Rusak / Hilang">Rusak / Hilang</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua Lokasi">Semua Lokasi</option>
            {(settings?.rackLocations || []).map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Total Summary pill */}
        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-900">{filtered.length}</strong> Unit
        </div>
      </div>

      {/* Main Table matching Screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">PIC</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 group-hover:underline">
                      {item.serialNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.pic || item.updatedBy || '-'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectItem(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Edit Unit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus unit SN ${item.serialNumber}?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada unit yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Screenshot: Menampilkan 1 - 5 dari 1.245 data */}
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
