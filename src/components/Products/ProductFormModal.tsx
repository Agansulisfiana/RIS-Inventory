import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertCircle,
  ImageUp,
  Boxes,
  ClipboardCopy,
  Hash,
  Copy,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings, SnTrackingType } from '../../types';
import { SerialNumberInputManager } from '../Common/SerialNumberInputManager';
import { storageService } from '../../services/storage';

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
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Serial Number Tracking Modes:
  // 'unique_per_unit': 1 SN per unit fisik (Printer, Scanner, Mesin)
  // 'shared_batch': 1 SN/Lot untuk seluruh unit produk (Ribbon, Kartu PVC, Consumables)
  // 'no_sn': Tanpa Serial Number (Komoditas, Aksesoris umum)
  const [snTrackingType, setSnTrackingType] = useState<SnTrackingType>('unique_per_unit');
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [batchNumber, setBatchNumber] = useState('');

  // Quick Tools State
  const [showSeqGenerator, setShowSeqGenerator] = useState(false);
  const [seqPrefix, setSeqPrefix] = useState('SN-');
  const [seqStart, setSeqStart] = useState<number>(1);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setSku(itemToEdit.sku || '');
      setSerialNumber(itemToEdit.serialNumber || '');
      setBarcode(itemToEdit.barcode || '');
      setCategory(itemToEdit.category || defaultCategory);
      setBrand(itemToEdit.brand || '');
      setUnit(itemToEdit.unit || 'Unit');
      const qty = itemToEdit.quantity || 1;
      setQuantity(qty);
      setMinStock(itemToEdit.minStock || 5);
      setCostPrice(itemToEdit.costPrice || itemToEdit.price || 0);
      setSellPrice(itemToEdit.sellPrice || itemToEdit.price || 0);
      setLocation(itemToEdit.location || defaultLocation);
      setStatus(itemToEdit.status || 'tersedia');
      setCondition(itemToEdit.condition || 'baru');
      setNotes(itemToEdit.notes || '');
      setImageUrl(itemToEdit.imageUrl || '');

      // Resolve tracking type
      let resolvedTracking: SnTrackingType = itemToEdit.snTrackingType || 'unique_per_unit';
      if (!itemToEdit.snTrackingType) {
        if (itemToEdit.category?.includes('Ribbon') || itemToEdit.category?.includes('Card') || itemToEdit.category?.includes('Cleaning') || itemToEdit.category?.includes('Film')) {
          resolvedTracking = 'shared_batch';
        } else if (itemToEdit.serialNumber === '-' || itemToEdit.serialNumber === 'NON-SN') {
          resolvedTracking = 'no_sn';
        } else {
          resolvedTracking = 'unique_per_unit';
        }
      }
      setSnTrackingType(resolvedTracking);
      setBatchNumber(itemToEdit.batchNumber || itemToEdit.serialNumber || '');

      // Populate serial numbers array
      if (Array.isArray(itemToEdit.serialNumbers) && itemToEdit.serialNumbers.length > 0) {
        const arr = [...itemToEdit.serialNumbers];
        while (arr.length < qty) arr.push('');
        setSerialNumbers(arr.slice(0, Math.max(qty, 1)));
      } else if (itemToEdit.serialNumber && itemToEdit.serialNumber !== '-' && itemToEdit.serialNumber !== 'NON-SN') {
        const arr = [itemToEdit.serialNumber];
        while (arr.length < qty) arr.push('');
        setSerialNumbers(arr.slice(0, Math.max(qty, 1)));
      } else {
        setSerialNumbers(Array(Math.max(qty, 1)).fill(''));
      }
    } else {
      // Auto-generate fresh identifiers
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const isConsumable = defaultCategory.includes('Ribbon') || defaultCategory.includes('Card') || defaultCategory.includes('Cleaning') || defaultCategory.includes('Film');
      const initialQty = 10;

      setName('');
      const pfx = isConsumable ? (defaultCategory.includes('Ribbon') ? 'RBN' : 'CRD') : 'PRD';
      const initialSku = `${pfx}-${randomNum.toString().slice(-4)}`;
      setSku(initialSku);
      setBarcode(`899${randomNum}`);
      setCategory(defaultCategory);
      setBrand('');
      setUnit('Unit');
      setQuantity(initialQty);
      setMinStock(5);
      setCostPrice(0);
      setSellPrice(0);
      setLocation(defaultLocation);
      setStatus('tersedia');
      setCondition('baru');
      setNotes('');
      setImageUrl('https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80');

      if (isConsumable) {
        setSnTrackingType('shared_batch');
        const batch = `LOT-${pfx}-${new Date().getFullYear()}-${randomNum.toString().slice(-4)}`;
        setBatchNumber(batch);
        setSerialNumber(batch);
        setSerialNumbers(Array(initialQty).fill(batch));
      } else {
        setSnTrackingType('unique_per_unit');
        const snPrefix = `SN-${randomNum.toString().slice(-4)}-`;
        setSeqPrefix(snPrefix);
        setSeqStart(1);
        const snList = Array.from({ length: initialQty }, (_, i) => `${snPrefix}${String(i + 1).padStart(3, '0')}`);
        setSerialNumbers(snList);
        setSerialNumber(snList[0]);
        setBatchNumber('');
      }
    }
  }, [itemToEdit, isOpen, defaultCategory, defaultLocation]);

  // Synchronize quantity changes with serialNumbers array
  const handleQuantityChange = (newVal: number) => {
    const val = Math.max(1, newVal);
    setQuantity(val);
    setSerialNumbers(prev => {
      const next = [...prev];
      if (next.length < val) {
        while (next.length < val) {
          next.push('');
        }
      } else if (next.length > val) {
        return next.slice(0, val);
      }
      return next;
    });
  };

  // Smart Category handler
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const isConsumable = newCat.includes('Ribbon') || newCat.includes('Card') || newCat.includes('Cleaning') || newCat.includes('Film');
    if (isConsumable && snTrackingType === 'unique_per_unit') {
      setSnTrackingType('shared_batch');
      if (!batchNumber) {
        const pfx = newCat.includes('Ribbon') ? 'RBN' : newCat.includes('Card') ? 'CRD' : 'LOT';
        const batch = `LOT-${pfx}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        setBatchNumber(batch);
        setSerialNumber(batch);
        setSerialNumbers(Array(quantity).fill(batch));
      }
    } else if (newCat.includes('Printer') && snTrackingType === 'shared_batch') {
      setSnTrackingType('unique_per_unit');
    }
  };

  // Check for duplicate serial numbers within list
  const duplicateSns = useMemo(() => {
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    serialNumbers.forEach(sn => {
      const trimmed = sn.trim().toLowerCase();
      if (trimmed) {
        if (seen.has(trimmed)) {
          duplicates.add(trimmed);
        } else {
          seen.add(trimmed);
        }
      }
    });
    return duplicates;
  }, [serialNumbers]);

  const handleSnChange = (idx: number, val: string) => {
    setSerialNumbers(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    if (idx === 0) {
      setSerialNumber(val);
    }
  };

  const handleApplySequential = () => {
    const generated: string[] = [];
    const padLength = quantity >= 100 ? 3 : (seqStart < 10 ? 3 : 2);
    for (let i = 0; i < quantity; i++) {
      const num = seqStart + i;
      generated.push(`${seqPrefix.trim()}${String(num).padStart(padLength, '0')}`);
    }
    setSerialNumbers(generated);
    if (generated.length > 0) {
      setSerialNumber(generated[0]);
    }
    setShowSeqGenerator(false);
  };

  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split(/[\r\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    if (lines.length > quantity) {
      setQuantity(lines.length);
      setSerialNumbers(lines);
    } else {
      setSerialNumbers(prev => {
        const next = [...prev];
        for (let i = 0; i < lines.length; i++) {
          next[i] = lines[i];
        }
        return next;
      });
    }
    if (lines[0]) {
      setSerialNumber(lines[0]);
    }
    setBulkPasteText('');
    setShowBulkPasteModal(false);
  };

  const handleCopySn = (sn: string, idx: number) => {
    if (!sn) return;
    navigator.clipboard.writeText(sn);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleAutoGenerateCodes = () => {
    const code = Math.floor(10000000 + Math.random() * 90000000);
    const isRibbon = category.includes('Ribbon');
    const isCard = category.includes('Card');
    const isPrinter = category.includes('Printer');
    const prefix = isRibbon ? 'RBN' : isCard ? 'CRD' : isPrinter ? 'PRT' : 'PRD';

    setSku(`${prefix}-${code.toString().slice(-5)}`);
    setBarcode(`899${code}`);

    if (snTrackingType === 'unique_per_unit') {
      const snPrefix = `SN-${prefix}${code.toString().slice(-3)}-`;
      setSeqPrefix(snPrefix);
      setSeqStart(1);
      const generated = Array.from({ length: quantity }, (_, i) => `${snPrefix}${String(i + 1).padStart(3, '0')}`);
      setSerialNumbers(generated);
      setSerialNumber(generated[0]);
    } else if (snTrackingType === 'shared_batch') {
      const batch = `LOT-${prefix}-${new Date().getFullYear()}-${code.toString().slice(-4)}`;
      setBatchNumber(batch);
      setSerialNumber(batch);
      setSerialNumbers(Array(quantity).fill(batch));
    } else {
      setSerialNumber('-');
      setSerialNumbers([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File yang dipilih harus berupa gambar produk.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }

    let finalSerial = serialNumber.trim();
    let finalSerialNumbers: string[] = [];

    if (snTrackingType === 'unique_per_unit') {
      finalSerialNumbers = Array.from({ length: quantity }, (_, idx) => {
        const val = serialNumbers[idx]?.trim();
        if (val) return val;
        return `${sku.trim() || 'SN'}-${String(idx + 1).padStart(3, '0')}`;
      });
      finalSerial = finalSerialNumbers[0] || `SN-${Date.now().toString().slice(-6)}`;
    } else if (snTrackingType === 'shared_batch') {
      const batch = batchNumber.trim() || serialNumber.trim() || `LOT-${Date.now().toString().slice(-6)}`;
      finalSerial = batch;
      finalSerialNumbers = Array(quantity).fill(batch);
    } else {
      finalSerial = '-';
      finalSerialNumbers = [];
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      serialNumber: finalSerial,
      snTrackingType,
      serialNumbers: finalSerialNumbers,
      batchNumber: snTrackingType === 'shared_batch' ? finalSerial : undefined,
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

          {/* Section 2: Codes & Serial Number Management */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5" />
                <span>Kode SKU, Barcode & Serial Number (SN)</span>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateCodes}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-Generate Semua Kode</span>
              </button>
            </div>

            {/* SKU & Barcode Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">SKU / Kode Barang <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="IDP-SM81-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Barcode / EAN-13 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="899123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Serial Number Tracking Mode Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>Sistem Pelacakan Serial Number (SN)</span>
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Pilih cara pelacakan untuk produk ini:
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Mode 1: Unique per unit */}
                <button
                  type="button"
                  onClick={() => setSnTrackingType('unique_per_unit')}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    snTrackingType === 'unique_per_unit'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>1 SN Unik Tiap Unit</span>
                    </span>
                    {snTrackingType === 'unique_per_unit' && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <p className={`text-[10px] line-clamp-2 ${snTrackingType === 'unique_per_unit' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Tiap unit punya SN sendiri (Printer, Scanner, Hardware).
                  </p>
                  <div className="mt-2 text-[10px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-md ${
                      snTrackingType === 'unique_per_unit'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {quantity} SN Terpisah
                    </span>
                  </div>
                </button>

                {/* Mode 2: Shared Batch / Lot */}
                <button
                  type="button"
                  onClick={() => {
                    setSnTrackingType('shared_batch');
                    if (!batchNumber) {
                      const pfx = category.includes('Ribbon') ? 'RBN' : category.includes('Card') ? 'CRD' : 'LOT';
                      const code = Math.floor(1000 + Math.random() * 9000);
                      const b = `LOT-${pfx}-${new Date().getFullYear()}-${code}`;
                      setBatchNumber(b);
                      setSerialNumber(b);
                      setSerialNumbers(Array(quantity).fill(b));
                    }
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    snTrackingType === 'shared_batch'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>1 SN / Lot Bersama</span>
                    </span>
                    {snTrackingType === 'shared_batch' && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <p className={`text-[10px] line-clamp-2 ${snTrackingType === 'shared_batch' ? 'text-purple-100' : 'text-slate-500'}`}>
                    1 nomor batch/lot untuk semua unit (Ribbon, Kartu PVC, Film).
                  </p>
                  <div className="mt-2 text-[10px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-md ${
                      snTrackingType === 'shared_batch'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      1 Lot untuk {quantity} {unit}
                    </span>
                  </div>
                </button>

                {/* Mode 3: No Serial Number */}
                <button
                  type="button"
                  onClick={() => {
                    setSnTrackingType('no_sn');
                    setSerialNumber('-');
                    setSerialNumbers([]);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    snTrackingType === 'no_sn'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tanpa Serial Number</span>
                    </span>
                    {snTrackingType === 'no_sn' && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <p className={`text-[10px] line-clamp-2 ${snTrackingType === 'no_sn' ? 'text-slate-200' : 'text-slate-500'}`}>
                    Non-SN / Komoditas umum (Kabel power, pembersih, aksesoris).
                  </p>
                  <div className="mt-2 text-[10px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-md ${
                      snTrackingType === 'no_sn'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Kontrol Stok Kuantitas
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* CONDITIONAL RENDERING BASED ON SELECTED MODE */}
            {snTrackingType === 'unique_per_unit' && (
              <SerialNumberInputManager
                quantity={quantity}
                serialNumbers={serialNumbers}
                onChangeSerialNumbers={(sns) => {
                  setSerialNumbers(sns);
                  if (sns.length > 0 && sns[0]) {
                    setSerialNumber(sns[0]);
                  }
                }}
                productName={name}
                category={category}
                brand={brand}
                sku={sku}
                itemId={itemToEdit?.id}
                existingItems={storageService.getItems()}
              />
            )}

            {snTrackingType === 'shared_batch' && (
              <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-slate-700 font-bold">
                    Nomor Batch / Lot / Serial Number Bersama <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pfx = category.includes('Ribbon') ? 'RBN' : category.includes('Card') ? 'CRD' : 'LOT';
                      const code = Math.floor(1000 + Math.random() * 9000);
                      const b = `LOT-${pfx}-${new Date().getFullYear()}-${code}`;
                      setBatchNumber(b);
                      setSerialNumber(b);
                      setSerialNumbers(Array(quantity).fill(b));
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Generate Format Lot</span>
                  </button>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={batchNumber || serialNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBatchNumber(val);
                      setSerialNumber(val);
                      setSerialNumbers(Array(quantity).fill(val));
                    }}
                    placeholder="Contoh: LOT-RBN-2024-8849 atau BATCH-0012"
                    className="flex-1 bg-white border border-purple-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="bg-white/80 border border-purple-100 rounded-xl p-3 text-[11px] text-purple-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Efisien untuk Bahan Habis Pakai (Consumables):</span> 1 Nomor seri/batch ini secara otomatis dikaitkan ke seluruh <span className="font-bold">{quantity} {unit}</span> produk ini. Sangat ideal untuk Ribbon, Roll Film Laminasi, atau Box Kartu Blank PVC yang diproduksi dari batch pabrik yang identik.
                  </div>
                </div>
              </div>
            )}

            {snTrackingType === 'no_sn' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800 text-xs">Mode Non-Serial Number Aktif</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Produk ini tidak memerlukan pelacakan nomor seri individual. Manajemen stok berjalan penuh secara kuantitas (<span className="font-bold text-slate-700">{quantity} {unit}</span>) menggunakan kode SKU dan scan Barcode.
                  </p>
                </div>
              </div>
            )}
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
                  min="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
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
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block text-slate-700 font-bold">Foto Produk</label>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <ImageUp className="w-3.5 h-3.5" />
                    Upload dari Laptop
                  </button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... atau upload gambar dari laptop"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview produk"
                      className="h-28 object-cover rounded-lg w-full"
                    />
                  ) : (
                    <div className="h-28 flex w-full items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">
                      Preview foto produk
                    </div>
                  )}
                </div>
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

      {/* Modal: Bulk Paste Multi-Serial Number */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Paste Serial Number dari Excel / Dokumen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Salin (Copy) kolom Serial Number dari spreadsheet Excel, CSV, atau manifest pengiriman dan tempel di bawah ini (1 nomor per baris atau dipisahkan koma):
              </p>

              <textarea
                rows={8}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder="SN-IDP81-2024-001&#10;SN-IDP81-2024-002&#10;SN-IDP81-2024-003&#10;SN-IDP81-2024-004"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {(() => {
                const detectedCount = bulkPasteText
                  .split(/[\r\n,]+/)
                  .map(s => s.trim())
                  .filter(Boolean).length;
                return (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-700">
                      Terdeteksi: <span className="text-blue-600 font-mono font-bold">{detectedCount}</span> nomor seri
                    </span>
                    {detectedCount > quantity && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        (Kuantitas stok otomatis disesuaikan ke {detectedCount})
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPaste}
                disabled={!bulkPasteText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Serial Number</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
