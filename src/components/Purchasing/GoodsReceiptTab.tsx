import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  Plus, 
  Search, 
  FileText, 
  Truck, 
  Calendar, 
  Building2, 
  Package, 
  CheckCircle2, 
  X, 
  Check, 
  Trash2,
  DollarSign,
  Barcode
} from 'lucide-react';
import { GoodsReceipt, InventoryItem, User, WarehouseSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { SerialNumberInputManager } from '../Common/SerialNumberInputManager';

interface GoodsReceiptTabProps {
  goodsReceipts: GoodsReceipt[];
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onCreateGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id'>) => void;
}

export const GoodsReceiptTab: React.FC<GoodsReceiptTabProps> = ({
  goodsReceipts,
  items,
  currentUser,
  settings,
  onCreateGoodsReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState<GoodsReceipt | null>(null);

  // Form State
  const [receiptNumber, setReceiptNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouseLocation, setWarehouseLocation] = useState('Gudang Utama Jakarta - Rak A01');
  const [notes, setNotes] = useState('');
  
  // Received Items Cart
  const [receiptCart, setReceiptCart] = useState<{
    itemId: string;
    name: string;
    sku: string;
    serialNumber?: string;
    serialNumbers?: string[];
    quantityReceived: number;
    unitCost: number;
    totalCost: number;
  }[]>([]);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [receiveQty, setReceiveQty] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isSnTracking, setIsSnTracking] = useState<boolean>(false);
  const [receiptItemSns, setReceiptItemSns] = useState<string[]>([]);

  const filteredReceipts = goodsReceipts.filter(r => 
    r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.poNumber && r.poNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalValueReceived = goodsReceipts.reduce((acc, curr) => acc + curr.totalValue, 0);

  const handleOpenNewModal = () => {
    const num = `GR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setReceiptNumber(num);
    setPoNumber(`PO-RIS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setSupplierName('');
    setNotes('');
    setReceiptCart([]);
    setSelectedItemId('');
    setReceiveQty(5);
    setUnitCost(0);
    setIsSnTracking(false);
    setReceiptItemSns([]);
    setIsModalOpen(true);
  };

  const handleSelectItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const it = items.find(i => i.id === itemId);
    if (it) {
      setUnitCost(it.costPrice || it.price || 0);
      const isUnique = it.snTrackingType === 'unique_per_unit' || 
                       (it.category && it.category.toLowerCase().includes('printer')) ||
                       (Array.isArray(it.serialNumbers) && it.serialNumbers.length > 0) ||
                       (it.serialNumber && it.serialNumber !== '-' && it.serialNumber !== 'NON-SN');
      setIsSnTracking(Boolean(isUnique));
      setReceiptItemSns(Array(receiveQty).fill(''));
    } else {
      setIsSnTracking(false);
      setReceiptItemSns([]);
    }
  };

  const handleReceiveQtyChange = (val: number) => {
    const qty = Math.max(1, val);
    setReceiveQty(qty);
    setReceiptItemSns(prev => {
      const next = [...prev];
      while (next.length < qty) next.push('');
      return next.slice(0, qty);
    });
  };

  const handleAddItemToReceipt = () => {
    if (!selectedItemId) return;
    const it = items.find(i => i.id === selectedItemId);
    if (!it) return;

    const cleanSns = isSnTracking ? receiptItemSns.map(s => s.trim()).filter(Boolean) : [];
    if (isSnTracking && cleanSns.length < receiveQty) {
      if (!confirm(`Perhatian: Baru ${cleanSns.length} dari ${receiveQty} Serial Number yang diisi. Apakah ingin tetap menambahkan item ini?`)) {
        return;
      }
    }

    setReceiptCart([
      ...receiptCart,
      {
        itemId: it.id,
        name: it.name,
        sku: it.sku,
        serialNumber: cleanSns[0] || it.serialNumber,
        serialNumbers: cleanSns.length > 0 ? cleanSns : undefined,
        quantityReceived: receiveQty,
        unitCost,
        totalCost: receiveQty * unitCost
      }
    ]);

    setSelectedItemId('');
    setReceiveQty(5);
    setUnitCost(0);
    setIsSnTracking(false);
    setReceiptItemSns([]);
  };

  const handleRemoveFromReceipt = (idx: number) => {
    setReceiptCart(receiptCart.filter((_, i) => i !== idx));
  };

  const totalCostValue = receiptCart.reduce((acc, curr) => acc + curr.totalCost, 0);

  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Nama supplier wajib diisi!');
      return;
    }
    if (receiptCart.length === 0) {
      alert('Pilih minimal 1 produk yang diterima!');
      return;
    }

    onCreateGoodsReceipt({
      receiptNumber: receiptNumber || `GR-${Date.now().toString().slice(-6)}`,
      poNumber: poNumber.trim(),
      supplierName: supplierName.trim(),
      receivedDate: new Date(receivedDate).toISOString(),
      warehouseLocation,
      receiverPic: currentUser.name,
      items: receiptCart,
      totalValue: totalCostValue,
      status: 'Selesai',
      notes: notes.trim()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>PENERIMAAN BARANG SUPPLIER & PURCHASING</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            GOODS RECEIPT (PO MASUK)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Catat barang masuk dari prinsipal/supplier resmi, verifikasi kuantitas, dan tambah stok otomatis
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Penerimaan Barang Masuk</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Nilai Pembelian Masuk</span>
          <div className="text-2xl font-black font-heading text-indigo-600">
            {formatCurrency(totalValueReceived)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Dari {goodsReceipts.length} batch penerimaan</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Verifikasi</span>
          <div className="text-2xl font-black font-heading text-emerald-600">
            100% Selesai
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">Stok langsung bertambah ke rak</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">PIC Penerima Gudang</span>
          <div className="text-2xl font-black font-heading text-slate-900">
            {currentUser.name}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Petugas Logistik Resmi</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tanda terima GR, nomor PO, nama supplier, atau item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Goods Receipt Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Tanda Terima & PO</th>
                <th className="py-3.5 px-4">Supplier / Prinsipal</th>
                <th className="py-3.5 px-4">Item Diterima</th>
                <th className="py-3.5 px-4">Total Nilai Pembelian</th>
                <th className="py-3.5 px-4">Lokasi Penempatan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Receipt Number & Date */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-indigo-700 text-xs">{receipt.receiptNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        PO: {receipt.poNumber || '-'} • {new Date(receipt.receivedDate).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{receipt.supplierName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Penerima: {receipt.receiverPic}</div>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {receipt.items.map((it, idx) => (
                        <div key={idx} className="text-[11px] flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                            +{it.quantityReceived}
                          </span>
                          <span className="truncate max-w-[200px]">{it.name}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Total Value */}
                  <td className="py-3.5 px-4 font-black text-slate-900 text-xs">
                    {formatCurrency(receipt.totalValue)}
                  </td>

                  {/* Warehouse Location */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {receipt.warehouseLocation}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {receipt.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceiptDetail(receipt)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Detail GR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Goods Receipt */}
      {selectedReceiptDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">BUKTI PENERIMAAN BARANG (GR)</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Supplier:</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">{selectedReceiptDetail.supplierName}</div>
                  <div className="text-slate-500">PO Ref: {selectedReceiptDetail.poNumber || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-indigo-600 text-base">{selectedReceiptDetail.receiptNumber}</div>
                  <div className="text-slate-500">Tanggal: {new Date(selectedReceiptDetail.receivedDate).toLocaleDateString('id-ID')}</div>
                  <div className="text-slate-500">Penerima: {selectedReceiptDetail.receiverPic}</div>
                </div>
              </div>

              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5 text-center">Jumlah Diterima</th>
                    <th className="p-2.5 text-right">Harga Beli</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReceiptDetail.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800">{it.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SKU: {it.sku}</div>
                        {it.serialNumbers && it.serialNumbers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {it.serialNumbers.map((sn, sIdx) => (
                              <span key={sIdx} className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                                {sn}
                              </span>
                            ))}
                          </div>
                        )}
                        {!it.serialNumbers && it.serialNumber && it.serialNumber !== '-' && it.serialNumber !== 'NON-SN' && (
                          <div className="mt-1">
                            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                              SN: {it.serialNumber}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-black text-indigo-700">+{it.quantityReceived}</td>
                      <td className="p-2.5 text-right">{formatCurrency(it.unitCost)}</td>
                      <td className="p-2.5 text-right font-black">{formatCurrency(it.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-2 font-black text-sm">
                <span>Total Nilai Pengadaan:</span>
                <span className="text-indigo-700">{formatCurrency(selectedReceiptDetail.totalValue)}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Penerimaan Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">PENERIMAAN BARANG SUPPLIER (GOODS RECEIPT)</h3>
                  <p className="text-xs text-slate-500 font-medium">Tambah stok otomatis ke rak inventory gudang</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Supplier / Vendor <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Zebra Technologies / IDP Corp"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor PO Pembelian</label>
                  <input
                    type="text"
                    placeholder="PO-RIS-2024-xxx"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Item Picker */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Pilih Item Master yang Diterima</span>
                </div>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pilih Produk</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleSelectItemChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Produk Master --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name} (Stok Saat Ini: {it.quantity} {it.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Jumlah Masuk</label>
                      <input
                        type="number"
                        min="1"
                        value={receiveQty}
                        onChange={(e) => handleReceiveQtyChange(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Harga Beli Satuan (IDR)</label>
                      <input
                        type="number"
                        min="0"
                        value={unitCost}
                        onChange={(e) => setUnitCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {selectedItemId && (
                    <div className="pt-2 border-t border-slate-200/70">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSnTracking}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsSnTracking(checked);
                              if (checked && receiptItemSns.length !== receiveQty) {
                                setReceiptItemSns(Array(receiveQty).fill(''));
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Input Serial Number (SN) per Unit Produk</span>
                          </span>
                        </label>
                      </div>

                      {isSnTracking && (
                        <div className="mt-2">
                          {(() => {
                            const curItem = items.find(i => i.id === selectedItemId);
                            return (
                              <SerialNumberInputManager
                                quantity={receiveQty}
                                serialNumbers={receiptItemSns}
                                onChangeSerialNumbers={setReceiptItemSns}
                                productName={curItem?.name}
                                category={curItem?.category}
                                brand={curItem?.brand}
                                sku={curItem?.sku}
                                itemId={curItem?.id}
                                existingItems={items}
                                compact={true}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddItemToReceipt}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Tambahkan Item ke Daftar Penerimaan
                  </button>
                </div>

                {receiptCart.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">Produk</th>
                          <th className="p-2.5 text-center">Qty Masuk</th>
                          <th className="p-2.5 text-right">Harga Modal</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                          <th className="p-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receiptCart.map((c, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">SKU: {c.sku}</div>
                              {c.serialNumbers && c.serialNumbers.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    {c.serialNumbers.length} SN:
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {c.serialNumbers[0]} {c.serialNumbers.length > 1 ? `s/d ${c.serialNumbers[c.serialNumbers.length - 1]}` : ''}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-bold text-indigo-700">+{c.quantityReceived}</td>
                            <td className="p-2.5 text-right">{formatCurrency(c.unitCost)}</td>
                            <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(c.totalCost)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromReceipt(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Penerimaan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kondisi kemasan, nomor container, kelengkapan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Masukkan ke Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
