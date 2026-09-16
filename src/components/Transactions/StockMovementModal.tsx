import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
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
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedItem(null);
      setFromLocation('');
      setToLocation('');
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
    if (!selectedItem || !fromLocation || !toLocation || quantity <= 0) {
      alert('Please fill all required fields: Unit, From Location, To Location, Quantity');
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
      toLocation,
      quantity,
      pic: currentUser.name,
      status: 'Selesai',
      notes,
    };
    onSave(newTransaction);
    onClose();
  };

  if (!isOpen) return null;

  const availableWarehouses = Array.from(new Set([
    ...(settings.warehouses || []),
    ...items.map(item => item.location),
  ])).filter(loc => loc);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Tambah Pergerakan Stok Baru</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Unit <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari unit berdasarkan nama atau serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              {searchQuery && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setFromLocation(item.location || '');
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                    >
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-slate-500 text-xs">SN: {item.serialNumber} | Lokasi: {item.location} | Stok: {item.quantity} {item.unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedItem && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Unit Terpilih: <span className="font-bold">{selectedItem.name}</span> (SN: {selectedItem.serialNumber}) <br />
                Lokasi Saat Ini: <span className="font-bold">{selectedItem.location || 'N/A'}</span>
              </div>
            )}
            {!selectedItem && searchQuery && filteredItems.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">Tidak ada unit yang ditemukan.</p>
            )}
          </div>

          {/* From Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dari Lokasi <span className="text-rose-500">*</span></label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!selectedItem}
            >
              <option value="">Pilih Lokasi Asal</option>
              {availableWarehouses.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* To Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ke Lokasi <span className="text-rose-500">*</span></label>
            <select
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Lokasi Tujuan</option>
              {availableWarehouses.filter(loc => loc !== fromLocation).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah <span className="text-rose-500">*</span></label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Simpan Pergerakan
          </button>
        </div>
      </div>
    </div>
  );
};
