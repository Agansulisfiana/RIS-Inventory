import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  X,
  Check,
  CheckCircle2,
  Building,
  User as UserIcon,
  UserCheck,
  Calendar,
  Sparkles,
  Hash,
  Phone,
  Mail,
  FileCheck,
  ShieldAlert,
  Plus,
  Minus,
  Layers,
  Tag,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { storageService } from '../../services/storage';
import { canSelectForDemo, getInventoryStockState } from '../../utils/inventoryStock';
import {
  resolveSnTrackingType,
  getAvailableItemSerialNumbers,
  getRegisteredSerialNumbers,
  formatSnDisplay
} from '../../utils/snManagement';

interface CheckoutDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onCheckoutDemo: (itemId: string, info: any) => void;
  onShowReceipt: (item: InventoryItem, info: any) => void;
}

export const CheckoutDemoModal: React.FC<CheckoutDemoModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  settings,
  onCheckoutDemo,
  onShowReceipt
}) => {
  // Bulk SN Modal State
  const [showBulkSnModal, setShowBulkSnModal] = useState(false);
  const [bulkSnText, setBulkSnText] = useState('');

  // Form Fields - Seksi 1: Borrower Information
  const [outgoingDocumentNumber, setOutgoingDocumentNumber] = useState('');
  const [requestFrom, setRequestFrom] = useState('Sales');
  const [companyName, setCompanyName] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [borrowerDepartment] = useState('Sales Enterprise');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields - Seksi 2: Unit Selection
  const [selectedDemoItemId, setSelectedDemoItemId] = useState('');
  const [demoQuantity, setDemoQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [serialNumber, setSerialNumber] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [accessoriesNotes, setAccessoriesNotes] = useState('');

  // Form Fields - Seksi 3: Handover Verification
  const [handedOverBy, setHandedOverBy] = useState(currentUser?.name || '');
  const [handedOverRole, setHandedOverRole] = useState(currentUser?.department || 'Operasional Gudang & Logistik');
  const [handoverStaffOption, setHandoverStaffOption] = useState<'current' | 'selected' | 'manual'>('current');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState('');

  // Initialize defaults on modal open
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (!outgoingDocumentNumber) {
        setOutgoingDocumentNumber(`SK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
      if (!handedOverBy && currentUser?.name) {
        setHandedOverBy(currentUser.name);
        setHandedOverRole(currentUser.department || 'Operasional Gudang & Logistik');
      }
      try {
        const usersList = storageService.getUsers();
        if (usersList && usersList.length > 0) {
          setAllUsers(usersList);
        }
      } catch (err) {
        console.warn('Could not load users list for demo handover:', err);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Safe Available stock items for demo
  const demoProductOptions = (items || [])
    .filter(item => {
      if (!item) return false;
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const isCardPrinter = 
        cat.includes('printer') || 
        cat.includes('mesin') ||
        cat.includes('hardware') ||
        cat.includes('scanner') ||
        name.includes('printer') || 
        name.includes('zebra') || 
        name.includes('evolis') || 
        name.includes('fargo') || 
        name.includes('datacard') || 
        name.includes('matika') ||
        name.includes('smart') ||
        name.includes('hiti') ||
        name.includes('seaory') ||
        !cat.includes('ribbon');
      return isCardPrinter;
    })
    .map(item => {
      const stock = getInventoryStockState(item);
      const availableQty = stock.readyQuantity > 0 ? stock.readyQuantity : Math.max(0, item.quantity || 0);
      const isReady = canSelectForDemo(item) && (item.quantity || 0) > 0;
      return {
        item,
        stock,
        availableQty,
        isReady,
      };
    });

  const selectedOption = demoProductOptions.find(o => o.item.id === selectedDemoItemId);
  const selectedDemoItem = selectedOption?.item;
  const maxDemoQuantity = Math.max(1, selectedOption?.availableQty ?? 1);
  const remainingAvailableStock = Math.max(0, (selectedOption?.availableQty ?? 0) - demoQuantity);

  const selectedItemTrackingType = selectedDemoItem ? resolveSnTrackingType(selectedDemoItem) : 'unique_per_unit';
  const availableStockSns = selectedDemoItem ? getAvailableItemSerialNumbers(selectedDemoItem, items) : [];
  const registeredStockSns = selectedDemoItem ? getRegisteredSerialNumbers(selectedDemoItem) : [];

  // Handle product selection & auto-attaching previously entered SNs
  const handleSelectProduct = (itemId: string) => {
    setSelectedDemoItemId(itemId);
    setFormError(null);
    const foundOption = demoProductOptions.find(o => o.item.id === itemId);
    const item = foundOption?.item;
    if (!item) return;

    const tracking = resolveSnTrackingType(item);
    if (tracking === 'shared_batch') {
      const shared = item.batchNumber || item.serialNumber || 'LOT-SHARED';
      setSerialNumbers([shared]);
      setSerialNumber(shared);
      setDemoQuantity(1);
    } else if (tracking === 'unique_per_unit') {
      const avail = getAvailableItemSerialNumbers(item, items);
      const firstSn = avail[0] || item.serialNumber || '';
      setSerialNumbers([firstSn]);
      setSerialNumber(firstSn);
      setDemoQuantity(1);
    } else {
      setSerialNumbers(['NON-SN']);
      setSerialNumber('NON-SN');
      setDemoQuantity(1);
    }
  };

  // Handlers for Unit & Serial Number
  const handleUpdateQuantity = (newQty: number) => {
    const clampedQty = Math.max(1, Math.min(newQty, maxDemoQuantity));
    setDemoQuantity(clampedQty);
    setFormError(null);

    if (!selectedDemoItem) {
      setSerialNumbers(prev => {
        const copy = [...prev];
        while (copy.length < clampedQty) copy.push('');
        return copy.slice(0, clampedQty);
      });
      return;
    }

    const tracking = resolveSnTrackingType(selectedDemoItem);
    if (tracking === 'shared_batch') {
      const shared = selectedDemoItem.batchNumber || selectedDemoItem.serialNumber || 'LOT-SHARED';
      setSerialNumbers(Array(clampedQty).fill(shared));
      setSerialNumber(shared);
      return;
    }
    if (tracking === 'no_sn') {
      setSerialNumbers(Array(clampedQty).fill('NON-SN'));
      setSerialNumber('NON-SN');
      return;
    }

    // unique_per_unit: automatically pre-fill available SNs
    const avail = getAvailableItemSerialNumbers(selectedDemoItem, items);
    setSerialNumbers(prev => {
      const copy = [...prev];
      for (let i = 0; i < clampedQty; i++) {
        if (!copy[i] || copy[i].trim() === '') {
          const candidate = avail.find(s => !copy.includes(s));
          copy[i] = candidate || (i === 0 ? (selectedDemoItem.serialNumber || '') : '');
        }
      }
      return copy.slice(0, clampedQty);
    });
  };

  // Quick action: Auto-pick first N available SNs
  const handleAutoPickAvailableSns = () => {
    if (!selectedDemoItem) return;
    const avail = getAvailableItemSerialNumbers(selectedDemoItem, items);
    const assigned = avail.slice(0, demoQuantity);
    while (assigned.length < demoQuantity) {
      assigned.push('');
    }
    setSerialNumbers(assigned);
    if (assigned[0]) setSerialNumber(assigned[0]);
  };

  // Toggle/Select an available SN chip
  const handleToggleSnChip = (sn: string) => {
    setSerialNumbers(prev => {
      const copy = [...prev];
      const existingIdx = copy.findIndex(s => s.toLowerCase() === sn.toLowerCase());
      if (existingIdx >= 0) {
        copy[existingIdx] = '';
        return copy;
      }
      const emptyIdx = copy.findIndex(s => !s || s.trim() === '');
      if (emptyIdx >= 0 && emptyIdx < demoQuantity) {
        copy[emptyIdx] = sn;
      } else {
        copy[0] = sn;
      }
      if (copy[0]) setSerialNumber(copy[0]);
      return copy.slice(0, demoQuantity);
    });
  };

  const handleUpdateSerialNumber = (index: number, val: string) => {
    setSerialNumbers(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
    if (index === 0) {
      setSerialNumber(val);
    }
  };

  const handlePasteSerialNumbers = (startIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const tokens = pasteData.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (tokens.length > 1) {
      e.preventDefault();
      setSerialNumbers(prev => {
        const copy = [...prev];
        tokens.forEach((token, offset) => {
          const targetIndex = startIndex + offset;
          if (targetIndex < demoQuantity) {
            copy[targetIndex] = token;
          }
        });
        return copy;
      });
      if (startIndex === 0 && tokens[0]) {
        setSerialNumber(tokens[0]);
      }
    }
  };

  const handleAutoNumberSerialNumbers = () => {
    const base = serialNumbers[0]?.trim() || selectedDemoItem?.serialNumber || '';
    if (!base) return;

    const match = base.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numberStr = match[2];
      const startNum = parseInt(numberStr, 10);
      const padLen = numberStr.length;

      setSerialNumbers(prev => {
        const copy = [...prev];
        for (let i = 0; i < demoQuantity; i++) {
          const currentNum = startNum + i;
          copy[i] = `${prefix}${String(currentNum).padStart(padLen, '0')}`;
        }
        return copy;
      });
    }
  };

  const handleApplyBulkSnText = () => {
    if (!bulkSnText.trim()) {
      setShowBulkSnModal(false);
      return;
    }
    const tokens = bulkSnText.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (tokens.length > 0) {
      setSerialNumbers(prev => {
        const copy = [...prev];
        tokens.forEach((t, i) => {
          if (i < demoQuantity) {
            copy[i] = t;
          }
        });
        return copy;
      });
      if (tokens[0]) {
        setSerialNumber(tokens[0]);
      }
    }
    setBulkSnText('');
    setShowBulkSnModal(false);
  };

  const handleToggleAccessory = (accName: string) => {
    const current = accessoriesNotes.trim();
    if (!current) {
      setAccessoriesNotes(`1 unit ${accName}`);
      return;
    }

    const lowerCurrent = current.toLowerCase();
    const lowerAcc = accName.toLowerCase();

    if (lowerCurrent.includes(lowerAcc)) {
      const parts = current
        .split(',')
        .map(s => s.trim())
        .filter(s => !s.toLowerCase().includes(lowerAcc));
      setAccessoriesNotes(parts.join(', '));
    } else {
      setAccessoriesNotes(`${current}, 1 unit ${accName}`);
    }
  };

  const handleSelectPeriodPreset = (days: number, label: string) => {
    setLoanPeriod(label);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    setExpectedReturnDate(`${yyyy}-${mm}-${dd}`);
  };

  const purposePresets = [
    'POC Demo Uji Coba Kartu',
    'Presentasi & Uji Tender',
    'Testing Integrasi Sistem / SDK',
    'Pameran / Expo Event'
  ];

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validasi Peminjam
    if (!companyName.trim()) {
      setFormError('Nama instansi / perusahaan peminjam wajib diisi.');
      return;
    }
    if (!borrowerName.trim()) {
      setFormError('Nama peminjam / PIC penerima wajib diisi.');
      return;
    }
    if (!borrowerContact.trim() && !contactEmail.trim()) {
      setFormError('Kontak telepon atau email peminjam wajib diisi.');
      return;
    }

    // 2. Validasi Unit & Jadwal
    if (!selectedDemoItemId || !selectedDemoItem) {
      setFormError('Pilih printer demo yang akan dipinjamkan.');
      return;
    }
    if (!Number.isInteger(demoQuantity) || demoQuantity < 1 || demoQuantity > maxDemoQuantity) {
      setFormError(`Jumlah unit demo harus antara 1 sampai ${maxDemoQuantity} unit.`);
      return;
    }
    if (!expectedReturnDate) {
      setFormError('Tentukan tanggal estimasi pengembalian unit demo.');
      return;
    }

    // 3. Validasi Serial Numbers
    const cleanedSnList = serialNumbers.slice(0, demoQuantity).map(s => s.trim());
    const tracking = resolveSnTrackingType(selectedDemoItem);
    
    if (tracking === 'unique_per_unit') {
      const emptyIndex = cleanedSnList.findIndex(s => s.length === 0);
      if (emptyIndex !== -1) {
        setFormError(`Serial Number untuk Unit #${emptyIndex + 1} belum diisi! Produk ini menggunakan SN per barang, pastikan semua ${demoQuantity} unit terdata nomor serinya.`);
        return;
      }
    }

    // 4. Validasi Petugas
    if (!handedOverBy.trim()) {
      setFormError('Nama petugas/staf yang menyerahkan unit wajib diisi.');
      return;
    }

    const primarySn = cleanedSnList.find(s => s.length > 0) || serialNumber.trim() || selectedDemoItem?.serialNumber || '';
    const joinedSn = cleanedSnList.filter(Boolean).join(', ') || primarySn;

    const finalHandedOverBy = handedOverBy.trim() || currentUser?.name || 'Petugas Gudang';
    const finalHandedOverRole = handedOverRole.trim() || currentUser?.department || 'Operasional Gudang & Logistik';

    const receiptInfo = {
      outgoingDocumentNumber: outgoingDocumentNumber.trim() || `SK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      documentNumber: outgoingDocumentNumber.trim() || `DO-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: selectedDemoItem?.name,
      productCode: selectedDemoItem?.sku,
      serialNumber: joinedSn,
      serialNumbers: cleanedSnList.length > 0 ? cleanedSnList : [primarySn],
      accessoriesNotes: accessoriesNotes.trim(),
      borrowerName: borrowerName.trim(),
      customerName: companyName.trim(),
      companyName: companyName.trim(),
      borrowerContact: borrowerContact.trim(),
      contactEmail: contactEmail.trim(),
      requestFrom: requestFrom.trim(),
      borrowerDepartment,
      loanPeriod: loanPeriod.trim() || '1 Bulan',
      quantity: demoQuantity,
      loanDate: new Date().toISOString(),
      expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      purpose: purpose.trim() || 'POC Demo Uji Coba Kartu',
      notes: notes.trim(),
      active: true,
      loanedBy: finalHandedOverBy,
      handedOverBy: finalHandedOverBy,
      handedOverRole: finalHandedOverRole,
    };

    const success = onCheckoutDemo(selectedDemoItemId, receiptInfo);
    if ((success as any) === false) {
      return;
    }

    if (selectedDemoItem) {
      onShowReceipt(selectedDemoItem, receiptInfo);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl lg:max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">FORM PEMINJAMAN UNIT DEMO</h3>
              <p className="text-[11px] text-slate-500 font-medium">Checkout unit demo, pencatatan serial number (SN), dan serah terima staf</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitCheckout} className="p-4 sm:p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Validasi Checkout Demo</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">{formError}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-700 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {/* ============================================================ */}
          {/* SEKSI 1: BORROWER INFORMATION (INFORMASI PEMINJAM & DOKUMEN) */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  1. Informasi Peminjam & Dokumen Surat
                </h4>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Pihak Peminjam (Tanda Tangan Sisi Kiri)
              </span>
            </div>

            {/* Card: Dokumen Surat & Divisi */}
            <div className="bg-white rounded-xl border border-emerald-100 p-3.5 space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      No Surat Keluar (SK) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOutgoingDocumentNumber(`SK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      + Generate Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={outgoingDocumentNumber}
                    onChange={(e) => setOutgoingDocumentNumber(e.target.value)}
                    placeholder="Contoh: SK-2026-0819"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-mono font-bold shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Asal Permintaan / Divisi Internal <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={requestFrom}
                    onChange={(e) => setRequestFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                  >
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Customer">Customer Direct (Klien Langsung)</option>
                    <option value="Technical Support">Technical Support / Engineer</option>
                    <option value="Warehouse">Internal Warehouse / Workshop</option>
                    <option value="Project">Project Delivery Team</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card: Identitas Peminjam / PIC */}
            <div className="bg-white rounded-xl border border-emerald-100 p-3.5 space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Nama Instansi / Perusahaan Peminjam <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Contoh: PT Sumber Sejahtera Makmur"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Nama Peminjam / PIC Penerima <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Nama PIC (Contoh: Bpk. Hendra Wijaya)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Kontak Telepon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={borrowerContact}
                      onChange={(e) => setBorrowerContact(e.target.value)}
                      placeholder="0812-3456-7890"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">Email PIC (Opsional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="pic@instansi.co.id"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Keperluan Demo / Penggunaan */}
            <div className="bg-white rounded-xl border border-emerald-100 p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-bold text-slate-700 text-[11px]">
                  Keperluan Peminjaman Demo (POC)
                </label>
                <span className="text-[10px] text-slate-500">Pilih rekomendasi cepat:</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {purposePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPurpose(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      purpose === preset
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: POC Uji Coba Klien & Testing Cetak Kartu Akses Karyawan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SEKSI 2: UNIT SELECTION (PEMILIHAN UNIT & SERIAL NUMBER)     */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-purple-200/70 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  2. Pemilihan Unit, Kuantitas & Serial Number
                </h4>
              </div>
              <span className="rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                Unit Ready Stock & Nomor Seri
              </span>
            </div>

            {/* Card 2A: Pilih Produk Ready & Stepper Kuantitas */}
            <div className="bg-white rounded-xl border border-purple-100 p-3.5 space-y-3.5 shadow-2xs">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700 text-[11px]">
                  Pilih Produk Printer Ready Stock <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedDemoItemId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 font-medium shadow-xs outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                >
                  <option value="">-- Pilih Produk Ready Stock Untuk Demo --</option>
                  {demoProductOptions.map(({ item, stock, availableQty, isReady }) => (
                    <option key={item.id} value={item.id} disabled={!isReady}>
                      {item.name} ({isReady ? `Ready: ${availableQty} ${item.unit}` : `Tidak tersedia: ${stock.catalogStatus === 'service' ? 'Sedang servis' : item.quantity <= 0 ? 'Stok habis' : stock.catalogStatus === 'rusak' ? 'Barang rusak' : 'Tidak tersedia'}`} | Rak: {item.location})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDemoItem && (
                <div className="rounded-xl border border-purple-200/80 bg-purple-50/60 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900">{selectedDemoItem.name}</div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                        <span>SKU: <strong className="font-mono text-purple-800">{selectedDemoItem.sku}</strong></span>
                        <span>•</span>
                        <span>Lokasi: <strong className="text-slate-800">{selectedDemoItem.location}</strong></span>
                        <span>•</span>
                        <span>Kondisi: <strong className="text-emerald-700 capitalize">{selectedDemoItem.condition || 'Bagus'}</strong></span>
                      </div>
                    </div>

                    {/* Stepper Kuantitas Demo */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-purple-200 bg-white shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(demoQuantity - 1)}
                          disabled={demoQuantity <= 1}
                          className="px-2.5 py-1.5 text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                          title="Kurangi 1 unit"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxDemoQuantity}
                          value={demoQuantity}
                          onChange={(e) => handleUpdateQuantity(parseInt(e.target.value, 10) || 1)}
                          className="w-12 text-center text-xs font-black text-slate-900 outline-none border-x border-purple-100 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(demoQuantity + 1)}
                          disabled={demoQuantity >= maxDemoQuantity}
                          className="px-2.5 py-1.5 text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                          title="Tambah 1 unit"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Unit</span>
                    </div>
                  </div>

                  {/* Tracking Type Badge */}
                  <div className="flex items-center gap-2 pt-1 border-t border-purple-200/50">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedItemTrackingType === 'unique_per_unit'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : selectedItemTrackingType === 'shared_batch'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {selectedItemTrackingType === 'unique_per_unit' ? (
                        <>
                          <Tag className="w-3 h-3 text-purple-700" />
                          SN per Barang (Wajib pilih {demoQuantity} SN berbeda)
                        </>
                      ) : selectedItemTrackingType === 'shared_batch' ? (
                        <>
                          <Layers className="w-3 h-3 text-amber-700" />
                          1 SN / Batch Lot Digunakan di Semua Produk
                        </>
                      ) : (
                        <>
                          <Hash className="w-3 h-3 text-slate-600" />
                          Produk Non-SN
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {selectedDemoItem && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Pilih Cepat:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(1)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        demoQuantity === 1 ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      1 Unit
                    </button>
                    {maxDemoQuantity >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(2)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          demoQuantity === 2 ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        2 Unit
                      </button>
                    )}
                    {maxDemoQuantity >= 5 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(5)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          demoQuantity === 5 ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        5 Unit
                      </button>
                    )}
                    {maxDemoQuantity > 1 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(maxDemoQuantity)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          demoQuantity === maxDemoQuantity ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        Maks. Ready ({maxDemoQuantity})
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sisa Ready Setelah Checkout: <strong className="text-purple-700">{remainingAvailableStock} {selectedDemoItem.unit}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2B: Input Serial Number Multi-Unit */}
            {selectedDemoItem && selectedItemTrackingType === 'shared_batch' ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black text-amber-900">
                    1 Serial Number / Batch Lot Digunakan Untuk Semua Unit
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Produk ini bertipe <strong>Shared Batch</strong> (1 SN digunakan bersama di semua produk). Nomor seri berikut otomatis dilampirkan ke seluruh <strong>{demoQuantity} unit</strong> peminjaman demo ini dan akan tercetak pada Surat Jalan Demo:
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nomor Seri / Batch:</span>
                    <span className="font-mono text-xs font-black text-amber-950 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-300">
                      {selectedDemoItem.batchNumber || selectedDemoItem.serialNumber || 'LOT-SHARED'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Otomatis Terlampir ke {demoQuantity} Unit
                  </span>
                </div>
              </div>
            ) : selectedDemoItem && selectedItemTrackingType === 'no_sn' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Produk ini berjenis Non-SN (tanpa nomor seri). Tidak ada nomor seri yang wajib dilampirkan.</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-purple-100 p-3.5 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="font-black text-slate-900 text-xs">
                        Serial Number (SN) Unit Demo ({demoQuantity} Unit)
                      </span>
                      <span className="text-rose-500 font-bold ml-1">*</span>
                    </div>
                  </div>

                  {/* Status Terisi & Quick Actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {serialNumbers.slice(0, demoQuantity).filter(s => s.trim()).length} dari {demoQuantity} SN Terisi
                    </span>

                    {demoQuantity > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handleAutoNumberSerialNumbers}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                          title="Isi nomor berurutan otomatis berdasarkan Unit #1"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span className="hidden sm:inline">Pola Urut</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowBulkSnModal(!showBulkSnModal)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                          title="Paste banyak nomor seri sekaligus"
                        >
                          <span className="hidden sm:inline">Paste Banyak SN</span>
                          <span className="sm:hidden">Paste SN</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Interactive Registered SN Chips from Inventory */}
                {selectedDemoItem && availableStockSns.length > 0 && (
                  <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Pilih dari SN Terdaftar di Stok ({availableStockSns.length} SN Ready):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAutoPickAvailableSns}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-white hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          title="Pilih otomatis SN yang tersedia"
                        >
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Pilih Otomatis {demoQuantity} SN
                        </button>
                        <button
                          type="button"
                          onClick={() => setSerialNumbers(Array(demoQuantity).fill(''))}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Reset pilihan nomor seri"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {availableStockSns.map((sn) => {
                        const isSelected = serialNumbers.slice(0, demoQuantity).includes(sn);
                        const assignedUnitIndex = serialNumbers.slice(0, demoQuantity).indexOf(sn);
                        return (
                          <button
                            key={sn}
                            type="button"
                            onClick={() => handleToggleSnChip(sn)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{sn} (Unit #{assignedUnitIndex + 1})</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-2.5 h-2.5 text-slate-400" />
                                <span>{sn}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Popover / Panel Paste Banyak SN */}
                {showBulkSnModal && (
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span>Paste Daftar Serial Number ({demoQuantity} Unit)</span>
                      <button
                        type="button"
                        onClick={() => setShowBulkSnModal(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tempelkan kolom SN dari Excel atau daftar teks (1 serial number per baris atau dipisah koma):
                    </p>
                    <textarea
                      rows={3}
                      value={bulkSnText}
                      onChange={(e) => setBulkSnText(e.target.value)}
                      placeholder="SN-81001&#10;SN-81002&#10;SN-81003"
                      className="w-full rounded-lg border border-indigo-200 bg-white p-2 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkSnModal(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyBulkSnText}
                        className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer"
                      >
                        Terapkan ke {demoQuantity} Unit
                      </button>
                    </div>
                  </div>
                )}

                {/* Multi-Unit Dynamic Cards Grid */}
                <div className={`grid ${demoQuantity > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
                  {Array.from({ length: demoQuantity }).map((_, idx) => {
                    const snVal = serialNumbers[idx] || '';
                    const isFilled = snVal.trim().length > 0;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-2.5 transition ${
                          isFilled
                            ? 'bg-white border-purple-200/80 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                              isFilled ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span>Unit #{idx + 1} {idx === 0 ? '(Unit Utama)' : ''}</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          {isFilled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>OK</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 italic">
                              Wajib diisi
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Hash className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              required
                              placeholder={idx === 0 ? (selectedDemoItem?.serialNumber || 'Contoh: SN-81-001') : `SN Unit #${idx + 1}`}
                              value={snVal}
                              onChange={(e) => handleUpdateSerialNumber(idx, e.target.value)}
                              onPaste={(e) => handlePasteSerialNumbers(idx, e)}
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition"
                            />
                          </div>

                          {/* Quick selection dropdown from available SNs */}
                          {availableStockSns.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-slate-500 shrink-0">Pilih SN:</span>
                              <select
                                value={snVal}
                                onChange={(e) => handleUpdateSerialNumber(idx, e.target.value)}
                                className="w-full text-[10px] font-mono py-0.5 px-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="">-- Pilih dari stok --</option>
                                {availableStockSns.map(s => (
                                  <option key={s} value={s}>
                                    {s} {serialNumbers.slice(0, demoQuantity).includes(s) && s !== snVal ? '(Sudah dipilih unit lain)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card 2C: Jadwal Pinjam & Aksesoris */}
            <div className="bg-white rounded-xl border border-purple-100 p-3.5 space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Periode Peminjaman Demo
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectPeriodPreset(7, '7 Hari')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 transition cursor-pointer"
                      >
                        7 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPeriodPreset(14, '14 Hari')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 transition cursor-pointer"
                      >
                        14 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPeriodPreset(30, '1 Bulan')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 transition cursor-pointer"
                      >
                        1 Bulan
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={loanPeriod}
                    onChange={(e) => setLoanPeriod(e.target.value)}
                    placeholder="Contoh: 1 Bulan (POC Tahap 1)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Tanggal Estimasi Pengembalian <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="date"
                      required
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Aksesoris Bawaan */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="font-bold text-slate-700 text-[11px]">Kelengkapan Aksesoris Bawaan</label>
                  <span className="text-[10px] text-slate-500">Klik untuk tambah kelengkapan:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Box Original',
                    'Kabel Power',
                    'Adaptor Original',
                    'Kabel USB Printer',
                    'Sample Ribbon YMCKO',
                    'Kartu Uji Coba PVC (10 pcs)'
                  ].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => handleToggleAccessory(acc)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                        accessoriesNotes.toLowerCase().includes(acc.toLowerCase())
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      + {acc}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={accessoriesNotes}
                  onChange={(e) => setAccessoriesNotes(e.target.value)}
                  placeholder="1 unit Box Original, 1 unit Kabel Power, 1 unit Adaptor..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 shadow-xs outline-none transition focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SEKSI 3: HANDOVER VERIFICATION (VERIFIKASI & SERAH TERIMA)   */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/30 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-sky-200/70 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-700" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  3. Verifikasi Petugas Serah Terima & Ringkasan Dokumen
                </h4>
              </div>
              <span className="rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                Pihak Yang Menyerahkan (Tanda Tangan Sisi Kanan)
              </span>
            </div>

            {/* Card 3A: Penyerah Fisik Unit Demo */}
            <div className="bg-white rounded-xl border border-sky-100 p-3.5 space-y-3 shadow-2xs">
              <div className="p-2.5 bg-sky-50/70 border border-sky-200/70 rounded-xl text-[11px] text-sky-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Petugas Fisik Yang Menyerahkan Unit:</strong> Menentukan nama staf gudang/workshop yang menyerahkan fisik barang ke pihak peminjam. Nama ini tercetak pada kolom tanda tangan <strong>"Yang Menyerahkan"</strong> di Surat Peminjaman Demo resmi.
                </div>
              </div>

              {/* 3 Tab Sumber Petugas */}
              <div>
                <label className="mb-1.5 block font-bold text-slate-700 text-[11px]">
                  Pilih Sumber Petugas Yang Menyerahkan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHandoverStaffOption('current');
                      setHandedOverBy(currentUser?.name || '');
                      setHandedOverRole(currentUser?.department || 'Operasional Gudang & Logistik');
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      handoverStaffOption === 'current'
                        ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-200 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Akun Login Saat Ini</div>
                    <div className="text-[9px] text-slate-500 truncate">{currentUser?.name || 'Petugas Aktif'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoverStaffOption('selected')}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      handoverStaffOption === 'selected'
                        ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-200 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Pilih Rekan Staf</div>
                    <div className="text-[9px] text-slate-500 truncate">Daftar Staf Terdaftar</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHandoverStaffOption('manual');
                      if (handedOverBy === currentUser?.name) {
                        setHandedOverBy('');
                      }
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      handoverStaffOption === 'manual'
                        ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-200 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Ketik Manual</div>
                    <div className="text-[9px] text-slate-500 truncate">Helper / Ekspedisi / Shift</div>
                  </button>
                </div>
              </div>

              {/* Pilihan Dropdown jika 'selected' */}
              {handoverStaffOption === 'selected' && allUsers.length > 0 && (
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-1.5">
                  <label className="block font-bold text-slate-800 text-[11px]">
                    Pilih Nama Staf Gudang / Workshop:
                  </label>
                  <select
                    value={handedOverBy}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setHandedOverBy(selectedName);
                      const found = allUsers.find(u => u.name === selectedName);
                      if (found) {
                        setHandedOverRole(found.department || 'Operasional Gudang & Logistik');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer"
                  >
                    <option value="">-- Pilih Staf Penyerah --</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role.toUpperCase()} - {u.department || 'Gudang'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Input Nama & Jabatan Penyerah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Nama Staf Yang Menyerahkan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={handedOverBy}
                      onChange={(e) => setHandedOverBy(e.target.value)}
                      placeholder="Nama staf yang menyerahkan"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-xs outline-none transition focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-[11px]">
                    Jabatan / Departemen Penyerah
                  </label>
                  <input
                    type="text"
                    value={handedOverRole}
                    onChange={(e) => setHandedOverRole(e.target.value)}
                    placeholder="Operasional Gudang & Logistik"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 font-medium shadow-xs outline-none transition focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            {/* Card 3B: Catatan Tambahan (Opsional) */}
            <div className="bg-white rounded-xl border border-sky-100 p-3.5 space-y-2 shadow-2xs">
              <label className="block font-bold text-slate-700 text-[11px]">
                Catatan Tambahan Serah Terima (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Disertakan instruksi pengetesan, nomor segel keamanan, atau kondisi fisik unit saat keluar..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-800 shadow-xs outline-none transition focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Card 3C: Lembar Verifikasi Ringkasan Serah Terima */}
            <div className="bg-white rounded-xl border border-sky-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  Ringkasan Verifikasi Serah Terima
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Pihak Peminjam</span>
                  <div className="font-black text-slate-900 text-xs">{companyName || '(Belum diisi)'}</div>
                  <div className="text-slate-600">PIC: {borrowerName || '-'} ({borrowerDepartment})</div>
                  <div className="text-slate-600">Kontak: {borrowerContact || '-'}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Unit & Jadwal</span>
                  <div className="font-black text-purple-900 text-xs">
                    {selectedDemoItem?.name || '(Pilih unit)'} ({demoQuantity} Unit)
                  </div>
                  <div className="text-slate-600">Durasi: {loanPeriod || '1 Bulan'}</div>
                  <div className="text-slate-600">Est. Kembali: <strong className="text-rose-600">{expectedReturnDate || '-'}</strong></div>
                </div>
              </div>

              {/* Tampilan Serial Numbers Ringkasan */}
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Daftar Serial Number ({demoQuantity} Unit):
                  </span>
                  <span className="text-[10px] font-bold text-purple-700">
                    {serialNumbers.slice(0, demoQuantity).filter(s => s.trim()).length} dari {demoQuantity} Terverifikasi
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {serialNumbers.slice(0, demoQuantity).map((sn, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border shadow-2xs ${
                        sn.trim()
                          ? 'bg-white text-slate-900 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className="text-purple-600">#{idx + 1}</span>
                      <span>{sn.trim() || 'Kosong!'}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pihak Yang Menyerahkan</span>
                <div className="font-black text-sky-900 text-xs">{handedOverBy || currentUser?.name || 'Petugas Gudang'}</div>
                <div className="text-slate-600">{handedOverRole || currentUser?.department || 'Operasional Gudang & Logistik'}</div>
              </div>

              <div className="text-[10px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 p-2 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Format Surat Peminjaman Demo resmi dengan tanda tangan peminjam di sisi kiri dan petugas di sisi kanan siap dicetak otomatis setelah konfirmasi.</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="text-[11px] text-slate-500 font-medium">
              {selectedDemoItem ? (
                <span>Unit: <strong className="text-slate-900">{selectedDemoItem.name}</strong> ({demoQuantity} unit)</span>
              ) : (
                <span>Pilih printer demo sebelum checkout</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Verifikasi & Keluarkan {demoQuantity} Unit Demo</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
