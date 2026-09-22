import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  ArrowDownLeft,
  Layers, 
  Wrench, 
  ClipboardCheck, 
  ArrowRightLeft, 
  FileText, 
  Settings as SettingsIcon, 
  Users, 
  QrCode, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Tv, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle,
  Building2, 
  ChevronRight,
  Plus,
  BarChart3
} from 'lucide-react';
import { 
  InventoryItem, 
  StockTransaction, 
  SalesOrder,
  GoodsReceipt,
  ServiceTicket, 
  StockOpnameSession, 
  User, 
  WarehouseSettings,
  NavTab,
  AuditLog
} from './types';
import { storageService } from './services/storage';
import { exportService } from './services/exportService';
import { getPermissions } from './utils/permissions';
import { 
  triggerSuccessConfetti, 
  triggerLogoCelebration, 
  triggerClickParticles, 
  playFeedbackSound 
} from './utils/animation';

// Component Views
import { OverviewTab } from './components/Dashboard/OverviewTab';
import { PublicDashboardView } from './components/Dashboard/PublicDashboardView';
import { ProductCatalogTab } from './components/Products/ProductCatalogTab';
import { ProductFormModal } from './components/Products/ProductFormModal';
import { DeletePinModal } from './components/Products/DeletePinModal';
import { SalesOrdersTab } from './components/Sales/SalesOrdersTab';
import { GoodsReceiptTab } from './components/Purchasing/GoodsReceiptTab';
import { DemoCenterTab } from './components/DemoUnits/DemoCenterTab';
import { RisLogo } from './components/Common/RisLogo';
import { StockMovementTab } from './components/Transactions/StockMovementTab';
import { StockOpnameTab } from './components/Opname/StockOpnameTab';
import { ServiceTicketTab } from './components/Service/ServiceTicketTab';
import { InvReportsTab } from './components/Reports/InvReportsTab';
import { InvSettingsTab } from './components/Settings/InvSettingsTab';
import { UsersTab } from './components/Users/UsersTab';
import { UnitDetailModal } from './components/Inventory/UnitDetailModal';
import { BarcodePrintModal } from './components/Inventory/BarcodePrintModal';
import { BarcodeScannerModal } from './components/Scanner/BarcodeScannerModal';
import { LoginModal } from './components/Auth/LoginModal';
import { StockMovementModal } from './components/Transactions/StockMovementModal';
import { PWAInstallButton } from './components/PWA/PWAInstallButton';
import { OfflineIndicator } from './components/PWA/OfflineIndicator';

export type MainNavTab = 
  | 'dashboard' 
  | 'products' 
  | 'sales_orders' 
  | 'goods_receipt' 
  | 'movement' 
  | 'transaksi' 
  | 'stock_opname' 
  | 'demo_center' 
  | 'service' 
  | 'reports' 
  | 'users' 
  | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<WarehouseSettings>(storageService.getSettings());

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals & Drawers
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodePrintItem, setBarcodePrintItem] = useState<InventoryItem | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isStockMovementModalOpen, setIsStockMovementModalOpen] = useState(false);

  const openDeletePinModal = (id: string) => {
    setDeleteTargetId(id);
    setIsPinModalOpen(true);
  };

  const closeDeletePinModal = () => {
    setIsPinModalOpen(false);
    setDeleteTargetId(null);
  };

  const confirmDeleteProduct = (pin: string) => {
    // If PIN is set in settings, validate it; otherwise allow deletion.
    if (settings.adminPin && pin !== settings.adminPin) {
      showToast('PIN Salah', 'Kode keamanan tidak cocok. Penghapusan dibatalkan.', true);
      return;
    }
    if (!deleteTargetId) return;
    const success = storageService.deleteItem(deleteTargetId);
    if (success) {
      refreshData();
      showToast('Produk Dihapus', 'Master produk berhasil dihapus dari sistem.');
    }
    closeDeletePinModal();
  };

  // Updated delete handler to open PIN modal
  const handleDeleteProduct = (id: string) => {
    if (!permissions.canEditProducts) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menghapus produk.');
      return;
    }
    openDeletePinModal(id);
  };  
  // Public TV Wallboard Mode
  const [isPublicDashboardMode, setIsPublicDashboardMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'public-dashboard' || window.location.hash.includes('public-dashboard');
    }
    return false;
  });

  // Global Header Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Toast with Animation & Sound Feedback
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; isError?: boolean } | null>(null);
  const showToast = (title: string, desc: string, isError: boolean = false) => {
    const errorState = isError || title.toLowerCase().includes('gagal') || title.toLowerCase().includes('ditolak');
    setToastMessage({ title, desc, isError: errorState });
    if (!errorState) {
      triggerSuccessConfetti();
      playFeedbackSound('success');
    } else {
      playFeedbackSound('action');
    }
    setTimeout(() => setToastMessage(null), 4500);
  };

  const refreshData = () => {
    setItems(storageService.getItems());
    setTransactions(storageService.getTransactions());
    setSalesOrders(storageService.getSalesOrders());
    setGoodsReceipts(storageService.getGoodsReceipts());
    setServiceTickets(storageService.getServiceTickets());
    setAuditLogs(storageService.getAuditLogs());
    setSettings(storageService.getSettings());
  };

  const permissions = getPermissions(currentUser?.role);

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered items for global search
  const searchResults = globalSearch.trim()
    ? items.filter(i => 
        i.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        i.serialNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (Array.isArray(i.serialNumbers) && i.serialNumbers.some(s => s?.toLowerCase().includes(globalSearch.toLowerCase()))) ||
        i.sku.toLowerCase().includes(globalSearch.toLowerCase()) ||
        i.brand.toLowerCase().includes(globalSearch.toLowerCase()) ||
        i.location.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelectSearchResult = (item: InventoryItem) => {
    setSelectedDetailItem(item);
    setGlobalSearch('');
    setIsSearchFocused(false);
  };

  const handleAddNewMovement = () => {
    if (!permissions.canPerformOpname) { // Assuming canPerformOpname for stock movement permission
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menambah pergerakan stok.');
      return;
    }
    setIsStockMovementModalOpen(true);
  };

  const handleSaveStockMovement = (newTransaction: Omit<StockTransaction, 'id'>) => {
    if (!permissions.canPerformOpname) { // Assuming canPerformOpname for stock movement permission
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menyimpan pergerakan stok.');
      return false;
    }

    // Move the stock balance between the selected locations, then save it with
    // the acting user so the storage permission check can authorize the action.
    const itemToUpdate = items.find(item => item.id === newTransaction.itemId);
    if (!itemToUpdate) {
      showToast('Pergerakan Gagal', 'Produk yang dipilih tidak ditemukan. Silakan pilih kembali.');
      return false;
    }

    const warehouseStocks = { ...(itemToUpdate.warehouseStocks || {}) };
    const sourceKey = Object.keys(warehouseStocks).find(key =>
      key === newTransaction.fromLocation ||
      newTransaction.fromLocation.startsWith(`${key} -`)
    ) || newTransaction.fromLocation;
    const sourceQuantity = Number(warehouseStocks[sourceKey] || 0);

    if (newTransaction.quantity > sourceQuantity) {
      showToast('Pergerakan Gagal', `Stok di lokasi asal hanya tersedia ${sourceQuantity} ${itemToUpdate.unit}.`);
      return false;
    }

    try {
      warehouseStocks[sourceKey] = sourceQuantity - newTransaction.quantity;
      warehouseStocks[newTransaction.toLocation] = Number(warehouseStocks[newTransaction.toLocation] || 0) + newTransaction.quantity;
      const updatedItem: InventoryItem = {
        ...itemToUpdate,
        warehouseStocks,
        location: newTransaction.toLocation,
        warehouseName: newTransaction.toLocation,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Admin'
      };
      storageService.saveItem(updatedItem, currentUser || undefined);
      storageService.addTransaction({
        ...newTransaction,
        unit: itemToUpdate.unit || 'Unit'
      });
      refreshData();
      showToast('Pergerakan Stok Berhasil', `Unit ${newTransaction.itemName} berhasil dipindahkan dari ${newTransaction.fromLocation} ke ${newTransaction.toLocation}.`);
      setIsStockMovementModalOpen(false);
      return true;
    } catch (error) {
      showToast('Pergerakan Gagal', error instanceof Error ? error.message : 'Pergerakan stok tidak dapat disimpan.');
      return false;
    }
  };

  // Product Operations
  const handleAddNewProduct = () => {
    if (!permissions.canEditProducts) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menambah produk.');
      return;
    }
    setItemToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (item: InventoryItem) => {
    if (!permissions.canEditProducts) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah data produk.');
      return;
    }
    setItemToEdit(item);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (itemData: any) => {
    if (!permissions.canEditProducts) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menyimpan produk.');
      return;
    }

    if (itemData.id) {
      storageService.saveItem(itemData);
      showToast('Produk Diperbarui', `Data produk "${itemData.name}" berhasil disimpan.`);
    } else {
      storageService.addItem(itemData, currentUser || undefined);
      showToast('Produk Ditambahkan', `Master produk "${itemData.name}" berhasil didaftarkan.`);
    }
    refreshData();
    setIsProductModalOpen(false);
  };



  const handleQuickAdjustStock = (id: string, delta: number, notes?: string, warehouse?: string) => {
    if (!permissions.canEditProducts) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menyesuaikan stok.');
      return;
    }

    const ok = storageService.adjustItemStock(
      id, 
      delta, 
      delta > 0 ? 'Masuk' : 'Keluar', 
      notes || `Restock manual (${delta > 0 ? `+${delta}` : delta})`, 
      currentUser || undefined,
      warehouse
    );
    if (ok) {
      refreshData();
      showToast(
        'Stok Berhasil Disesuaikan', 
        `Stok barang berhasil ${delta > 0 ? `ditambah +${delta}` : `dikurangi ${Math.abs(delta)}`} unit.`
      );
    }
  };

  // Sales Order Creation
  const handleCreateSalesOrder = (order: Omit<SalesOrder, 'id'>) => {
    if (!permissions.canCreateSales) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk membuat sales order.');
      return;
    }

    const created = storageService.createSalesOrder(order, currentUser || undefined);
    refreshData();
    showToast('Penjualan Berhasil Diterbitkan', `No. Invoice ${created.orderNumber} berhasil dibuat & stok telah dipotong.`);
  };

  const handleUpdateSalesOrder = (id: string, updates: Partial<SalesOrder>) => {
    const updated = storageService.updateSalesOrder(id, updates);
    if (!updated) {
      showToast('Status DO Tidak Diperbarui', 'Data surat jalan tidak ditemukan.');
      return;
    }

    refreshData();
    showToast('Status DO Diperbarui', `Status pengiriman berhasil diubah menjadi ${updated.deliveryStatus}.`);
  };

  // Goods Receipt Creation
  const handleCreateGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id'>) => {
    if (!permissions.canReceiveGoods) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk membuat penerimaan barang.');
      return;
    }

    const created = storageService.createGoodsReceipt(receipt, currentUser || undefined);
    refreshData();
    showToast('Penerimaan Barang Selesai', `Tanda terima ${created.receiptNumber} disimpan & stok bertambah ke gudang.`);
  };

  // Demo Operations
  const handleCheckoutDemo = (itemId: string, info: any): boolean => {
    const it = items.find(i => i.id === itemId);
    if (!it) return false;
    if (!permissions.canManageDemo) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk meminjam unit demo.');
      return false;
    }

    try {
      const updatedItem: InventoryItem = {
        ...it,
        status: 'tersedia',
        location: `Customer: ${info.customerName}`,
        pic: info.borrowerName,
        demoLoanInfo: info,
        lastUpdated: new Date().toISOString(),
        updatedBy: info.handedOverBy || currentUser?.name || 'Sales'
      };

      storageService.saveItem(updatedItem, currentUser || undefined);

      const snVal = (info.serialNumbers && info.serialNumbers.length > 0)
        ? info.serialNumbers.join(', ')
        : (info.serialNumber || it.serialNumber || '-');

      storageService.addTransaction({
        transactionNumber: info.documentNumber || `DO-DEMO-${Date.now().toString().slice(-5)}`,
        timestamp: info.loanDate,
        type: 'Demo Out',
        itemId: it.id,
        itemSku: it.sku,
        serialNumber: snVal,
        itemName: it.name,
        fromLocation: it.location,
        toLocation: `Customer: ${info.customerName}`,
        quantity: info.quantity || 1,
        unit: it.unit || 'Unit',
        pic: info.borrowerName,
        status: 'On Demo',
        notes: `Peminjaman demo: ${info.quantity || 1} ${it.unit || 'Unit'} - ${info.purpose}${info.handedOverBy ? ` (Diserahkan oleh: ${info.handedOverBy})` : ''}`,
        customer: info.customerName
      });

      refreshData();
      showToast('Checkout Demo Berhasil', `${info.quantity || 1} ${it.unit || 'Unit'} ${it.name} dipinjamkan ke ${info.customerName}. Tanda terima siap dibuat secara manual.`);
      return true;
    } catch (error) {
      console.error('Checkout demo failed:', error);
      showToast('Checkout Demo Gagal', 'Proses keluarkan unit demo gagal. Periksa izin akses dan data yang diisi.');
      return false;
    }
  };

  const handleCheckinDemo = (itemId: string, returnNotes: string, condition: string) => {
    const it = items.find(i => i.id === itemId);
    if (!it) return;

    if (!permissions.canManageDemo) {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menerima pengembalian demo.');
      return;
    }

    try {
      const prevCustomer = it.demoLoanInfo?.customerName || it.location;

      const updatedItem: InventoryItem = {
        ...it,
        status: 'tersedia',
        condition: condition as any,
        location: 'Gudang Utama Jakarta - Rak A01',
        pic: currentUser?.name || 'Admin',
        demoLoanInfo: undefined,
        notes: returnNotes ? `Pengembalian demo: ${returnNotes}` : it.notes,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Admin'
      };

      storageService.saveItem(updatedItem, currentUser || undefined);

      storageService.addTransaction({
        transactionNumber: `DI-DEMO-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString(),
        type: 'Demo In',
        itemId: it.id,
        itemSku: it.sku,
        serialNumber: it.serialNumber,
        itemName: it.name,
        fromLocation: prevCustomer,
        toLocation: 'Gudang Utama Jakarta - Rak A01',
        quantity: 1,
        unit: it.unit || 'Unit',
        pic: currentUser?.name || 'Admin',
        status: 'Selesai',
        notes: `Pengembalian unit demo selesai (+1 ${it.unit || 'Unit'}). Kondisi: ${condition}. ${returnNotes}`
      });

      refreshData();
      showToast('Check-in Pengembalian Sukses', `Unit ${it.name} telah kembali ke Gudang Utama Jakarta.`);
    } catch (error) {
      console.error('Check-in demo failed:', error);
      showToast('Check-in Demo Gagal', 'Proses pengembalian unit demo gagal. Periksa izin akses dan data yang diisi.');
    }
  };

  // Login check
  if (!currentUser) {
    return (
      <LoginModal 
        isOpen={true}
        settings={settings}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
          showToast('Login Berhasil', `Selamat datang, ${user.name}!`);
        }} 
        onOpenPublicDashboard={() => setIsPublicDashboardMode(true)}
      />
    );
  }

  // If Public Wallboard mode is active
  if (isPublicDashboardMode) {
    return (
      <PublicDashboardView 
        items={items}
        transactions={transactions}
        settings={settings}
        onExitPublicMode={() => {
          setIsPublicDashboardMode(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.pushState({}, '', url.toString());
          }
        }}
      />
    );
  }

  // Sidebar navigation structure: Prioritizing Commercial, Sales, & Inventory
  const navGroups = [
    {
      title: 'PENJUALAN & PRODUK (UTAMA)',
      items: [
        { id: 'dashboard' as MainNavTab, label: 'Dashboard Bisnis', icon: LayoutDashboard },
        { id: 'products' as MainNavTab, label: 'Katalog & Stok Dijual', icon: Package },
        { id: 'sales_orders' as MainNavTab, label: 'Penjualan (DO Keluar)', icon: ShoppingCart },
        { id: 'goods_receipt' as MainNavTab, label: 'Penerimaan Supplier (PO)', icon: ArrowDownLeft },
      ]
    },
    {
      title: 'GUDANG & OPERASIONAL',
      items: [
        { id: 'movement' as MainNavTab, label: 'Mutasi Stok & Log', icon: ArrowRightLeft },
        { id: 'stock_opname' as MainNavTab, label: 'Stock Opname (Audit)', icon: ClipboardCheck },
        { id: 'demo_center' as MainNavTab, label: 'Pusat Unit Demo', icon: PlayCircle },
        { id: 'service' as MainNavTab, label: 'Service & Maintenance', icon: Wrench },
      ]
    },
    {
      title: 'LAPORAN & SISTEM',
      items: [
        { id: 'reports' as MainNavTab, label: 'Pusat Laporan & Ekspor', icon: FileText },
        { id: 'users' as MainNavTab, label: 'Kelola Pengguna', icon: Users },
        { id: 'settings' as MainNavTab, label: 'Pengaturan Perusahaan', icon: SettingsIcon },
      ]
    }
  ];

  // Filter nav items by permissions for current user
  const isNavAllowed = (id: string) => {
    if (id === 'users') return permissions.canManageUsers;
    if (id === 'settings' || id === 'pengaturan') return permissions.canAccessSettings;
    if (id === 'sales_orders') return permissions.canCreateSales;
    if (id === 'goods_receipt') return permissions.canReceiveGoods;
    if (id === 'service') return permissions.canManageService;
    if (id === 'stock_opname') return permissions.canPerformOpname;
    if (id === 'demo_center') return permissions.canManageDemo;
    if (id === 'reports') return permissions.canViewReports;
    return true;
  };

  const filteredNavGroups = navGroups
    .map(g => ({ ...g, items: g.items.filter(i => isNavAllowed(i.id as string)) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 backdrop-blur-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold">{toastMessage.title}</div>
              <div className="text-[11px] text-slate-300">{toastMessage.desc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden h-screen">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 transition-all duration-200 z-30 select-none`}>
          
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
            <div 
              onClick={(e) => {
                triggerLogoCelebration(e);
                playFeedbackSound('click');
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group active:scale-95 transition-transform"
              title="Klik logo RIS untuk animasi!"
            >
              <RisLogo size={isSidebarCollapsed ? 32 : 36} />
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-black font-heading text-slate-900 tracking-tight text-sm block leading-none truncate group-hover:text-blue-600 transition-colors">
                    RIS Inventory
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase truncate block mt-0.5">
                    PRODUK & DEMO UNIT
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nav Items List */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {filteredNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full py-1.5 px-3 rounded-lg text-slate-500 hover:bg-slate-100 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>{isSidebarCollapsed ? '→' : '← Minimalkan Menu'}</span>
            </button>

            {!isSidebarCollapsed && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">
                  {settings.companyName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {settings.warehouseName}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN APP CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* TOP HEADER */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
            
            {/* Left: Mobile menu toggle + Global Search */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0 cursor-pointer"
                title="Buka Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk, SN, SKU..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all truncate"
                />

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 space-y-1 max-w-[calc(100vw-2rem)]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Hasil Pencarian Cepat</div>
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => handleSelectSearchResult(item)}
                        className="p-2 hover:bg-blue-50 rounded-lg flex items-center justify-between cursor-pointer gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                          <div className="font-mono text-[10px] text-blue-600 truncate">SKU: {item.sku} • SN: {item.serialNumber}</div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          Stok: {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions, TV Wallboard, User Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* PWA In-App Install Button */}
              <PWAInstallButton variant="header" />

              {/* TV Wallboard link */}
              <button
                onClick={() => setIsPublicDashboardMode(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                title="Buka Tampilan TV Wallboard Publik"
              >
                <Tv className="w-3.5 h-3.5 text-slate-600" />
                <span>TV Wallboard</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">Pusat Notifikasi Stok</span>
                      <span className="text-[10px] text-blue-600 font-bold">2 Peringatan</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-800 text-[11px]">
                        <strong>Demo Terlambat:</strong> IDP Smart-81 di PT. Sukses Abadi telah melewati batas tanggal kembali.
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-800 text-[11px]">
                        <strong>Stok Kritis:</strong> Cleaning Kit Universal tersisa 3 box di Rak B05.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-left max-w-[120px]">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium capitalize truncate">
                    {currentUser.department || currentUser.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    storageService.logout();
                    setCurrentUser(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-0.5 sm:ml-1"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          </header>

          {/* MAIN TAB CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && (
              <OverviewTab
                items={items}
                transactions={transactions}
                salesOrders={salesOrders}
                goodsReceipts={goodsReceipts}
                serviceTickets={serviceTickets}
                currentUser={currentUser}
                settings={settings}
                onNavigate={(tab) => setActiveTab(tab as MainNavTab)}
                onSelectItem={(item) => setSelectedDetailItem(item)}
                onAddNewProduct={handleAddNewProduct}
                onOpenSalesModal={() => setActiveTab('sales_orders')}
                onOpenReceiptModal={() => setActiveTab('goods_receipt')}
                onQuickRestock={handleQuickAdjustStock}
              />
            )}

            {activeTab === 'products' && (
              <ProductCatalogTab
                items={items}
                currentUser={currentUser}
                settings={settings}
                onSelectItem={(item) => setSelectedDetailItem(item)}
                onAddNewProduct={handleAddNewProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickAdjustStock={handleQuickAdjustStock}
                onPrintBarcode={(item) => setBarcodePrintItem(item)}
                onOpenSalesModal={() => setActiveTab('sales_orders')}
                onOpenReceiptModal={() => setActiveTab('goods_receipt')}
              />
            )}

            {activeTab === 'sales_orders' && (
              <SalesOrdersTab
                salesOrders={salesOrders}
                items={items}
                currentUser={currentUser}
                settings={settings}
                onCreateSalesOrder={handleCreateSalesOrder}
                onUpdateSalesOrder={handleUpdateSalesOrder}
              />
            )}

            {activeTab === 'goods_receipt' && (
              <GoodsReceiptTab
                goodsReceipts={goodsReceipts}
                items={items}
                currentUser={currentUser}
                settings={settings}
                onCreateGoodsReceipt={handleCreateGoodsReceipt}
              />
            )}

            {activeTab === 'demo_center' && (
              <DemoCenterTab
                items={items}
                currentUser={currentUser}
                settings={settings}
                onCheckoutDemo={handleCheckoutDemo}
                onCheckinDemo={handleCheckinDemo}
                onSelectItem={(item) => setSelectedDetailItem(item)}
              />
            )}

            {(activeTab === 'movement' || activeTab === 'transaksi') && (
              <StockMovementTab
                transactions={transactions}
                items={items}
                currentUser={currentUser}
                settings={settings}
                onAddNewMovement={handleAddNewMovement}
              />
            )}

            {activeTab === 'stock_opname' && (
              <StockOpnameTab
                items={items}
                currentUser={currentUser}
                settings={settings}
                onSaveOpname={(session) => {
                  storageService.saveStockOpname(session);
                  showToast('Draft SO Tersimpan', `No. ${session.soNumber} disimpan.`);
                }}
                onFinishOpname={(session) => {
                  if (!permissions.canPerformOpname) {
                    showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menyelesaikan stock opname.');
                    return;
                  }

                  storageService.approveAndApplyStockOpname(session.id, currentUser);
                  refreshData();
                  showToast('Stock Opname Selesai', `Stok fisik telah disinkronkan & disetujui.`);
                }}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'service' && (
              <ServiceTicketTab
                tickets={serviceTickets}
                items={items}
                currentUser={currentUser}
                settings={settings}
                onAddNewTicket={(ticket) => {
                  if (!permissions.canManageService) {
                    showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk membuat service ticket.');
                    return;
                  }
                  storageService.createServiceTicket(ticket, currentUser);
                  refreshData();
                  showToast('Tiket Dibuat', `Service ticket ${ticket.ticketNumber} berhasil dibuat.`);
                }}
                onUpdateTicket={(id, updates) => {
                  if (!permissions.canManageService) {
                    showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk memperbarui service ticket.');
                    return;
                  }
                  storageService.updateServiceTicket(id, updates, currentUser);
                  refreshData();
                  showToast('Ticket Diperbarui', 'Data service ticket berhasil diperbarui.');
                }}
                onCloseTicket={(id) => {
                  if (!permissions.canManageService) {
                    showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menutup service ticket.');
                    return;
                  }
                  storageService.updateServiceTicket(id, { status: 'Selesai' }, currentUser);
                  refreshData();
                  showToast('Ticket Ditutup', 'Service ticket telah diselesaikan & unit kembali siap.');
                }}
              />
            )}

            {activeTab === 'reports' && (
              <InvReportsTab
                items={items}
                transactions={transactions}
                serviceTickets={serviceTickets}
                auditLogs={auditLogs}
                settings={settings}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                currentUser={currentUser}
                onRefreshUsers={refreshData}
              />
            )}

            {activeTab === 'settings' && (
              <InvSettingsTab
                settings={settings}
                currentUser={currentUser}
                onRefreshData={refreshData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal Add / Edit Master Product */}
      {isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          itemToEdit={itemToEdit}
          currentUser={currentUser}
          settings={settings}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}

      {/* Modal Detail Item & Barcode Label Preview */}
      {selectedDetailItem && (
        <UnitDetailModal
          item={selectedDetailItem}
          items={items}
          currentUser={currentUser}
          settings={settings}
          onClose={() => setSelectedDetailItem(null)}
          onEdit={(item) => {
            handleEditProduct(item);
            setSelectedDetailItem(null);
          }}
          onRefreshData={() => {
            refreshData();
            // sync selectedDetailItem with latest from storage
            const freshItem = storageService.getItems().find(i => i.id === selectedDetailItem.id);
            if (freshItem) setSelectedDetailItem(freshItem);
          }}
        />
      )}

      {/* Modal Camera Barcode Scanner */}
      {isScannerOpen && (
        <BarcodeScannerModal
          items={items}
          settings={settings}
          initialMode="lookup"
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={(item) => {
            setSelectedDetailItem(item);
            setIsScannerOpen(false);
          }}
        />
      )}

      {/* Modal Add Stock Movement */}
      {isStockMovementModalOpen && (
        <StockMovementModal
          isOpen={isStockMovementModalOpen}
          onClose={() => setIsStockMovementModalOpen(false)}
          onSave={handleSaveStockMovement}
          items={items}
          currentUser={currentUser}
          settings={settings}
        />
      )}

      {/* Modal Cetak Stiker Barcode Satuan */}
      {barcodePrintItem && (
        <BarcodePrintModal
          item={barcodePrintItem}
          isOpen={Boolean(barcodePrintItem)}
          onClose={() => setBarcodePrintItem(null)}
          settings={settings}
        />
      )}

      {/* Delete PIN Confirmation Modal */}
      <DeletePinModal
        isOpen={isPinModalOpen}
        productName={items.find(i => i.id === deleteTargetId)?.name}
        hasPinSet={!!settings.adminPin}
        onConfirm={confirmDeleteProduct}
        onCancel={closeDeletePinModal}
      />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-72 max-w-[85vw] bg-white h-full p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <RisLogo size={32} />
                  <div>
                    <div className="font-black text-slate-900 text-sm leading-tight">RIS Inventory</div>
                    <div className="text-[9px] text-blue-600 font-bold uppercase">Produk & Demo Unit</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
                {filteredNavGroups.flatMap(g => g.items).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
              <PWAInstallButton variant="settings" />
              <button
                onClick={() => {
                  storageService.logout();
                  setCurrentUser(null);
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scanner Action for Mobile Devices */}
      <button
        onClick={() => setIsScannerOpen(true)}
        className="sm:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform cursor-pointer"
        title="Buka Kamera Barcode Scanner"
        aria-label="Scan Barcode"
      >
        <QrCode className="w-5 h-5" />
      </button>

      {/* Global Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Global Interactive Animated Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 30, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl flex items-start gap-3 select-none"
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              toastMessage.isError 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {toastMessage.isError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h4 className="font-black text-sm font-heading tracking-tight">{toastMessage.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
