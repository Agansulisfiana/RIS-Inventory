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
import { getInventoryStockState } from '../../utils/inventoryStock';
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

  const stockBreakdown = items
    .filter(item => item.quantity > 0 || (item.demoLoanInfo && item.demoLoanInfo.active))
    .map(item => {
      const stock = getInventoryStockState(item);
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit || 'unit',
        totalQuantity: Math.max(0, item.quantity),
        readyQuantity: stock.readyQuantity,
        demoQuantity: stock.demoQuantity,
        location: item.location
      };
    })
    .sort((a, b) => (b.readyQuantity + b.demoQuantity) - (a.readyQuantity + a.demoQuantity));

  const totalInWarehouseQuantity = stockBreakdown.reduce((acc, curr) => acc + curr.readyQuantity, 0);
  const totalDemoQuantity = demoLoanedItems.reduce((acc, curr) => acc + Math.max(0, curr.demoLoanInfo?.quantity ?? curr.quantity), 0);
  const totalValuation = items.reduce((acc, curr) => acc + (Math.max(0, curr.quantity) * (curr.unitPrice ?? curr.price)), 0);

  const lowStockItems = items.filter(item => isInWarehouseItem(item) && getInventoryStockState(item).readyQuantity <= item.minStock);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_30%),linear-gradient(180deg,#0b1120_0%,#020817_100%)] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-700/70 bg-slate-950/75 px-4 py-3.5 shadow-[0_18px_42px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-2 shadow-[0_0_24px_rgba(59,130,246,0.22)]">
                <RisLogo size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-base font-black leading-none tracking-[-0.04em] text-white">
                    RIS Inventory
                  </h1>
                  <span className="rounded-full border border-blue-500/35 bg-blue-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-blue-300">
                    TV Wallboard
                  </span>
                </div>
                <p className="mt-0.5 max-w-[240px] truncate text-xs font-medium tracking-[0.02em] text-slate-300 sm:max-w-xs">
                  {settings.companyName} • {settings.warehouseName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 sm:hidden">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-1.5 text-xs font-mono shadow-inner shadow-slate-900/80">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-bold tracking-[0.08em] text-white">
                {currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB
              </span>
              <span className="hidden text-[10px] text-slate-400 md:inline">
                • {formatDateIndo(currentTime)}
              </span>
            </div>

            <div className="hidden h-3.5 w-px bg-slate-800 sm:block" />

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <RefreshCw className={`h-3 w-3 text-slate-400 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>
                Refresh: <strong className="font-bold text-blue-400">{refreshCountdown}s</strong>
              </span>
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyPublicLink}
              title="Salin Link Dashboard Publik untuk Layar TV atau Pihak Manajemen"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                copiedLink
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-blue-400" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullScreen}
              title={isFullScreen ? 'Keluar Layar Penuh' : 'Mode TV Layar Penuh'}
              className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition-colors hover:border-slate-600 hover:text-white cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4 text-blue-400" /> : <Maximize2 className="h-4 w-4" />}
            </motion.button>

            {currentUser ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onExitPublicMode}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-500 cursor-pointer"
              >
                <span>Buka Aplikasi</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-500 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login Petugas</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-[radial-gradient(circle_at_left,rgba(59,130,246,0.22),transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_38%,#0b1120_100%)] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.07),transparent)] opacity-80" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Real-time Operations Center
                </span>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black tracking-[-0.06em] text-white sm:text-3xl">
                  Warehouse Command Dashboard
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Live monitoring stok fisik, demo unit, status pengiriman, dan kondisi aset di seluruh gudang.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {lowStockItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  {lowStockItems.length} SKU Stok Kritis
                </span>
              )}
              {overdueDemoItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">
                  <Clock className="h-3.5 w-3.5 text-rose-400" />
                  {overdueDemoItems.length} Demo Jatuh Tempo
                </span>
              )}
              {lowStockItems.length === 0 && overdueDemoItems.length === 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Semua Kondisi Optimal
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-4 shadow-[0_20px_34px_rgba(30,64,175,0.14)] sm:p-5"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/80 to-transparent" />
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Total Nilai Aset Stok</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 text-xl font-black tracking-tight text-white sm:text-2xl">{formatRupiah(totalValuation)}</div>
            <div className="mt-2 text-[11px] font-mono text-slate-400">Dari total {totalSkuCount} SKU terdaftar</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Stok Fisik di Gudang</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">
              <span>{totalInWarehouseQuantity}</span>
              <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-emerald-400">{inWarehouseItems.length} SKU siap didistribusikan</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900/90 p-4 shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Demo Unit Dipinjam</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5 text-xl font-black tracking-tight text-amber-400 sm:text-2xl">
              <span>{totalDemoQuantity}</span>
              <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400">{demoLoanedItems.length} produk di tangan sales/klien</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Peringatan Stok Tipis</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5 text-xl font-black tracking-tight text-rose-400 sm:text-2xl">
              <span>{lowStockItems.length}</span>
              <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Perlu segera restock/inbound</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Okupansi Kapasitas</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">
              <span>{warehouseOccupancy}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  warehouseOccupancy > 85 ? 'bg-rose-500' : warehouseOccupancy > 65 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${warehouseOccupancy}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-400" />
              <h3 className="font-heading text-sm font-bold text-white">Rincian Sisa Stok per Unit & Qty</h3>
            </div>
            <span className="font-mono text-[11px] text-slate-400">{stockBreakdown.length} SKU terdata</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stockBreakdown.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-bold text-white">{entry.name}</div>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
                    {entry.sku}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-slate-500">Ready</div>
                    <div className="mt-1 font-bold text-emerald-300">{entry.readyQuantity} {entry.unit}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-slate-500">Demo</div>
                    <div className="mt-1 font-bold text-amber-300">{entry.demoQuantity} {entry.unit}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-slate-500">Total</div>
                    <div className="mt-1 font-bold text-white">{entry.totalQuantity} {entry.unit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl lg:col-span-7"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-400" />
                <h3 className="font-heading text-sm font-bold text-white">Pelacakan Demo Unit yang Sedang Dipinjam</h3>
              </div>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-400">
                {demoLoanedItems.length} Unit Di Luar
              </span>
            </div>

            {demoLoanedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada demo unit yang sedang dipinjam saat ini. Semua unit berada aman di gudang.
              </div>
            ) : (
              <div className="mt-4 grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {demoLoanedItems.map((item) => {
                  const isOverdue = item.demoLoanInfo && new Date() > new Date(item.demoLoanInfo.expectedReturnDate);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3.5 transition-all ${
                        isOverdue ? 'border-rose-500/40 bg-rose-950/30 shadow-sm' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <div className="truncate text-xs font-bold text-white">{item.name}</div>
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isOverdue ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isOverdue ? 'JATUH TEMPO' : 'DIPINJAM'}
                        </span>
                      </div>

                      <div className="mb-2 font-mono text-[11px] text-slate-400">
                        SKU: <strong className="text-slate-300">{item.sku}</strong> • Lokasi: {item.location}
                      </div>

                      {item.demoLoanInfo && (
                        <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Peminjam:</span>
                            <span className="font-semibold text-slate-200">{item.demoLoanInfo.borrowerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tujuan:</span>
                            <span className="max-w-[140px] truncate text-slate-300">{item.demoLoanInfo.purpose}</span>
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

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl lg:col-span-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading text-sm font-bold text-white">Distribusi Kondisi & Status Stok</h3>
              <span className="font-mono text-[11px] text-slate-400">Total {items.reduce((acc, c) => acc + c.quantity, 0)} Unit</span>
            </div>

            <div className="flex h-44 w-full items-center justify-center">
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

            <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-xs">
              {statusDistributionData.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 p-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate text-[11px] text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 animate-pulse text-blue-400" />
              <h3 className="font-heading text-sm font-bold text-white">Feed Aktivitas Mutasi Terkini Gudang</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">Live Stream</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {transactions.slice(0, 4).map((tx) => {
              const isInbound = tx.type === 'inbound';
              const isOutbound = tx.type === 'outbound';

              return (
                <div
                  key={tx.id}
                  className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      isInbound
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isOutbound
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isInbound && <ArrowDownLeft className="h-3 w-3" />}
                      {isOutbound && <ArrowUpRight className="h-3 w-3" />}
                      <span>{tx.type.replace('_', ' ')}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="truncate text-xs font-bold text-white">{tx.itemName}</div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-400">
                    <span>
                      Jumlah: <strong className="text-slate-200">{tx.quantity} unit</strong>
                    </span>
                    <span className="max-w-[90px] truncate text-slate-500">{tx.performedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 p-4 text-xs sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 shrink-0 text-blue-400" />
            <div className="text-slate-300">
              <strong>Tautan Layar Publik Aktif:</strong> Anda dapat menampilkan halaman ini di Smart TV gudang, monitor lobi, atau membagikan link ke pimpinan tanpa perlu login akun.
            </div>
          </div>
          <button
            onClick={copyPublicLink}
            className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-1.5 font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              {copiedLink ? 'Link Tersalin!' : 'Salin URL Layar Publik'}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};
