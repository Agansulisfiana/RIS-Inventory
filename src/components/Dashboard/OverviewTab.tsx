import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PlayCircle, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Layers, 
  BarChart3, 
  DollarSign, 
  Users, 
  FileText, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  InventoryItem, 
  StockTransaction, 
  SalesOrder, 
  GoodsReceipt, 
  ServiceTicket, 
  User, 
  WarehouseSettings,
  NavTab
} from '../../types';
import { RisLogo } from '../Common/RisLogo';
import { formatCurrency } from '../../utils/currency';
import { 
  triggerClickParticles, 
  triggerLogoCelebration, 
  playFeedbackSound 
} from '../../utils/animation';

interface OverviewTabProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  salesOrders: SalesOrder[];
  goodsReceipts: GoodsReceipt[];
  serviceTickets: ServiceTicket[];
  currentUser: User;
  settings: WarehouseSettings;
  onNavigate: (tab: NavTab) => void;
  onSelectItem: (item: InventoryItem) => void;
  onAddNewProduct: () => void;
  onOpenSalesModal?: () => void;
  onOpenReceiptModal?: () => void;
  onQuickRestock: (itemId: string, qty: number) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  items,
  transactions,
  salesOrders,
  goodsReceipts,
  serviceTickets,
  currentUser,
  settings,
  onNavigate,
  onSelectItem,
  onAddNewProduct,
  onOpenSalesModal,
  onOpenReceiptModal,
  onQuickRestock
}) => {
  // Financial & inventory analytics
  const totalItemsCount = items.length;
  const totalStockUnits = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCostValuation = items.reduce((acc, curr) => acc + (curr.quantity * (curr.costPrice || curr.price)), 0);
  const totalSellValuation = items.reduce((acc, curr) => acc + (curr.quantity * (curr.sellPrice || curr.price)), 0);
  
  const totalSalesRevenue = salesOrders.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const totalPurchasingCost = goodsReceipts.reduce((acc, curr) => acc + curr.totalValue, 0);

  // Critical alerts
  const lowStockItems = items.filter(i => i.quantity <= i.minStock);
  const onDemoItems = items.filter(i => i.status === 'on_demo' || (i.demoLoanInfo && i.demoLoanInfo.active));
  
  const today = new Date();
  const overdueDemoItems = onDemoItems.filter(i => {
    if (!i.demoLoanInfo?.expectedReturnDate) return false;
    return new Date(i.demoLoanInfo.expectedReturnDate) < today;
  });

  const activeServiceTickets = serviceTickets.filter(s => s.status !== 'Selesai' && s.status !== 'Dibatalkan');

  // Chart 1: Category Distribution
  const categoryCounts: Record<string, { count: number; value: number }> = {};
  items.forEach(item => {
    const cat = item.category || 'Lainnya';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { count: 0, value: 0 };
    }
    categoryCounts[cat].count += item.quantity;
    categoryCounts[cat].value += item.quantity * (item.sellPrice || item.price);
  });

  const categoryChartData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat].count,
    totalIdr: categoryCounts[cat].value
  }));

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Chart 2: 7-Days Movement Activity Trend
  const activityData = [
    { day: 'Senin', Penjualan: 4, Penerimaan: 12, Demo: 1 },
    { day: 'Selasa', Penjualan: 8, Penerimaan: 5, Demo: 2 },
    { day: 'Rabu', Penjualan: 6, Penerimaan: 15, Demo: 0 },
    { day: 'Kamis', Penjualan: 11, Penerimaan: 8, Demo: 3 },
    { day: 'Jumat', Penjualan: 14, Penerimaan: 20, Demo: 1 },
    { day: 'Sabtu', Penjualan: 5, Penerimaan: 2, Demo: 0 },
    { day: 'Minggu', Penjualan: 2, Penerimaan: 0, Demo: 0 }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. HERO BANNER WITH PROMINENT METRICS & FAST ACTIONS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            {/* Integrated Natural Frosted White Logo Emblem */}
            <div 
              onClick={(e) => {
                triggerLogoCelebration(e);
                playFeedbackSound('success');
              }}
              className="hidden sm:flex shrink-0 p-2.5 sm:p-3 bg-white/95 hover:bg-white rounded-2xl shadow-xl shadow-blue-950/40 border border-white/50 ring-4 ring-white/10 hover:ring-white/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group select-none relative overflow-hidden items-center justify-center"
              title="Klik logo RIS untuk efek animasi perayaan!"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <RisLogo size={52} />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sistem Manajemen Inventory & Penjualan Terpadu</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight leading-tight">
                Selamat Datang, <span className="text-blue-400">{currentUser.name}</span>
              </h1>
              
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {settings.companyName} • Monitoring stok produk, transaksi penjualan, penerimaan barang, dan unit demo aktif.
              </p>
            </div>
          </div>

          {/* Quick Action Hub with Micro-interactions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenSalesModal && (
              <button
                onClick={(e) => {
                  triggerClickParticles(e);
                  playFeedbackSound('click');
                  onOpenSalesModal();
                }}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buat Penjualan (DO)</span>
              </button>
            )}

            <button
              onClick={(e) => {
                triggerClickParticles(e);
                playFeedbackSound('click');
                onAddNewProduct();
              }}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>

            {onOpenReceiptModal && (
              <button
                onClick={(e) => {
                  triggerClickParticles(e);
                  playFeedbackSound('click');
                  onOpenReceiptModal();
                }}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Terima Barang (PO)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Total Valuasi Jual:</span>
            <span className="text-base font-black text-emerald-400 font-heading">{formatCurrency(totalSellValuation)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Total Stok Fisik:</span>
            <span className="text-base font-black text-white font-heading">{totalStockUnits} Unit/Pcs</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Stok Menipis:</span>
            <span className={`text-base font-black font-heading ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lowStockItems.length} Produk Kritis
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Unit Demo di Klien:</span>
            <span className="text-base font-black text-purple-400 font-heading">{onDemoItems.length} Unit (POC)</span>
          </div>
        </div>
      </div>

      {/* 2. LARGE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Sales Omset */}
        <div 
          onClick={() => onNavigate('sales_orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset Penjualan</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-heading text-emerald-700 tracking-tight">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-emerald-700">{salesOrders.length} Order DO Selesai</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div 
          onClick={() => onNavigate('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valuasi Modal Stok</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-heading text-blue-700 tracking-tight">
              {formatCurrency(totalCostValuation)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-blue-700">{totalItemsCount} SKU Produk Master</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 3: Goods Receipt PO */}
        <div 
          onClick={() => onNavigate('goods_receipt')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengadaan & PO Masuk</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-heading text-indigo-700 tracking-tight">
              {formatCurrency(totalPurchasingCost)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-indigo-700">{goodsReceipts.length} Batch Tanda Terima</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Demo & Overdue Alert */}
        <div 
          onClick={() => onNavigate('demo_center')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Demo (POC)</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold group-hover:scale-110 transition-transform ${
              overdueDemoItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'
            }`}>
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
              <span>{onDemoItems.length} Unit</span>
              {overdueDemoItems.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  {overdueDemoItems.length} Terlambat
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className={`font-semibold ${overdueDemoItems.length > 0 ? 'text-rose-600' : 'text-purple-700'}`}>
                {overdueDemoItems.length > 0 ? 'Perlu follow up customer' : 'Masa pinjam normal'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CHARTS SECTION (SPACIOUS & INFORMATIVE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-black font-heading text-slate-900 text-base">
                AKTIVITAS LOGISTIK & TRANSAKSI (7 HARI TERAKHIR)
              </h2>
              <p className="text-xs text-slate-500 font-medium">Perbandingan volume penjualan produk, penerimaan restock, dan sirkulasi demo</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold w-fit">
              Update Real-Time
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Penjualan" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="Penerimaan" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceipt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between min-w-0">
          <div>
            <h2 className="font-black font-heading text-slate-900 text-base">
              DISTRIBUSI KATEGORI PRODUK
            </h2>
            <p className="text-xs text-slate-500 font-medium">Proporsi stok berdasarkan jenis produk</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} unit`, 'Kuantitas Stok']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto text-xs">
            {categoryChartData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-700 font-medium truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">{cat.value} pcs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FAST ACTION PANELS: LOW STOCK ALERT & ACTIVE DEMO UNITS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alert 1: Low Stock / Restock Reorder */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black font-heading text-slate-900 text-sm">
                  PERINGATAN STOK MENIPIS ({lowStockItems.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">Produk di bawah kuantitas minimum batas aman</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Katalog Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                Semua stok produk dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              lowStockItems.slice(0, 4).map(item => (
                <div key={item.id} className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=80&auto=format&fit=crop&q=80'} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate" onClick={() => onSelectItem(item)}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        SKU: {item.sku} • Lokasi: {item.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-100">
                    <div className="text-left sm:text-right">
                      <div className="font-black text-rose-700 text-xs">Sisa {item.quantity} {item.unit}</div>
                      <div className="text-[10px] text-slate-400">Min: {item.minStock} {item.unit}</div>
                    </div>

                    <button
                      onClick={() => onQuickRestock(item.id, 10)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Tambah +10 unit sekarang"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+10 Stok</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alert 2: Active Demo & Overdue Tracker */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black font-heading text-slate-900 text-sm">
                  MONITORING UNIT PINJAMAN DEMO (POC)
                </h3>
                <p className="text-xs text-slate-500 font-medium">Tracking printer demo di klien customer</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('demo_center')}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Pusat Demo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {onDemoItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                Tidak ada unit demo yang sedang dipinjamkan ke customer saat ini.
              </div>
            ) : (
              onDemoItems.slice(0, 4).map(item => {
                const loan = item.demoLoanInfo;
                const expDate = loan?.expectedReturnDate ? new Date(loan.expectedReturnDate) : null;
                const isLate = expDate ? expDate < today : false;

                return (
                  <div key={item.id} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isLate ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Customer: <span className="font-semibold text-slate-800">{loan?.customerName || item.location}</span> • PIC: {loan?.borrowerName || item.pic}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isLate ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Terlambat</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">
                          Kembali: {expDate ? expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. RECENT TRANSACTION LOG STREAM */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black font-heading text-slate-900 text-base">
              AKTIVITAS MUTASI & TRANSAKSI TERAKHIR
            </h3>
            <p className="text-xs text-slate-500 font-medium">Log riwayat mutasi stok barang masuk, penjualan, transfer, dan service</p>
          </div>

          <button
            onClick={() => onNavigate('movement')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Transaksi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Jenis Mutasi</th>
                <th className="py-2.5 px-3">Produk / Item</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3">Asal &rarr; Tujuan</th>
                <th className="py-2.5 px-3">PIC Operator</th>
                <th className="py-2.5 px-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {transactions.slice(0, 6).map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{trx.transactionNumber}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      trx.type === 'Penjualan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      trx.type === 'Goods Receipt' || trx.type === 'Pembelian' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      trx.type === 'Demo Out' || trx.type === 'Demo In' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      trx.type === 'Service In' || trx.type === 'Service Out' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {trx.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[220px]">{trx.itemName}</td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900">{trx.quantity}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[200px]">
                    {trx.fromLocation} &rarr; {trx.toLocation}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{trx.pic}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {new Date(trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
