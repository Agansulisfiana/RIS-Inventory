import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  Clock, 
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  ScanLine
} from 'lucide-react';
import { InventoryItem, User, StockLocationStatus, ItemCondition, WarehouseSettings } from '../../types';
import { storageService } from '../../services/storage';
import { exportService } from '../../services/exportService';
import { BarcodePrintModal } from './BarcodePrintModal';
import { getInventoryStockState } from '../../utils/inventoryStock';

interface InventoryTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onRefreshData: () => void;
  onOpenScanner: (mode?: 'lookup' | 'inbound' | 'outbound' | 'demo_loan' | 'demo_return') => void;
  editingStatusItem: InventoryItem | null;
  onClearEditingStatusItem: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  currentUser,
  settings,
  onRefreshData,
  onOpenScanner,
  editingStatusItem,
  onClearEditingStatusItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | StockLocationStatus>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [printModalItem, setPrintModalItem] = useState<InventoryItem | null>(null);

  // Status & Notes Live Edit Modal
  const [liveStatusModalItem, setLiveStatusModalItem] = useState<InventoryItem | null>(editingStatusItem);
  const [tempStatus, setTempStatus] = useState<StockLocationStatus>('in_warehouse');
  const [tempCondition, setTempCondition] = useState<ItemCondition>('bagus');
  const [tempNotes, setTempNotes] = useState('');

  // Peminjaman Modal
  const [loanModalItem, setLoanModalItem] = useState<InventoryItem | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [borrowerDept, setBorrowerDept] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  // Retur Modal
  const [returnModalItem, setReturnModalItem] = useState<InventoryItem | null>(null);
  const [returnCondition, setReturnCondition] = useState<ItemCondition>('bagus');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnLocation, setReturnLocation] = useState('');

  // React to prop change
  React.useEffect(() => {
    if (editingStatusItem) {
      setLiveStatusModalItem(editingStatusItem);
      setTempStatus(editingStatusItem.status);
      setTempCondition(editingStatusItem.condition);
      setTempNotes(editingStatusItem.notes);
    }
  }, [editingStatusItem]);

  // Form State for Add / Edit Item
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: '',
    barcode: '',
    name: '',
    category: 'Elektronik & Jaringan',
    brand: '',
    quantity: 1,
    minStock: 3,
    unit: 'Unit',
    price: 100000,
    location: 'Rak A-01',
    status: 'in_warehouse',
    condition: 'baru',
    notes: 'Stok tersedia di gudang'
  });

  const categories = settings?.categories || [];

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.demoLoanInfo?.borrowerName && item.demoLoanInfo.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesLowStock = !showLowStockOnly || (item.status === 'in_warehouse' && getInventoryStockState(item as any).readyQuantity <= item.minStock);

    return matchesSearch && matchesCategory && matchesStatus && matchesLowStock;
  });

  const handleOpenAdd = () => {
    const randomSku = `GDG-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const randomBarcode = `899${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormData({
      id: `item-${Date.now()}`,
      sku: randomSku,
      barcode: randomBarcode,
      name: '',
      category: categories.length > 0 ? categories[0] : 'Lainnya',
      brand: '',
      quantity: 5,
      minStock: 2,
      unit: 'Unit',
      price: 500000,
      location: 'Rak A-01',
      status: 'in_warehouse',
      condition: 'baru',
      notes: 'Stok masuk baru siap dipasarkan'
    });
    setItemToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setFormData({ ...item });
    setIsAddEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.barcode) return;

    const finalItem: InventoryItem = {
      id: itemToEdit ? itemToEdit.id : `item-${Date.now()}`,
      sku: formData.sku || 'SKU-000',
      serialNumber: formData.serialNumber || formData.barcode || `SN-${Date.now().toString().slice(-6)}`,
      barcode: formData.barcode || '00000000',
      name: formData.name || '',
      category: formData.category || 'Lainnya',
      brand: formData.brand || '-',
      quantity: Number(formData.quantity) || 0,
      minStock: Number(formData.minStock) || 1,
      unit: formData.unit || 'Unit',
      price: Number(formData.price) || 0,
      costPrice: Number(formData.price) || 0,
      sellPrice: Number(formData.price) || 0,
      location: formData.location || 'Gudang Utama',
      status: formData.status || 'in_warehouse',
      condition: formData.condition || 'baru',
      notes: formData.notes || '',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name,
      demoLoanInfo: itemToEdit?.demoLoanInfo
    };

    storageService.saveItem(finalItem, currentUser);
    setIsAddEditModalOpen(false);
    onRefreshData();
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (currentUser.role === 'staff') {
      alert('Staf gudang tidak memiliki izin menghapus SKU produk. Harap hubungi Administrator.');
      return;
    }
    if (confirm(`Yakin ingin menghapus produk "${item.name}" (SKU: ${item.sku})?`)) {
      storageService.deleteItem(item.id, currentUser);
      onRefreshData();
    }
  };

  // Save Live Status & Notes
  const handleSaveLiveStatus = () => {
    if (!liveStatusModalItem) return;
    storageService.updateItemStatusAndNotes(
      liveStatusModalItem.id,
      tempStatus,
      tempNotes,
      tempCondition,
      currentUser
    );
    setLiveStatusModalItem(null);
    onClearEditingStatusItem();
    onRefreshData();
  };

  // Submit Peminjaman Demo
  const handleLoanSubmit = () => {
    if (!loanModalItem || !borrowerName) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    storageService.loanDemoUnit(
      loanModalItem.id,
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
    setLoanModalItem(null);
    setBorrowerName('');
    setBorrowerContact('');
    setLoanPurpose('');
    setLoanNotes('');
    onRefreshData();
  };

  // Submit Retur Demo
  const handleReturnSubmit = () => {
    if (!returnModalItem) return;
    storageService.returnDemoUnitToWarehouse(
      returnModalItem.id,
      {
        condition: returnCondition,
        rackLocation: returnLocation || returnModalItem.location,
        returnNotes: returnNotes || 'Unit kembali lengkap dan siap pakai'
      },
      currentUser
    );
    setReturnModalItem(null);
    setReturnNotes('');
    onRefreshData();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Katalog & Manajemen Stok Inventaris
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola data master barang, posisi rak, keterangan status real-time, dan batas minimum stok
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportService.exportInventoryToExcel(items, settings)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor ke Excel format XLSX"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => exportService.exportInventoryToPDF(items, settings)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor ke PDF untuk Dokumen Resmi Audit"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Export PDF
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, Nama, Barcode, Rak..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="ALL">Semua Kategori ({items.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | StockLocationStatus)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="ALL">Semua Status Lokasi</option>
              <option value="in_warehouse">Di Gudang Saja</option>
              <option value="demo_loaned">Sedang Dipinjam (Demo Unit)</option>
              <option value="repair">Dalam Perbaikan</option>
            </select>
          </div>

          {/* Low Stock Toggle Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                showLowStockOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hanya Stok Menipis ({items.filter(i => i.status === 'in_warehouse' && getInventoryStockState(i as any).readyQuantity <= i.minStock).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table of Inventory */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Produk & SKU</th>
                <th className="py-3 px-4">Kategori & Brand</th>
                <th className="py-3 px-4 text-center">Stok / Min</th>
                <th className="py-3 px-4">Nilai Aset</th>
                <th className="py-3 px-4">Posisi & Lokasi</th>
                <th className="py-3 px-4">Status & Keterangan Real-Time</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const st = getInventoryStockState(item as any);
                  const isLow = item.status === 'in_warehouse' && st.readyQuantity <= item.minStock;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/75 transition-colors ${isLow ? 'bg-amber-50/30' : ''}`}>
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 shrink-0 mt-0.5 text-slate-700">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{item.name}</div>
                            <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">{item.sku}</span>
                              <span className="text-slate-300">|</span>
                              <span>{item.barcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{item.category}</div>
                        <div className="text-slate-400 text-[11px]">{item.brand}</div>
                      </td>

                      {/* Stock Quantity vs Min Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                            isLow 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'text-slate-900'
                          }`}>
                            {st.readyQuantity} ready • {st.demoQuantity} demo
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Min: {item.minStock} {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Asset Price */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-800">{formatCurrency(item.price)}</div>
                        <div className="text-[10px] text-slate-400">
                          Total: {formatCurrency(st.readyQuantity * item.price)}
                        </div>
                      </td>

                      {/* Location Rack */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">{item.location}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase mt-0.5 block">Kondisi: {item.condition}</span>
                      </td>

                      {/* Status & Real-Time Editable Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.status === 'in_warehouse' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'demo_loaned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status === 'in_warehouse' ? 'Di Gudang' :
                               item.status === 'demo_loaned' ? 'Demo Dipinjam' : 'Perbaikan'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLiveStatusModalItem(item);
                                setTempStatus(item.status);
                                setTempCondition(item.condition);
                                setTempNotes(item.notes);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-700 underline font-semibold cursor-pointer"
                            >
                              Ubah Status & Keterangan
                            </button>
                          </div>

                          {/* Real-time editable notes preview */}
                          <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                            {item.notes || 'Belum ada catatan status.'}
                          </p>

                          {item.status === 'demo_loaned' && item.demoLoanInfo && (
                            <div className="text-[10px] text-blue-800 font-semibold">
                              Peminjam: {item.demoLoanInfo.borrowerName} (Batas: {item.demoLoanInfo.expectedReturnDate.split('T')[0]})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If demo unit on loan, give 1-click Return */}
                          {item.status === 'demo_loaned' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReturnModalItem(item);
                                setReturnLocation(item.location);
                                setReturnCondition('bagus');
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Kembalikan Unit ke Gudang (Retur Real-Time)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setLoanModalItem(item);
                                setBorrowerName('');
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                              title="Pinjamkan sebagai Demo Unit"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Barcode Label */}
                          <button
                            type="button"
                            onClick={() => setPrintModalItem(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Label Barcode Fisik"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit Item Info */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Produk"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Item (Admin only) */}
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 bg-slate-100 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada barang inventaris yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: Real-Time Status & Notes Editor --- */}
      {liveStatusModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Update Keterangan & Status Real-Time</h3>
                  <p className="text-xs text-slate-500">{liveStatusModalItem.name} ({liveStatusModalItem.sku})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setLiveStatusModalItem(null);
                  onClearEditingStatusItem();
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Status Posisi Inventaris:</label>
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value as StockLocationStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in_warehouse">Di Gudang (Tersedia)</option>
                    <option value="demo_loaned">Sedang Dipinjam (Demo Unit)</option>
                    <option value="repair">Dalam Perbaikan / Servis</option>
                    <option value="transit">Dalam Perjalanan (Transit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kondisi Fisik:</label>
                  <select
                    value={tempCondition}
                    onChange={(e) => setTempCondition(e.target.value as ItemCondition)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baru">Baru</option>
                    <option value="bagus">Bagus / Normal</option>
                    <option value="perlu_servis">Perlu Servis</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Keterangan & Catatan Monitoring Real-Time:*
                </label>
                <textarea
                  rows={4}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Tuliskan keterangan detail posisi barang, PIC yang memegang, kondisi baterai, atau alasan pemindahan rak..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-[11px] text-blue-900">
                ℹ️ Setiap pembaruan status dan keterangan akan langsung tercatat dalam <strong>Riwayat Log Audit Staf</strong> secara real-time.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setLiveStatusModalItem(null);
                  onClearEditingStatusItem();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveLiveStatus}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Pembaruan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Add / Edit Product Master Data --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <form onSubmit={handleSaveItem} className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto text-slate-800">
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {itemToEdit ? 'Edit Data Produk Inventaris' : 'Tambah Produk Baru ke Database Gudang'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">SKU Produk:*</label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Nomor Barcode Fisik:*</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Nama Barang Lengkap:*</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Cisco Catalyst 9300 48-Port Switch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kategori:</label>
                  <select
                    value={formData.category || (categories.length > 0 ? categories[0] : 'Lainnya')}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Brand / Merk:</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Contoh: Cisco / Honeywell"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Satuan (Unit):</label>
                  <input
                    type="text"
                    value={formData.unit || 'Unit'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Unit / Pcs / Box / Roll"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Jumlah Stok Awal:</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Batas Minimum (Alert Restock):</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock || 2}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Nilai Aset / Harga Satuan (IDR):</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Lokasi Rak / Blok Gudang:</label>
                  <select
                    value={formData.location || (settings?.rackLocations && settings.rackLocations.length > 0 ? settings.rackLocations[0] : '')}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {(settings?.rackLocations || []).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kondisi Awal:</label>
                  <select
                    value={formData.condition || 'baru'}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baru">Baru</option>
                    <option value="bagus">Bagus</option>
                    <option value="perlu_servis">Perlu Servis</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Keterangan / Catatan Inventaris:</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan spesifikasi khusus atau aksesoris pelengkap..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL 3: Peminjaman Demo Unit --- */}
      {loanModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Form Peminjaman Demo Unit</h3>
                  <p className="text-xs text-slate-500">{loanModalItem.name} ({loanModalItem.sku})</p>
                </div>
              </div>
              <button onClick={() => setLoanModalItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Nama Peminjam (Sales / PIC):*</label>
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
                    placeholder="Divisi Enterprise Sales"
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
                <label className="text-slate-700 block mb-1 font-semibold">Tujuan Demo / Nama Klien:</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="POC Presentasi Smart Office di PT Telkom"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Catatan Kelengkapan Unit:</label>
                <textarea
                  rows={2}
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Termasuk tas carrier, adaptor original, 2 kabel HDMI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setLoanModalItem(null)}
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
                Konfirmasi Peminjaman Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Retur Demo Unit ke Gudang --- */}
      {returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Retur Demo Unit ke Gudang</h3>
                  <p className="text-xs text-slate-500">{returnModalItem.name}</p>
                </div>
              </div>
              <button onClick={() => setReturnModalItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Peminjam: <strong className="text-blue-700">{returnModalItem.demoLoanInfo?.borrowerName}</strong></div>
                <div className="text-[11px] text-slate-500">Tujuan: {returnModalItem.demoLoanInfo?.purpose}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kondisi Saat Kembali:</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as ItemCondition)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bagus">Bagus & Lengkap</option>
                    <option value="baru">Seperti Baru</option>
                    <option value="perlu_servis">Perlu Servis / Cek</option>
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
                <label className="text-slate-700 block mb-1 font-semibold">Catatan Hasil Pengecekan Fisik:</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Kondisi layar mulus, semua tombol dan kabel lengkap..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReturnModalItem(null)}
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

      {/* --- MODAL 5: Barcode Physical Label Print --- */}
      <BarcodePrintModal
        item={printModalItem}
        isOpen={!!printModalItem}
        onClose={() => setPrintModalItem(null)}
        settings={settings}
      />
    </div>
  );
};
