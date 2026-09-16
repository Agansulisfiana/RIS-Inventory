import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Barcode, 
  DollarSign, 
  Layers, 
  MapPin, 
  Tag, 
  Sparkles, 
  Check,
  AlertCircle
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  itemToEdit: InventoryItem | null;
  currentUser: User;
  settings: WarehouseSettings;
  onClose: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'> | InventoryItem) => void;
}

const CATEGORIES = [
  'Card Printer',
  'Consumables & Ribbon',
  'PVC Blank & Smart Card',
  'Cleaning Kit',
  'Spare Part & Print Head',
  'Lamination Film',
  'Aksesoris & Lanyard'
];

const UNITS = ['Unit', 'Roll', 'Box', 'Pcs', 'Set', 'Pack'];

const LOCATIONS = [
  'Gudang Jakarta - Rak A01',
  'Gudang Jakarta - Rak A02',
  'Gudang Jakarta - Rak A03',
  'Gudang Jakarta - Rak A04',
  'Gudang Jakarta - Rak B01',
  'Gudang Jakarta - Rak B02',
  'Gudang Jakarta - Rak B03',
  'Gudang Jakarta - Rak C01',
  'Gudang Jakarta - Rak C02',
  'Workshop Service Lab',
  'Showroom Display'
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  itemToEdit,
  currentUser,
  settings,
  onClose,
  onSave
}) => {
  const defaultCategory = settings?.categories?.[0] || CATEGORIES[0];
  const defaultLocation = settings?.rackLocations?.[0] || LOCATIONS[0];

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('Unit');
  const [quantity, setQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [location, setLocation] = useState(defaultLocation);
  const [status, setStatus] = useState<InventoryItem['status']>('tersedia');
  const [condition, setCondition] = useState<InventoryItem['condition']>('baru');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setSku(itemToEdit.sku || '');
      setSerialNumber(itemToEdit.serialNumber || '');
      setBarcode(itemToEdit.barcode || '');
      setCategory(itemToEdit.category || defaultCategory);
      setBrand(itemToEdit.brand || '');
      setUnit(itemToEdit.unit || 'Unit');
      setQuantity(itemToEdit.quantity || 0);
      setMinStock(itemToEdit.minStock || 5);
      setCostPrice(itemToEdit.costPrice || itemToEdit.price || 0);
      setSellPrice(itemToEdit.sellPrice || itemToEdit.price || 0);
      setLocation(itemToEdit.location || defaultLocation);
      setStatus(itemToEdit.status || 'tersedia');
      setCondition(itemToEdit.condition || 'baru');
      setNotes(itemToEdit.notes || '');
      setImageUrl(itemToEdit.imageUrl || '');
    } else {
      // Auto-generate fresh identifiers
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setName('');
      setSku(`PRD-${randomNum.toString().slice(-4)}`);
      setSerialNumber(`SN-${Date.now().toString().slice(-6)}`);
      setBarcode(`899${randomNum}`);
      setCategory(defaultCategory);
      setBrand('');
      setUnit('Unit');
      setQuantity(10);
      setMinStock(5);
      setCostPrice(0);
      setSellPrice(0);
      setLocation(defaultLocation);
      setStatus('tersedia');
      setCondition('baru');
      setNotes('');
      setImageUrl('https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAutoGenerateCodes = () => {
    const code = Math.floor(10000000 + Math.random() * 90000000);
    const prefix = category.includes('Ribbon') ? 'RBN' : category.includes('Card') ? 'CRD' : 'PRD';
    setSku(`${prefix}-${code.toString().slice(-5)}`);
    setBarcode(`899${code}`);
    setSerialNumber(`SN-${code.toString().slice(-6)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-5)}`,
      barcode: barcode.trim() || `899${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      brand: brand.trim() || 'PT. Reycom Integrated Solusi',
      assetCode: itemToEdit?.assetCode || `AST-${Date.now().toString().slice(-6)}`,
      unit,
      quantity: Number(quantity) || 0,
      minStock: Number(minStock) || 0,
      costPrice: Number(costPrice) || 0,
      price: Number(sellPrice) || Number(costPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      location,
      status,
      condition,
      pic: currentUser.name,
      notes: notes.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
      updatedBy: currentUser.name
    };

    if (itemToEdit) {
      onSave({
        ...itemToEdit,
        ...payload
      });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900 tracking-tight">
                {itemToEdit ? 'EDIT PRODUK & STOK' : 'TAMBAH PRODUK BARU'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {itemToEdit ? `Memperbarui data ${itemToEdit.name}` : 'Daftarkan master produk hardware, ribbon, kartu, atau sparepart'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Basic Info */}
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Informasi Produk</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IDP Smart-81 Industrial Retransfer Card Printer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kategori Produk</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {(settings?.categories || CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Brand / Pabrikan</label>
                <input
                  type="text"
                  placeholder="Contoh: IDP Corp Korea, HID Fargo, Zebra"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Codes & Identifiers */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5" />
                <span>Kode SKU & Barcode</span>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateCodes}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Otomatis</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">SKU / Kode Barang</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="IDP-SM81-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Barcode / EAN-13</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="899123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Serial Number (SN)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN001234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Stock Values */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Harga & Nilai Valuasi (IDR)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Harga Beli / Modal (IDR)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Rp {costPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Harga Jual ke Customer (IDR)</label>
                <input
                  type="number"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  Rp {sellPrice.toLocaleString('id-ID')} (Margin: Rp {(sellPrice - costPrice).toLocaleString('id-ID')})
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Quantities & Locations */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Kuantitas Stok & Lokasi Rak</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Kuantitas Stok</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Minimum Stok Alert</label>
                <input
                  type="number"
                  min="1"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold text-rose-600 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kondisi</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="baru">Baru (100% Segel)</option>
                  <option value="bagus">Bagus (Unit Siap)</option>
                  <option value="perlu_servis">Perlu Servis</option>
                  <option value="rusak">Rusak</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lokasi Rak / Gudang</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {(settings?.rackLocations || LOCATIONS).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Penempatan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="tersedia">Tersedia (Ready Stock)</option>
                  <option value="on_demo">On Demo (Dipinjam Customer)</option>
                  <option value="service">Service (Di Workshop)</option>
                  <option value="rusak">Rusak</option>
                  <option value="hilang">Hilang</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Photo URL & Notes */}
          <div className="pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">URL Foto Produk</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan / Deskripsi</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan spesifikasi, garansi, kelengkapan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Simpan Perubahan' : 'Daftarkan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
