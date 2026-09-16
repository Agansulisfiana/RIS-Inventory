import React, { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Package,
  ArrowRightLeft,
  Layers,
  Wrench,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { InventoryItem, StockTransaction, ServiceTicket, WarehouseSettings, User, AuditLog } from '../../types';
import { exportService } from '../../services/exportService';

interface InvReportsTabProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  serviceTickets: ServiceTicket[];
  auditLogs?: AuditLog[];
  settings: WarehouseSettings;
  currentUser: User;
}

export const InvReportsTab: React.FC<InvReportsTabProps> = ({
  items,
  transactions,
  serviceTickets,
  auditLogs = [],
  settings,
  currentUser
}) => {
  const [selectedReportType, setSelectedReportType] = useState<'stock' | 'movement' | 'demo' | 'service' | 'asset'>('stock');
  const [selectedPeriod, setSelectedPeriod] = useState('Agustus 2026');

  const totalAssetValue = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.price, 0),
    [items]
  );

  const lowStockCount = useMemo(
    () => items.filter((item) => item.quantity <= item.minStock).length,
    [items]
  );

  const demoActiveCount = useMemo(
    () => items.filter((item) => item.status === 'on_demo' || item.demoLoanInfo?.active).length,
    [items]
  );

  const reportCards = [
    { id: 'stock', title: 'Inventory Report', subtitle: 'Laporan Stok', icon: Package, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'movement', title: 'Movement Report', subtitle: 'Laporan Pergerakan', icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'demo', title: 'Demo Report', subtitle: 'Laporan Demo', icon: Layers, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'service', title: 'Service Report', subtitle: 'Laporan Service', icon: Wrench, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'asset', title: 'Asset Report', subtitle: 'Laporan Asset', icon: DollarSign, color: 'bg-slate-100 text-slate-700 border-slate-200' }
  ] as const;

  const recentReports = [
    { name: `Laporan Stok - ${selectedPeriod}`, date: new Date().toLocaleString('id-ID'), format: 'XLSX', type: 'stock' },
    { name: `Laporan Pergerakan - ${selectedPeriod}`, date: new Date().toLocaleString('id-ID'), format: 'XLSX', type: 'movement' },
    { name: `Laporan Demo - ${selectedPeriod}`, date: new Date().toLocaleString('id-ID'), format: 'PDF', type: 'demo' }
  ];

  const reportMeta: Record<typeof selectedReportType, { label: string; export: () => void; format: string }> = {
    stock: { label: 'Laporan Stok', export: () => exportService.exportInventoryToExcel(items, settings), format: 'XLSX' },
    movement: { label: 'Laporan Pergerakan', export: () => exportService.exportTransactionsToExcel(transactions, settings), format: 'XLSX' },
    demo: { label: 'Laporan Demo', export: () => exportService.exportDemoUnitsToExcel(items, settings), format: 'XLSX' },
    service: { label: 'Laporan Service', export: () => exportService.exportServiceTicketsToExcel(serviceTickets, settings), format: 'XLSX' },
    asset: { label: 'Laporan Asset', export: () => exportService.exportInventoryToPDF(items, settings), format: 'PDF' }
  };

  const handleGenerate = () => {
    reportMeta[selectedReportType].export();
  };

  const handleGenerateByType = (type: typeof selectedReportType) => {
    const current = reportMeta[type];
    if (current) current.export();
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Laporan</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Pusat Laporan & Rekapitulasi</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
          LAPORAN
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Total Asset</div>
          <div className="mt-2 text-xl font-black text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAssetValue)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Low Stock</div>
          <div className="mt-2 text-xl font-black text-amber-600">{lowStockCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Demo Aktif</div>
          <div className="mt-2 text-xl font-black text-violet-600">{demoActiveCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Mutasi</div>
          <div className="mt-2 text-xl font-black text-blue-600">{transactions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isActive = selectedReportType === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedReportType(card.id)}
              className={`bg-white p-3.5 rounded-xl border shadow-xs transition-all text-center flex flex-col items-center justify-center ${
                isActive ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 leading-tight">{card.title}</div>
                <div className="text-[10px] text-slate-500 font-medium">{card.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Laporan Terakhir</h3>

          <div className="divide-y divide-slate-100 text-xs">
            {recentReports.map((rep, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{rep.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rep.date}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateByType(rep.type as typeof selectedReportType)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10px] font-bold font-mono rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  {rep.format}
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Audit Trail Terbaru</h4>
              <span className="text-[10px] font-medium text-slate-500">{auditLogs.length} log</span>
            </div>
            <div className="space-y-2 text-[11px]">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{log.details}</div>
                  <div className="mt-1 text-[10px] text-slate-500">Oleh: {log.userName}</div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-[11px] text-slate-400 italic">Belum ada perubahan stok yang tercatat.</div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filter Laporan</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">Jenis Laporan</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as typeof selectedReportType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="stock">Laporan Stok (Inventory)</option>
                <option value="movement">Laporan Pergerakan (Stock Movement)</option>
                <option value="demo">Laporan Demo Unit</option>
                <option value="service">Laporan Service & Maintenance</option>
                <option value="asset">Laporan Nilai Aset</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">Periode</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
                <option value="Juni 2026">Juni 2026</option>
                <option value="Tahun 2026">Sepanjang Tahun 2026</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{reportMeta[selectedReportType].format} - {reportMeta[selectedReportType].label}</span>
            </button>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              <div className="font-bold text-slate-700 mb-1">Ringkasan aktif</div>
              <div>{reportMeta[selectedReportType].label} akan diekspor dengan format {reportMeta[selectedReportType].format} berdasarkan data real-time dari inventory, mutasi, dan service ticket.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
