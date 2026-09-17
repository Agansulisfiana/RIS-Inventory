import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  QrCode, 
  Barcode, 
  Edit3, 
  Trash2, 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  X,
  Minus,
  Check,
  Building2,
  Boxes
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { exportService } from '../../services/exportService';
import { getInventoryStockState } from '../../utils/inventoryStock';

interface ProductCatalogTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSelectItem: (item: InventoryItem) => void;
  onAddNewProduct: () => void;
  onEditProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onQuickAdjustStock: (id: string, delta: number, notes?: string, warehouse?: string) => void;
  onPrintBarcode: (item: InventoryItem) => void;
  onOpenSalesModal?: () => void;
  onOpenReceiptModal?: () => void;
}

export const ProductCatalogTab: React.FC<ProductCatalogTabProps> = ({
  items,
  currentUser,
  settings,
  onSelectItem,
  onAddNewProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickAdjustStock,
  onPrintBarcode,
  onOpenSalesModal,
  onOpenReceiptModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'ready' | 'low' | 'out'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Quick Restock Modal State
  const [restockModalItem, setRestockModalItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockDirection, setRestockDirection] = useState<'in' | 'out'>('in');
  const [restockWarehouse, setRestockWarehouse] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('Restock manual via katalog');

  const handleOpenRestock = (item: InventoryItem) => {
    setRestockModalItem(item);
    setRestockQty(10);
    setRestockDirection('in');
    setRestockNotes('Restock manual via katalog');
    const defaultWh = item.warehouseName || (settings?.warehouses && settings.warehouses[0]) || settings?.warehouseName || 'Gudang Utama Jakarta';
    setRestockWarehouse(defaultWh);
  };

  const handleCloseRestock = () => {
    setRestockModalItem(null);
  };

  const handleConfirmRestock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!restockModalItem) return;
    const qty = Math.max(1, Math.floor(Number(restockQty) || 1));
    const delta = restockDirection === 'in' ? qty : -qty;
    onQuickAdjustStock(restockModalItem.id, delta, restockNotes, restockWarehouse);
    setRestockModalItem(null);
  };

  // Categories list
  const categories = ['Semua Kategori', ...(settings?.categories || [])];

  // Filtering
  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'Semua Kategori' || item.category === selectedCategory;

    let matchStock = true;
    const st = getInventoryStockState(item as any);
    if (selectedStockFilter === 'ready') matchStock = st.readyQuantity > item.minStock;
    else if (selectedStockFilter === 'low') matchStock = st.readyQuantity <= item.minStock && st.readyQuantity > 0;
    else if (selectedStockFilter === 'out') matchStock = st.readyQuantity === 0;

    return matchSearch && matchCategory && matchStock;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Financial statistics
  const totalStockQty = items.reduce((acc, curr) => acc + getInventoryStockState(curr as any).readyQuantity, 0);
  const totalValuation = items.reduce((acc, curr) => acc + (getInventoryStockState(curr as any).readyQuantity * (curr.costPrice || curr.price)), 0);
  const totalPotentialRevenue = items.reduce((acc, curr) => acc + (getInventoryStockState(curr as any).readyQuantity * (curr.sellPrice || curr.price)), 0);
  const lowStockCount = items.filter(i => getInventoryStockState(i as any).readyQuantity <= i.minStock).length;

  const handleExportExcel = () => {
    exportService.exportInventoryToExcel(filteredItems, settings);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Package className="w-4 h-4" />
            <span>KATALOG & STOK BARANG DIJUAL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            MANAJEMEN PRODUK & INVENTORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Kelola master produk printer, ribbon, kartu PVC, suku cadang, dan kontrol stok siap jual
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenSalesModal && (
            <button
              onClick={onOpenSalesModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Buat Penjualan (DO)</span>
            </button>
          )}

          {onOpenReceiptModal && (
            <button
              onClick={onOpenReceiptModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Terima Barang (PO)</span>
            </button>
          )}

          <button
            onClick={onAddNewProduct}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            title="Download Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 transform hover:-translate-y-1 transition-transform duration-200 animate-pulse-subtle">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Jenis Produk</span>
          <div className="text-xl sm:text-2xl font-black font-heading text-slate-900">{items.length} SKU</div>
          <div className="text-[11px] text-slate-500 font-medium">Total kuantitas: <span className="font-bold text-slate-800">{totalStockQty} unit/pcs</span></div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 transform hover:-translate-y-1 transition-transform duration-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Nilai Modal Stok</span>
          <div className="text-xl sm:text-2xl font-black font-heading text-blue-600">{formatCurrency(totalValuation)}</div>
          <div className="text-[11px] text-slate-500 font-medium">Berdasarkan harga beli gudang</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 transform hover:-translate-y-1 transition-transform duration-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estimasi Nilai Jual</span>
          <div className="text-xl sm:text-2xl font-black font-heading text-emerald-600">{formatCurrency(totalPotentialRevenue)}</div>
          <div className="text-[11px] text-emerald-600 font-bold">Potensi Profit: {formatCurrency(totalPotentialRevenue - totalValuation)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Peringatan Stok Kritis</span>
          <div className="text-xl sm:text-2xl font-black font-heading text-rose-600">{lowStockCount} Produk</div>
          <div className="text-[11px] text-rose-600 font-bold">Perlu reorder PO segera</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, barcode EAN, brand, atau lokasi rak..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Grid Galeri"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold text-[11px] mr-1">Status Stok:</span>
          <button
            onClick={() => setSelectedStockFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedStockFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setSelectedStockFilter('ready')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedStockFilter === 'ready' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Stok Aman ({items.filter(i => i.quantity > i.minStock).length})
          </button>
          <button
            onClick={() => setSelectedStockFilter('low')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedStockFilter === 'low' 
                ? 'bg-rose-600 text-white' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Stok Menipis / Kritis ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="catalog-table min-w-[1180px] w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4" style={{width: '28%'}}>Info Produk & SKU</th>
                  <th className="py-3 px-4" style={{width: '13%'}}>Kategori & Brand</th>
                  <th className="py-3 px-4" style={{width: '14%'}}>Harga Beli / Jual</th>
                  <th className="py-3 px-4 text-center" style={{width: '12%'}}>Stok Gudang</th>
                  <th className="py-3 px-4" style={{width: '11%'}}>Lokasi Rak</th>
                  <th className="py-3 px-4 text-center" style={{width: '10%'}}>Status</th>
                  <th className="py-3 px-4 text-right" style={{width: '12%'}}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedItems.map((item) => {
                  const stockState = getInventoryStockState(item);
                  const isLow = stockState.readyQuantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors align-top">
                      
                      {/* Product Name & Identifiers */}
                      <td className="py-3.5 px-4 min-w-0 align-top">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=100&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0 overflow-hidden">
                            <button
                              onClick={() => onSelectItem(item)}
                              className="block w-full font-bold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer text-sm truncate"
                              title={item.name}
                            >
                              {item.name}
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-mono min-w-0">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold inline-block max-w-[110px] truncate">{item.sku}</span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="truncate max-w-[110px]">SN: {item.serialNumber || '-'}</span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="truncate max-w-[120px]">EAN: {item.barcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4 min-w-0 align-top">
                        <div className="space-y-0.5 max-w-full overflow-hidden">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-block max-w-full truncate">
                            {item.category}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-full">{item.brand}</div>
                        </div>
                      </td>

                      {/* Prices */}
                      <td className="py-3.5 px-4 min-w-0 align-top">
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="font-bold text-emerald-700 text-xs truncate">
                            {formatCurrency(item.sellPrice || item.price)}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Modal: {formatCurrency(item.costPrice || item.price)}
                          </div>
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center min-w-0 align-top">
                                <div className="inline-flex max-w-full flex-col items-center overflow-hidden">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                    isLow 
                                      ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}>
                                    {stockState.readyQuantity} {item.unit}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full">
                                    Ready: {stockState.readyQuantity} • Demo: {stockState.demoQuantity}
                                  </span>
                                  {/* Per-warehouse breakdown */}
                                  {item.warehouseStocks && Object.keys(item.warehouseStocks).length > 0 && (
                                    <div className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                                      {(() => {
                                        const entries = Object.entries(item.warehouseStocks || {});
                                        const first = entries.slice(0, 2).map(([w, q]) => `${w.split(' - ')[0] || w}: ${q}`);
                                        const more = entries.length > 2 ? ` +${entries.length - 2} lainnya` : '';
                                        return first.join(' • ') + more;
                                      })()}
                                    </div>
                                  )}
                                </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <span className="font-medium leading-5">{item.location}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex whitespace-nowrap px-2 py-1 rounded-full text-[10px] font-bold border ${
                          stockState.catalogStatus === 'tersedia' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : stockState.catalogStatus === 'service'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : stockState.catalogStatus === 'kosong'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {stockState.catalogStatus === 'tersedia' ? 'Ready Stock' : stockState.catalogStatus === 'kosong' ? 'Kosong' : stockState.catalogStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex min-w-[144px] items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRestock(item)}
                            className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer font-bold text-[11px] inline-flex shrink-0 items-center gap-1 border border-emerald-200"
                            title="Tambah Stok Cepat"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Stok</span>
                          </button>
                          <button
                            onClick={() => onPrintBarcode(item)}
                            className="p-1.5 shrink-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Barcode / QR Label"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditProduct(item)}
                            className="p-1.5 shrink-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(item.id)}
                            className="p-1.5 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {paginatedItems.length} dari {filteredItems.length} produk
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-50"
              >
                Sebelumnya
              </button>
              <span className="font-bold text-slate-700">Halaman {currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedItems.map((item) => {
            const isLow = item.quantity <= item.minStock;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:scale-105 transform transition-transform duration-300">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                    {isLow && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Stok Kritis</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-blue-600 cursor-pointer" onClick={() => onSelectItem(item)}>
                      {item.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      SKU: {item.sku} • {item.brand}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Harga Jual</div>
                      <div className="font-black text-emerald-700 text-sm">
                        {formatCurrency(item.sellPrice || item.price)}
                      </div>
                    </div>
                    <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Stok Siap</div>
                            <div className="font-black text-slate-900 text-sm">
                              {getInventoryStockState(item).readyQuantity} {item.unit}
                            </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenRestock(item)}
                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restock</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPrintBarcode(item)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Cetak Label"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditProduct(item)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Quick Restock / Penyesuaian Stok Cepat */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-4">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shadow-xs ${
                  restockDirection === 'in' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black font-heading text-slate-900">
                      PENYESUAIAN STOK CEPAT
                    </h3>
                    <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-md border ${
                      restockDirection === 'in'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {restockDirection === 'in' ? '+ Tambah Stok' : '- Kurang Stok'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Perbarui stok barang secara instan tanpa perlu form panjang
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseRestock}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmRestock} className="p-5 sm:p-6 space-y-4">
              
              {/* Product Info Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {restockModalItem.imageUrl ? (
                  <img
                    src={restockModalItem.imageUrl}
                    alt={restockModalItem.name}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {restockModalItem.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {restockModalItem.sku} • Rak: {restockModalItem.location || 'RAK-01'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Stok Saat Ini</div>
                  <div className="text-sm font-black text-slate-900">
                    {getInventoryStockState(restockModalItem as any).readyQuantity} {restockModalItem.unit}
                  </div>
                </div>
              </div>

              {/* Direction Selector (Masuk / Keluar) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Jenis Penyesuaian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockDirection('in')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      restockDirection === 'in'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Barang Masuk / Tambah (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestockDirection('out')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      restockDirection === 'out'
                        ? 'bg-amber-50 border-amber-600 text-amber-700 ring-1 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Barang Keluar / Kurangi (-)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Stepper & Preset Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Jumlah Satuan ({restockModalItem.unit || 'Unit'})
                </label>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockQty(Math.max(1, restockQty - 1))}
                    className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-11 px-3 text-center text-lg font-black text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setRestockQty(restockQty + 1)}
                    className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Preset Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Preset Cepat:</span>
                  {[1, 5, 10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockQty(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        restockQty === num
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {num} {restockModalItem.unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warehouse Destination */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gudang Alokasi</span>
                </label>
                <select
                  value={restockWarehouse}
                  onChange={(e) => setRestockWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(settings?.warehouses || ['Gudang Utama Jakarta', 'Gudang Transit', 'Gudang Sparepart']).map((wh) => (
                    <option key={wh} value={wh}>
                      {wh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Restock penerimaan supplier, koreksi fisik, dsb."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Calculation Preview */}
              {(() => {
                const currentReady = getInventoryStockState(restockModalItem as any).readyQuantity;
                const delta = restockDirection === 'in' ? restockQty : -restockQty;
                const finalQty = Math.max(0, currentReady + delta);

                return (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Stok Saat Ini: </span>
                      <strong className="text-slate-800">{currentReady} {restockModalItem.unit}</strong>
                      <span className="mx-1.5 text-slate-300">→</span>
                      <span className={restockDirection === 'in' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {restockDirection === 'in' ? `+${restockQty}` : `-${restockQty}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Stok Akhir: </span>
                      <strong className="text-blue-700 font-black text-sm">
                        {finalQty} {restockModalItem.unit}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseRestock}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                    restockDirection === 'in'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Simpan {restockDirection === 'in' ? `+${restockQty}` : `-${restockQty}`} Stok Sekarang
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
