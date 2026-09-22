import React, { useEffect, useState } from 'react';
import { 
  PlayCircle, 
  Search, 
  Plus, 
  Minus,
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  FileSpreadsheet,
  Printer, 
  Building, 
  User as UserIcon, 
  UserCheck,
  Calendar,
  X,
  Check,
  ShieldAlert,
  Layers,
  Sparkles,
  Copy,
  Hash,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  FileCheck,
  List,
  Sparkle
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';
import { exportService } from '../../services/exportService';
import { storageService } from '../../services/storage';
import { RisLogo } from '../Common/RisLogo';
import { formatCurrency } from '../../utils/currency';
import { canSelectForDemo, getInventoryStockState } from '../../utils/inventoryStock';
import { CheckoutDemoModal } from './CheckoutDemoModal';

interface DemoCenterTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onCheckoutDemo: (itemId: string, info: any) => void;
  onCheckinDemo: (itemId: string, returnNotes: string, condition: string) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const DemoCenterTab: React.FC<DemoCenterTabProps> = ({
  items,
  currentUser,
  settings,
  onCheckoutDemo,
  onCheckinDemo,
  onSelectItem
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'overdue' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedItemForCheckin, setSelectedItemForCheckin] = useState<InventoryItem | null>(null);

  // Form Checkout Demo
  const [selectedDemoItemId, setSelectedDemoItemId] = useState('');
  const [latestDemoReceipt, setLatestDemoReceipt] = useState<{ item: InventoryItem; info: any } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [demoQuantity, setDemoQuantity] = useState(1);
  const [outgoingDocumentNumber, setOutgoingDocumentNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [accessoriesNotes, setAccessoriesNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [requestFrom, setRequestFrom] = useState('Sales');
  const [companyName, setCompanyName] = useState('');
  const [borrowerDepartment, setBorrowerDepartment] = useState('Sales Enterprise');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Stepper & Layout Mode State
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showBulkSnModal, setShowBulkSnModal] = useState(false);
  const [bulkSnText, setBulkSnText] = useState('');

  // Form Khusus: Yang Menyerahkan Unit Demo
  const [handedOverBy, setHandedOverBy] = useState(currentUser?.name || '');
  const [handedOverRole, setHandedOverRole] = useState(currentUser?.department || 'Operasional Gudang & Logistik');
  const [handoverStaffOption, setHandoverStaffOption] = useState<'current' | 'selected' | 'manual'>('current');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    try {
      const usersList = storageService.getUsers();
      if (usersList && usersList.length > 0) {
        setAllUsers(usersList);
      }
    } catch (err) {
      console.warn('Could not load users list for demo handover:', err);
    }
  }, []);

  // Form Check-in Return
  const [returnCondition, setReturnCondition] = useState<InventoryItem['condition']>('bagus');
  const [returnNotes, setReturnNotes] = useState('');

  // All demo items
  const demoItems = items.filter(i => i.status === 'on_demo' || (i.demoLoanInfo && i.demoLoanInfo.active));
  const demoUnitsQty = demoItems.reduce((total, item) => total + getInventoryStockState(item).demoQuantity, 0);
  
  // Overdue calculation (expected return date < today)
  const today = new Date();
  const overdueItems = demoItems.filter(i => {
    if (!i.demoLoanInfo?.expectedReturnDate) return false;
    const exp = new Date(i.demoLoanInfo.expectedReturnDate);
    return exp < today;
  });

  // Keep every SKU visible in the checkout list. Products remain selectable
  // as long as their stock is available (quantity > 0). Products with 0 stock
  // or in service/repair cannot be selected for a new loan.
  const demoProductOptions = items.map(item => {
    const stock = getInventoryStockState(item);
    const availableQty = stock.readyQuantity > 0 ? stock.readyQuantity : Math.max(0, item.quantity);
    const isReady = canSelectForDemo(item) && item.quantity > 0;

    return {
      item,
      stock,
      availableQty,
      isReady
    };
  });
  const availableProductsForDemo = demoProductOptions.filter(option => option.isReady);
  const selectedDemoItem = items.find(item => item.id === selectedDemoItemId);
  const maxDemoQuantity = selectedDemoItem 
    ? (getInventoryStockState(selectedDemoItem).readyQuantity > 0 
        ? getInventoryStockState(selectedDemoItem).readyQuantity 
        : Math.max(1, selectedDemoItem.quantity))
    : 1;

  useEffect(() => {
    if (!selectedDemoItem) {
      setProductName('');
      setProductCode('');
      setSerialNumber('');
      setSerialNumbers(['']);
      return;
    }

    setProductName(selectedDemoItem.name);
    setProductCode(selectedDemoItem.sku);
    const initialSn = selectedDemoItem.serialNumber || '';
    setSerialNumber(initialSn);
    setSerialNumbers(prev => {
      const targetQty = demoQuantity || 1;
      const res: string[] = [];
      for (let i = 0; i < targetQty; i++) {
        if (i === 0 && (!prev[0] || prev[0] === '')) {
          res.push(initialSn);
        } else {
          res.push(prev[i] || '');
        }
      }
      return res;
    });
  }, [selectedDemoItem]);

  const handleUpdateQuantity = (newQty: number) => {
    const safeQty = Math.max(1, Math.min(newQty, maxDemoQuantity));
    setDemoQuantity(safeQty);
    setSerialNumbers(prev => {
      const updated = [...prev];
      if (updated.length < safeQty) {
        while (updated.length < safeQty) {
          updated.push('');
        }
      } else if (updated.length > safeQty) {
        updated.splice(safeQty);
      }
      return updated;
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
      const numStr = match[2];
      const startNum = parseInt(numStr, 10);
      const padLen = numStr.length;

      setSerialNumbers(prev => {
        return prev.map((_, i) => {
          if (i === 0) return base;
          const nextNum = startNum + i;
          return `${prefix}${String(nextNum).padStart(padLen, '0')}`;
        });
      });
    } else {
      setSerialNumbers(prev => {
        return prev.map((_, i) => {
          if (i === 0) return base;
          return `${base}-${i + 1}`;
        });
      });
    }
  };

  const quickAccessoriesList = [
    'Box / Kardus Original',
    'Kabel Power',
    'Adaptor Original',
    'Kabel USB Printer',
    'Ribbon Sample',
    'Blank Card PVC'
  ];

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

  const handleOpenCheckoutModal = () => {
    setCheckoutStep(1);
    if (!outgoingDocumentNumber) {
      setOutgoingDocumentNumber(`SK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    setIsCheckoutModalOpen(true);
  };

  const validateStep1 = (showAlert = true): boolean => {
    if (!companyName.trim()) {
      if (showAlert) alert('Nama instansi/perusahaan peminjam wajib diisi!');
      return false;
    }
    if (!borrowerName.trim()) {
      if (showAlert) alert('Nama peminjam / PIC penerima wajib diisi!');
      return false;
    }
    if (!borrowerContact.trim() && !contactEmail.trim()) {
      if (showAlert) alert('Kontak telepon atau email peminjam wajib diisi!');
      return false;
    }
    if (!outgoingDocumentNumber.trim()) {
      setOutgoingDocumentNumber(`SK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    return true;
  };

  const validateStep2 = (showAlert = true): boolean => {
    if (!selectedDemoItemId) {
      if (showAlert) alert('Pilih printer demo yang akan dipinjamkan!');
      return false;
    }
    if (!Number.isInteger(demoQuantity) || demoQuantity < 1 || demoQuantity > maxDemoQuantity) {
      if (showAlert) alert(`Jumlah unit demo harus antara 1 sampai ${maxDemoQuantity} unit.`);
      return false;
    }
    if (!expectedReturnDate) {
      if (showAlert) alert('Tentukan tanggal estimasi pengembalian!');
      return false;
    }
    return true;
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step === 1) {
      setCheckoutStep(1);
      return;
    }
    if (step === 2) {
      if (validateStep1(true)) {
        setCheckoutStep(2);
      }
      return;
    }
    if (step === 3) {
      if (validateStep1(true) && validateStep2(true)) {
        setCheckoutStep(3);
      }
      return;
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

  const isStep1Complete = Boolean(
    companyName.trim() &&
    borrowerName.trim() &&
    (borrowerContact.trim() || contactEmail.trim())
  );

  const isStep2Complete = Boolean(
    selectedDemoItemId &&
    demoQuantity >= 1 &&
    expectedReturnDate
  );

  const filteredItems = (activeSubTab === 'overdue' ? overdueItems : demoItems).filter(item => {
    const loan = item.demoLoanInfo;
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan?.customerName && loan.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loan?.borrowerName && loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenCheckin = (item: InventoryItem) => {
    setSelectedItemForCheckin(item);
    setReturnCondition(item.condition || 'bagus');
    setReturnNotes('');
    setIsCheckinModalOpen(true);
  };

  const handleConfirmCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForCheckin) return;
    onCheckinDemo(selectedItemForCheckin.id, returnNotes, returnCondition);
    setIsCheckinModalOpen(false);
    setSelectedItemForCheckin(null);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemoItemId) {
      alert('Pilih printer demo yang akan dipinjamkan!');
      return;
    }
    if (!Number.isInteger(demoQuantity) || demoQuantity < 1 || demoQuantity > maxDemoQuantity) {
      alert(`Jumlah unit demo harus antara 1 sampai ${maxDemoQuantity} unit.`);
      return;
    }
    if (!outgoingDocumentNumber.trim()) {
      alert('No Surat Keluar wajib diisi!');
      return;
    }
    if (!companyName.trim()) {
      alert('Nama instansi/perusahaan wajib diisi!');
      return;
    }
    if (!borrowerName.trim()) {
      alert('Nama peminjam / PIC penerima wajib diisi!');
      return;
    }
    if (!borrowerContact.trim() && !contactEmail.trim()) {
      alert('Kontak atau email peminjam wajib diisi!');
      return;
    }
    if (!handedOverBy.trim()) {
      alert('Nama staf/petugas yang menyerahkan unit wajib diisi!');
      return;
    }
    if (!expectedReturnDate) {
      alert('Tentukan tanggal estimasi pengembalian!');
      return;
    }

    const cleanedSnList = serialNumbers.map(s => s.trim());
    const primarySn = cleanedSnList.find(s => s.length > 0) || serialNumber.trim() || selectedDemoItem?.serialNumber || '';
    const joinedSn = cleanedSnList.filter(Boolean).join(', ') || primarySn;

    const finalHandedOverBy = handedOverBy.trim() || currentUser.name;
    const finalHandedOverRole = handedOverRole.trim() || currentUser.department || 'Operasional Gudang & Logistik';

    const receiptInfo = {
      outgoingDocumentNumber: outgoingDocumentNumber.trim(),
      documentNumber: outgoingDocumentNumber.trim() || `DO-DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: productName.trim() || selectedDemoItem?.name,
      productCode: productCode.trim() || selectedDemoItem?.sku,
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
      setLatestDemoReceipt({ item: selectedDemoItem, info: receiptInfo });
      setIsReceiptModalOpen(true);
    }

    setIsCheckoutModalOpen(false);
    setSelectedDemoItemId('');
    setDemoQuantity(1);
    setSerialNumbers(['']);
    setOutgoingDocumentNumber('');
    setProductName('');
    setProductCode('');
    setSerialNumber('');
    setAccessoriesNotes('');
    setCustomerName('');
    setBorrowerName('');
    setHandedOverBy(currentUser?.name || '');
    setHandedOverRole(currentUser?.department || 'Operasional Gudang & Logistik');
    setHandoverStaffOption('current');
    setBorrowerContact('');
    setContactEmail('');
    setRequestFrom('Sales');
    setCompanyName('');
    setExpectedReturnDate('');
    setLoanPeriod('');
    setPurpose('');
    setNotes('');
  };

  const handleOpenDemoReceipt = (item: InventoryItem) => {
    if (!item.demoLoanInfo) {
      alert('Belum ada data tanda terima untuk unit demo ini.');
      return;
    }
    setLatestDemoReceipt({ item, info: item.demoLoanInfo });
    setIsReceiptModalOpen(true);
  };

  const handleSaveDemoReceipt = () => {
    if (!latestDemoReceipt) return;
    exportService.exportDemoLoanReceiptPDF(latestDemoReceipt.item, latestDemoReceipt.info, settings, {
      autoSave: true,
      autoPrint: false
    });
  };

  const handlePrintDemoReceipt = () => {
    if (!latestDemoReceipt) return;
    exportService.exportDemoLoanReceiptPDF(latestDemoReceipt.item, latestDemoReceipt.info, settings, {
      autoSave: false,
      autoPrint: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <PlayCircle className="w-4 h-4" />
            <span>PUSAT KONTROL UNIT DEMO (POC)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            MANAJEMEN UNIT PINJAMAN DEMO
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Monitoring masa peminjaman unit printer demo customer, pencegahan keterlambatan, dan riwayat sirkulasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => exportService.exportDemoUnitsToExcel(items, settings)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Export Rekap Data Unit Demo ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => exportService.exportDemoUnitsToPDF(items, settings)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Download Laporan Akuntabilitas Demo PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleOpenCheckoutModal}
            className="px-4 sm:px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Checkout Peminjaman Demo Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unit Sedang Dipinjam (POC)</span>
          <div className="text-2xl font-black font-heading text-purple-600">
            {demoUnitsQty} Unit
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{demoItems.length} item terdaftar di demo • di lokasi klien customer</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Peringatan Terlambat Kembali</span>
          <div className="text-2xl font-black font-heading text-rose-600 flex items-center gap-2">
            <span>{overdueItems.length} Unit</span>
            {overdueItems.length > 0 && <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />}
          </div>
          <div className="text-[11px] text-rose-600 font-bold">Perlu follow-up tim sales segera</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Produk Siap Dipinjamkan</span>
          <div className="text-2xl font-black font-heading text-emerald-600">
            {availableProductsForDemo.length} SKU Ready
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Tersedia di stok gudang</div>
        </div>
      </div>

      {/* Sub-tab Navigation & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'active' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Peminjaman Aktif ({demoItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab('overdue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'overdue' 
                ? 'bg-rose-600 text-white' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Terlambat Kembali ({overdueItems.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama printer, customer, PIC peminjam, atau serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Demo List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Unit Printer Demo</th>
                <th className="py-3.5 px-4">Customer / Instansi</th>
                <th className="py-3.5 px-4">PIC Sales Peminjam</th>
                <th className="py-3.5 px-4">Tgl Pinjam & Tenggat</th>
                <th className="py-3.5 px-4">Status & Keterangan</th>
                <th className="py-3.5 px-4 text-right">Aksi Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data peminjaman unit demo yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const loan = item.demoLoanInfo;
                  const expDate = loan?.expectedReturnDate ? new Date(loan.expectedReturnDate) : null;
                  const isLate = expDate ? expDate < today : false;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Printer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=100&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <button
                              onClick={() => onSelectItem(item)}
                              className="font-bold text-slate-900 hover:text-purple-600 text-left transition-colors cursor-pointer line-clamp-1"
                            >
                              {item.name}
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SN: {item.serialNumber} • SKU: {item.sku}{item.barcode ? ` • Barcode: ${item.barcode}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loan?.customerName || item.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tujuan: {loan?.purpose || 'POC Demo'}
                          </div>
                        </div>
                      </td>

                      {/* Borrower PIC */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{loan?.borrowerName || item.pic}</div>
                          <div className="text-[10px] text-slate-400">{loan?.borrowerContact || '-'}</div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-slate-500">
                            Pinjam: {loan?.loanDate ? new Date(loan.loanDate).toLocaleDateString('id-ID') : '-'}
                          </div>
                          <div className={`font-bold text-xs flex items-center gap-1 ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                            <Calendar className="w-3 h-3" />
                            <span>Kembali: {expDate ? expDate.toLocaleDateString('id-ID') : '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isLate ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Terlambat</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-purple-500" />
                            <span>Masa Pinjam Aktif</span>
                          </span>
                        )}
                      </td>

                      {/* Receipt & Check-in Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenDemoReceipt(item)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Surat Demo</span>
                          </button>
                          <button
                            onClick={() => handleOpenCheckin(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Check-in Kembali</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Check-in Pengembalian */}
      {isCheckinModalOpen && selectedItemForCheckin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">CHECK-IN PENGEMBALIAN DEMO</h3>
              </div>
              <button onClick={() => setIsCheckinModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckin} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{selectedItemForCheckin.name}</div>
                <div className="text-slate-500 font-mono mt-0.5">SN: {selectedItemForCheckin.serialNumber}</div>
                <div className="text-slate-600 mt-1">Customer: {selectedItemForCheckin.demoLoanInfo?.customerName || selectedItemForCheckin.location}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kondisi Fisik Saat Kembali</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="bagus">Bagus (Fungsi Normal, Siap Dipinjamkan/Dijual)</option>
                  <option value="perlu_servis">Perlu Servis / Pembersihan Workshop</option>
                  <option value="rusak">Rusak / Ada Kerusakan Komponen</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Pengembalian & Kelengkapan</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Kabel power, adaptor, ribbon sisa, dan kartu tester telah dicek..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi Unit Kembali ke Gudang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tanda Terima Demo */}
      {isReceiptModalOpen && latestDemoReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">SURAT PEMINJAMAN UNIT DEMO</h3>
              </div>
              <button onClick={() => { setIsReceiptModalOpen(false); setLatestDemoReceipt(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Paper Preview */}
            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-slate-100/60">
              <div className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-xs text-slate-900 font-sans space-y-4 text-xs">
                
                {/* 1. Header with Logo & PT Name */}
                <div className="flex items-center gap-3">
                  <RisLogo size={36} />
                  <div className="text-base sm:text-lg font-black text-slate-700 tracking-tight uppercase font-heading">
                    {settings?.companyName || 'PT. REYCOM INTEGRATED SOLUSI'}
                  </div>
                </div>

                {/* 2. Document Title */}
                <div className="text-center pt-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    SURAT PEMINJAMAN UNIT DEMO
                  </h2>
                </div>

                {/* 3. Metadata No Surat & Date */}
                <div className="space-y-1 text-slate-800 text-[11px] font-medium">
                  <div>No Surat : <span className="font-semibold">{latestDemoReceipt.info.outgoingDocumentNumber || latestDemoReceipt.info.documentNumber || '-'}</span></div>
                  <div>Jakarta, {latestDemoReceipt.info.loanDate ? new Date(latestDemoReceipt.info.loanDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>

                {/* 4. Section Subheader: TANDA TERIMA */}
                <div className="text-center pt-1">
                  <span className="font-black text-xs sm:text-sm text-slate-900 underline underline-offset-4 uppercase">
                    TANDA TERIMA
                  </span>
                </div>

                {/* 5. Main Form Table */}
                {(() => {
                  const accText = (latestDemoReceipt.info.accessoriesNotes || '').toLowerCase();
                  const isBox = accText.includes('box') || accText.includes('kardus') || accText.includes('dus');
                  const isCable = accText.includes('kabel') || accText.includes('power') || accText.includes('cable');
                  const isAdaptor = accText.includes('adaptor') || accText.includes('adapter') || accText.includes('charger');

                  const loanDateStr = latestDemoReceipt.info.loanDate ? new Date(latestDemoReceipt.info.loanDate).toLocaleDateString('id-ID') : '-';
                  const returnDateStr = latestDemoReceipt.info.expectedReturnDate ? new Date(latestDemoReceipt.info.expectedReturnDate).toLocaleDateString('id-ID') : '-';
                  const periodText = latestDemoReceipt.info.loanPeriod ? `${latestDemoReceipt.info.loanPeriod} (${loanDateStr} s/d ${returnDateStr})` : `(${loanDateStr} s/d ${returnDateStr})`;

                  return (
                    <div className="border border-black divide-y divide-black text-[11px]">
                      {/* Nama Barang */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Nama Barang</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.item.name || latestDemoReceipt.info.productName || '-'}</div>
                      </div>

                      {/* Kode Barang */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Kode Barang</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.item.sku || latestDemoReceipt.info.productCode || '-'}</div>
                      </div>

                      {/* Serial Number */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Serial Number</div>
                        <div className="p-1.5 text-slate-900 font-medium">
                          {Array.isArray(latestDemoReceipt.info.serialNumbers) && latestDemoReceipt.info.serialNumbers.length > 1
                            ? latestDemoReceipt.info.serialNumbers.map((s: string, idx: number) => `Unit ${idx + 1}: ${s}`).join(' • ')
                            : (latestDemoReceipt.info.serialNumber || latestDemoReceipt.item.serialNumber || '-')}
                        </div>
                      </div>

                      {/* Kelengkapan / Accessories */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white flex flex-col justify-start">
                          <span>Kelengkapan /</span>
                          <span>Accessories</span>
                        </div>
                        <div className="p-2 space-y-2">
                          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium text-[11px]">
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isBox ? 'bg-black text-white' : 'bg-white'}`}>
                                {isBox ? '✓' : ''}
                              </span>
                              <span>Box / Kardus</span>
                            </label>
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isCable ? 'bg-black text-white' : 'bg-white'}`}>
                                {isCable ? '✓' : ''}
                              </span>
                              <span>Kabel Power</span>
                            </label>
                            <label className="flex items-center gap-1.5 select-none">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[9px] font-bold ${isAdaptor ? 'bg-black text-white' : 'bg-white'}`}>
                                {isAdaptor ? '✓' : ''}
                              </span>
                              <span>Adaptor</span>
                            </label>
                          </div>
                          {latestDemoReceipt.info.accessoriesNotes && (
                            <div className="text-[10px] text-slate-700 italic pt-1 border-t border-slate-200">
                              {latestDemoReceipt.info.accessoriesNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Periode / Lama Waktu Peminjaman */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white flex flex-col justify-start">
                          <span>Periode / Lama Waktu</span>
                          <span>Peminjaman</span>
                        </div>
                        <div className="p-1.5 text-slate-900 font-medium">{periodText}</div>
                      </div>

                      {/* Tujuan / Keperluan */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Tujuan / Keperluan</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.info.purpose || 'POC Demo'}</div>
                      </div>

                      {/* Nama Peminjam */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black">
                        <div className="p-1.5 font-bold text-slate-900 bg-white">Nama Peminjam</div>
                        <div className="p-1.5 text-slate-900 font-medium">{latestDemoReceipt.info.borrowerName || '-'}</div>
                      </div>

                      {/* Nama Perusahaan (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">Nama Perusahaan</div>
                        <div className="p-1.5 text-slate-900 font-bold">{latestDemoReceipt.info.companyName || latestDemoReceipt.info.customerName || '-'}</div>
                      </div>

                      {/* PIC Perusahaan (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">PIC Perusahaan</div>
                        <div className="p-1.5 text-slate-900 font-bold">{latestDemoReceipt.info.picReceiver || latestDemoReceipt.info.borrowerName || '-'}</div>
                      </div>

                      {/* No Telp & Email (Highlighted) */}
                      <div className="grid grid-cols-[160px_1fr] divide-x divide-black bg-[#FEF3C7]">
                        <div className="p-1.5 font-bold text-slate-900">No Telp & Email</div>
                        <div className="p-1.5 text-slate-900 font-medium">
                          {[latestDemoReceipt.info.borrowerContact, latestDemoReceipt.info.contactEmail].filter(Boolean).join('  /  ') || '-'}
                        </div>
                      </div>

                      {/* Keterangan */}
                      <div className="p-2 space-y-1 min-h-[70px]">
                        <div className="font-bold text-slate-900">Keterangan :</div>
                        <div className="text-[11px] text-slate-700 whitespace-pre-wrap">
                          {latestDemoReceipt.info.notes || latestDemoReceipt.item.notes || '-'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Signatures (Bottom) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-black p-2 flex flex-col justify-between h-28 text-center">
                    <div className="font-bold text-slate-900">Yang Menerima,</div>
                    <div className="text-slate-900 font-medium">
                      ( {latestDemoReceipt.info.borrowerName || '                                          '} )
                    </div>
                  </div>
                  <div className="border border-black p-2 flex flex-col justify-between h-28 text-center">
                    <div className="font-bold text-slate-900">Yang Menyerahkan,</div>
                    <div className="text-slate-900 font-medium">
                      ( {latestDemoReceipt.info.handedOverBy || latestDemoReceipt.info.loanedBy || settings?.picName || '                                          '} )
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsReceiptModalOpen(false); setLatestDemoReceipt(null); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveDemoReceipt}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Save File (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handlePrintDemoReceipt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout Demo Baru */}
      <CheckoutDemoModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        items={items}
        currentUser={currentUser}
        settings={settings}
        onCheckoutDemo={onCheckoutDemo}
        onShowReceipt={(item, info) => {
          setLatestDemoReceipt({ item, info });
          setIsReceiptModalOpen(true);
        }}
      />

    </div>
  );
};
