import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Building2, Layers, PlusCircle, Info } from 'lucide-react';
import { InventoryItem, StockTransaction, User, WarehouseSettings } from '../../types';
import { storageService } from '../../services/storage';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<StockTransaction, 'id'>) => void;
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  items,
  currentUser,
  settings,
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [customToLocation, setCustomToLocation] = useState<string>('');
  const [isCustomTo, setIsCustomTo] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedItem(null);
      setFromLocation('');
      setToLocation('');
      setCustomToLocation('');
      setIsCustomTo(false);
      setQuantity(1);
      setNotes('');
      setSearchQuery('');
      setFilteredItems(items);
    }
  }, [isOpen, items]);

  useEffect(() => {
    setFilteredItems(
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, items]);

  const handleSave = () => {
    const finalToLocation = isCustomTo ? customToLocation.trim() : toLocation.trim();

    if (!selectedItem || !fromLocation || !finalToLocation || quantity <= 0) {
      alert('Mohon lengkapi semua field: Unit, Dari Lokasi, Ke Lokasi, dan Jumlah.');
      return;
    }

    const newTransaction: Omit<StockTransaction, 'id'> = {
      transactionNumber: `SM-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      type: 'Transfer',
      itemId: selectedItem.id,
      itemSku: selectedItem.sku,
      serialNumber: selectedItem.serialNumber,
      itemName: selectedItem.name,
      fromLocation,
      toLocation: finalToLocation,
      quantity,
      unit: selectedItem.unit || 'Unit',
      pic: currentUser.name,
      status: 'Selesai',
      notes,
    };
    onSave(newTransaction);
    onClose();
  };

  if (!isOpen) return null;

  // Strictly get official locations from Settings (Pengaturan Gudang & Rak)
  const registeredWarehouses = (settings.warehouses || []).filter(Boolean);
  const registeredRacks = (settings.rackLocations || []).filter(Boolean);

  // For "From Location", ensure the selected item's current location is selectable
  const fromLocationOptions = Array.from(
    new Set([
      ...(selectedItem?.location ? [selectedItem.location] : []),
      ...registeredWarehouses,
      ...registeredRacks
    ])
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900">Tambah Pergerakan Stok Baru</h2>
            <p className="text-xs text-slate-500 mt-0.5">Catat mutasi / transfer pemindahan unit antar lokasi</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Unit Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Unit <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari unit berdasarkan nama atau serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              {searchQuery && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-20 divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setFromLocation(item.location || '');
                        setSearchQuery('');
                      }}
                      className="p-2.5 hover:bg-blue-50/70 cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded">SN: {item.serialNumber}</span>
                        <span>•</span>
                        <span>Lokasi: <strong className="text-slate-700">{item.location || 'Belum diatur'}</strong></span>
                        <span>•</span>
                        <span>Stok: <strong>{item.quantity} {item.unit}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedItem && (
              <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  Unit Terpilih: <strong className="font-bold">{selectedItem.name}</strong> (SN: {selectedItem.serialNumber}) <br />
                  Lokasi Asal Otomatis: <strong className="font-bold text-blue-700">{selectedItem.location || 'N/A'}</strong>
                </div>
              </div>
            )}
            {!selectedItem && searchQuery && filteredItems.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">Tidak ada unit yang cocok dengan pencarian.</p>
            )}
          </div>

          {/* From Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Dari Lokasi <span className="text-rose-500">*</span>
            </label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-100"
              disabled={!!selectedItem}
            >
              <option value="">Pilih Lokasi Asal</option>
              {fromLocationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* To Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ke Lokasi (Tujuan) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomTo(!isCustomTo);
                  if (!isCustomTo) {
                    setToLocation('__custom__');
                  } else {
                    setToLocation('');
                    setCustomToLocation('');
                  }
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                {isCustomTo ? 'Pilih dari List' : '+ Ketik Lokasi Baru'}
              </button>
            </div>

            {!isCustomTo ? (
              <select
                value={toLocation}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomTo(true);
                  } else {
                    setToLocation(e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="">-- Pilih Lokasi Tujuan dari List --</option>
                
                {/* 1. Gudang Terdaftar */}
                {registeredWarehouses.length > 0 && (
                  <optgroup label="🏢 Gudang Resmi (Pengaturan)">
                    {registeredWarehouses
                      .filter(loc => loc !== fromLocation)
                      .map(loc => (
                        <option key={`wh-${loc}`} value={loc}>
                          {loc}
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* 2. Rak Gudang */}
                {registeredRacks.length > 0 && (
                  <optgroup label="📦 Rak & Lokasi Penyimpanan (Pengaturan)">
                    {registeredRacks
                      .filter(loc => loc !== fromLocation)
                      .map(loc => (
                        <option key={`rack-${loc}`} value={loc}>
                          {loc}
                        </option>
                      ))}
                  </optgroup>
                )}

                <option value="__custom__">➕ Ketik Lokasi Baru Lainnya...</option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Ketik nama lokasi tujuan baru (contoh: Cabang Bandung / Rak D02)..."
                  value={customToLocation}
                  onChange={(e) => setCustomToLocation(e.target.value)}
                  autoFocus
                  className="w-full p-2.5 bg-white border-2 border-blue-400 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <p className="text-[10px] text-slate-500">
                  Ketik nama lokasi baru secara bebas jika belum tercantum di daftar.
                </p>
              </div>
            )}

            {/* Helper Explaining the List Origin */}
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Hanya Menampilkan Data Pengaturan:</strong> List di atas hanya memuat Gudang & Rak resmi yang terdaftar di menu Pengaturan. Gunakan <em>+ Ketik Lokasi Baru</em> bila perlu mengirim ke tujuan kustom.
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jumlah Unit <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pergerakan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Contoh: Pemindahan barang untuk kebutuhan display, relokasi rak, atau pengiriman cabang..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="p-4 px-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            Simpan Pergerakan
          </button>
        </div>
      </div>
    </div>
  );
};

