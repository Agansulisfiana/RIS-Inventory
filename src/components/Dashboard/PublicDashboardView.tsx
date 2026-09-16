import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Warehouse, 
  Clock, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  Package, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  UserCheck,
  Building2,
  Share2,
  LogIn
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { InventoryItem, StockTransaction, WarehouseSettings, User } from '../../types';
import { storageService } from '../../services/storage';
import { RisLogo } from '../Common/RisLogo';

interface PublicDashboardViewProps {
  items?: InventoryItem[];
  transactions?: StockTransaction[];
  settings?: WarehouseSettings;
  onExitPublicMode?: () => void;
  onOpenLogin?: () => void;
}

export const PublicDashboardView: React.FC<PublicDashboardViewProps> = ({
  onExitPublicMode,
  onOpenLogin,
  items: propItems,
  transactions: propTransactions,
  settings: propSettings
}) => {
  const [items, setItems] = useState<InventoryItem[]>(propItems || storageService.getItems());
  const [transactions, setTransactions] = useState<StockTransaction[]>(propTransactions || storageService.getTransactions());
  const [settings, setSettings] = useState<WarehouseSettings>(propSettings || storageService.getSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(10);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load Data
  const fetchData = () => {
    setIsRefreshing(true);
    const loadedItems = storageService.getItems();
    const loadedTx = storageService.getTransactions();
    const loadedSet = storageService.getSettings();
    const loadedUser = storageService.getCurrentUser();

    setItems(loadedItems);
    setTransactions(loadedTx);
    setSettings(loadedSet);
    setCurrentUser(loadedUser);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    fetchData();

    // Clock ticker every 1s
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-refresh data countdown every 1s (cycle 10s)
    const refreshTimer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    // Fullscreen change listener
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      clearInterval(clockInterval);
      clearInterval(refreshTimer);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
        setIsFullScreen(false);
      }
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=public-dashboard`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Metrics calculation
  const normalizeStatus = (status?: string) => {
    const s = (status || '').toLowerCase();

    if (['tersedia', 'in_warehouse', 'ready', 'available'].includes(s)) return 'in_warehouse';
    if (['on_demo', 'demo_loaned', 'demo', 'dipinjam'].includes(s)) return 'demo';
    if (['service', 'maintenance', 'repair', 'under_service'].includes(s)) return 'maintenance';
    if (['rusak', 'broken', 'afkir', 'hilang', 'lost'].includes(s)) return 'broken';
    return 'other';
  };

  const isInWarehouseItem = (item: InventoryItem) => {
    const status = normalizeStatus(item.status);
    return status === 'in_warehouse' || (status === 'other' && item.quantity > 0 && !item.demoLoanInfo?.active && item.status !== 'service' && item.status !== 'maintenance' && item.status !== 'rusak' && item.status !== 'broken');
  };

  const isDemoItem = (item: InventoryItem) => {
    const status = normalizeStatus(item.status);
    return status === 'demo' || Boolean(item.demoLoanInfo?.active);
  };

  const isMaintenanceItem = (item: InventoryItem) => {
    const status = normalizeStatus(item.status);
    return status === 'maintenance';
  };

  const isBrokenItem = (item: InventoryItem) => {
    const status = normalizeStatus(item.status);
    return status === 'broken';
  };

  const totalSkuCount = items.length;
  const inWarehouseItems = items.filter(isInWarehouseItem);
  const demoLoanedItems = items.filter(isDemoItem);
  const maintenanceItems = items.filter(isMaintenanceItem);
  const brokenItems = items.filter(isBrokenItem);

  const totalInWarehouseQuantity = inWarehouseItems.reduce((acc, curr) => acc + Math.max(0, curr.quantity), 0);
  const totalDemoQuantity = demoLoanedItems.reduce((acc, curr) => acc + Math.max(0, curr.demoLoanInfo?.quantity ?? curr.quantity), 0);
  const totalValuation = items.reduce((acc, curr) => acc + (Math.max(0, curr.quantity) * (curr.unitPrice ?? curr.price)), 0);

  const lowStockItems = items.filter(item => isInWarehouseItem(item) && item.quantity <= item.minStock);
  const overdueDemoItems = items.filter(item => {
    if (!isDemoItem(item) || !item.demoLoanInfo) return false;
    return new Date() > new Date(item.demoLoanInfo.expectedReturnDate);
  });

  const warehouseOccupancy = Math.min(
    100,
    Math.round((totalInWarehouseQuantity / Math.max(1, settings.warehouseCapacityUnits || 5000)) * 100)
  );

  const statusDistributionData = [
    { name: 'Di Gudang', value: totalInWarehouseQuantity, color: '#3b82f6' },
    { name: 'Demo Dipinjam', value: totalDemoQuantity, color: '#f59e0b' },
    { name: 'Maintenance', value: maintenanceItems.reduce((acc, c) => acc + Math.max(0, c.quantity), 0), color: '#8b5cf6' },
    { name: 'Rusak/Afkir', value: brokenItems.reduce((acc, c) => acc + Math.max(0, c.quantity), 0), color: '#ef4444' }
  ].filter(d => d.value > 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDateIndo = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,#0b1120_0%,#020817_100%)] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top TV/Public Header Banner */}
      <header className="bg-slate-900/80 border-b border-slate-700/70 px-4 sm:px-6 py-3.5 sticky top-0 z-40 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand & Warehouse Status */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <RisLogo size={36} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-black text-base text-white tracking-[-0.04em] leading-none">
                    RIS Inventory
                  </h1>
                  <span className="bg-blue-500/15 text-blue-300 border border-blue-500/35 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-[0.12em]">
                    Produk & Demo Unit
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate max-w-[240px] sm:max-w-xs mt-0.5 tracking-[0.02em]">
                  {settings.companyName} • {settings.warehouseName}
                </p>
              </div>
            </div>

            {/* Live Indicator Mobile */}
            <div className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">LIVE</span>
            </div>
          </div>

          {/* Center Clock & Auto-Refresh Progress */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono shadow-inner shadow-slate-900/70">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold text-white tracking-[0.08em]">
                {currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB
              </span>
              <span className="text-slate-400 text-[10px] hidden md:inline">
                • {formatDateIndo(currentTime)}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />

            {/* Auto refresh timer */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh: <strong className="text-blue-400 font-bold">{refreshCountdown}s</strong></span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Share Public Link Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyPublicLink}
              title="Salin Link Dashboard Publik untuk Layar TV atau Pihak Manajemen"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                copiedLink 
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
            </motion.button>

            {/* Fullscreen Mode Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullScreen}
              title={isFullScreen ? "Keluar Layar Penuh" : "Mode TV Layar Penuh"}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>

            {/* Back to Management / Login App */}
            {currentUser ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onExitPublicMode}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Buka Aplikasi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLogin}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Petugas</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Wallboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Live Status Bar & Alert Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200 tracking-wide font-heading uppercase">
              Live Real-Time Warehouse Telemetry
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              | Sinkronisasi lokal instan & pelacakan demo unit aktif
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lowStockItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{lowStockItems.length} SKU Stok Kritis</span>
              </span>
            )}
            {overdueDemoItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-lg">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>{overdueDemoItems.length} Demo Jatuh Tempo</span>
              </span>
            )}
            {lowStockItems.length === 0 && overdueDemoItems.length === 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Semua Stok & Unit Terkendali</span>
              </span>
            )}
          </div>
        </div>

        {/* 5-Card KPI Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          
          {/* KPI 1: Total Valuation */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/25 hover:border-blue-400/50 rounded-2xl space-y-2 shadow-[0_12px_30px_rgba(30,64,175,0.15)] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Nilai Aset Stok</span>
              <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
              {formatRupiah(totalValuation)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Dari total {totalSkuCount} SKU terdaftar
            </div>
          </motion.div>

          {/* KPI 2: Total Units In Warehouse */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Stok Fisik di Gudang</span>
              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight flex items-baseline gap-1.5">
              <span>{totalInWarehouseQuantity}</span>
              <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              {inWarehouseItems.length} SKU siap didistribusikan
            </div>
          </motion.div>

          {/* KPI 3: Demo Unit Active */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-4 sm:p-5 bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl space-y-2 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Demo Unit Dipinjam</span>
              <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-amber-400 tracking-tight flex items-baseline gap-1.5">
              <span>{totalDemoQuantity}</span>
              <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {demoLoanedItems.length} produk di tangan sales/klien
            </div>
          </motion.div>

          {/* KPI 4: Low Stock Alert */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Peringatan Stok Tipis</span>
              <div className="w-7 h-7 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-rose-400 tracking-tight flex items-baseline gap-1.5">
              <span>{lowStockItems.length}</span>
              <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Perlu segera restock/inbound
            </div>
          </motion.div>

          {/* KPI 5: Capacity Occupancy */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Okupansi Kapasitas</span>
              <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight flex items-baseline gap-1.5">
              <span>{warehouseOccupancy}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  warehouseOccupancy > 85 ? 'bg-rose-500' : warehouseOccupancy > 65 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${warehouseOccupancy}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Demo Units Board & Status Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Active Demo Loans Board (7 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading font-bold text-white text-sm">
                  Pelacakan Demo Unit yang Sedang Dipinjam
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                {demoLoanedItems.length} Unit Di Luar
              </span>
            </div>

            {demoLoanedItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada demo unit yang sedang dipinjam saat ini. Semua unit berada aman di gudang.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {demoLoanedItems.map((item) => {
                  const isOverdue = item.demoLoanInfo && new Date() > new Date(item.demoLoanInfo.expectedReturnDate);
                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isOverdue 
                          ? 'bg-rose-950/30 border-rose-500/40 shadow-sm' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-xs text-white truncate">{item.name}</div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isOverdue ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isOverdue ? 'JATUH TEMPO' : 'DIPINJAM'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono mb-2">
                        SKU: <strong className="text-slate-300">{item.sku}</strong> • Lokasi: {item.location}
                      </div>

                      {item.demoLoanInfo && (
                        <div className="space-y-1 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Peminjam:</span>
                            <span className="font-semibold text-slate-200">{item.demoLoanInfo.borrowerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tujuan:</span>
                            <span className="text-slate-300 truncate max-w-[140px]">{item.demoLoanInfo.purpose}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Est. Kembali:</span>
                            <span className={`font-mono font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                              {new Date(item.demoLoanInfo.expectedReturnDate).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Status Breakdown Chart (5 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-white text-sm">
                Distribusi Kondisi & Status Stok
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Total {items.reduce((acc, c) => acc + c.quantity, 0)} Unit
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              {statusDistributionData.map((d) => (
                <div key={d.name} className="flex items-center justify-between p-1.5 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300 text-[11px] truncate">{d.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Real-Time Recent Transactions Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
              <h3 className="font-heading font-bold text-white text-sm">
                Feed Aktivitas Mutasi Terkini Gudang
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Live Stream
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {transactions.slice(0, 4).map((tx) => {
              const isInbound = tx.type === 'inbound';
              const isOutbound = tx.type === 'outbound';
              const isDemo = tx.type === 'demo_loan' || tx.type === 'demo_return';

              return (
                <div 
                  key={tx.id} 
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                      isInbound 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : isOutbound 
                        ? 'bg-rose-500/20 text-rose-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isInbound && <ArrowDownLeft className="w-3 h-3" />}
                      {isOutbound && <ArrowUpRight className="w-3 h-3" />}
                      <span>{tx.type.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white truncate">{tx.itemName}</div>
                  <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                    <span>Jumlah: <strong className="text-slate-200">{tx.quantity} unit</strong></span>
                    <span className="text-slate-500 truncate max-w-[90px]">{tx.performedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Public Share Guidance Box */}
        <div className="p-4 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="text-slate-300">
              <strong>Tautan Layar Publik Aktif:</strong> Anda dapat menampilkan halaman ini di Smart TV gudang, monitor lobi, atau membagikan link ke pimpinan tanpa perlu login akun.
            </div>
          </div>
          <button
            onClick={copyPublicLink}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Tersalin!' : 'Salin URL Layar Publik'}</span>
          </button>
        </div>

      </main>
    </div>
  );
};
