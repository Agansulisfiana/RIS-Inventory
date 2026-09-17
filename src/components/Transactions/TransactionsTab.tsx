import React, { useState } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  RotateCcw, 
  Sparkles, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  User, 
  Clock,
  ScanLine
} from 'lucide-react';
import { StockTransaction, InventoryItem, User as AppUser, WarehouseSettings, StockMovementType } from '../../types';
import { storageService } from '../../services/storage';
import { exportService } from '../../services/exportService';

interface TransactionsTabProps {
  transactions: StockTransaction[];
  items: InventoryItem[];
  currentUser: AppUser;
  settings: WarehouseSettings;
  onRefreshData: () => void;
  onOpenScanner: (mode?: 'lookup' | 'inbound' | 'outbound' | 'demo_loan' | 'demo_return') => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  items,
  currentUser,
  settings,
  onRefreshData,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.partnerOrBorrower && t.partnerOrBorrower.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.performedBy && t.performedBy.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || t.type === selectedType;

    return matchesSearch && matchesType;
  });

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Riwayat Mutasi & Transaksi Stok Gudang
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan real-time arus barang masuk (inbound), barang keluar (outbound), dan sirkulasi unit demo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenScanner('inbound')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4" />
            Scan Barang Masuk
          </button>

          <button
            type="button"
            onClick={() => onOpenScanner('outbound')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            Scan Barang Keluar
          </button>

          <button
            type="button"
            onClick={() => exportService.exportTransactionsToExcel(transactions, settings)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. PO, Surat Jalan, SKU, Klien..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua Mutasi
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('INBOUND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'INBOUND' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Masuk (Inbound)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('OUTBOUND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'OUTBOUND' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Keluar (Outbound)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('DEMO_LOAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'DEMO_LOAN' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pinjam Demo
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('DEMO_RETURN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'DEMO_RETURN' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Retur Demo
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu & Tanggal</th>
                <th className="py-3 px-4">Tipe Mutasi</th>
                <th className="py-3 px-4">No. Ref / Surat Jalan</th>
                <th className="py-3 px-4">Produk & SKU</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4">Partner / Peminjam</th>
                <th className="py-3 px-4">Catatan & Keterangan</th>
                <th className="py-3 px-4">Petugas Staf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => {
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(trx.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 w-fit ${
                          trx.type === 'INBOUND' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          trx.type === 'OUTBOUND' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          trx.type === 'DEMO_LOAN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          trx.type === 'DEMO_RETURN' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {trx.type === 'INBOUND' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {trx.type === 'OUTBOUND' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {trx.type === 'DEMO_LOAN' && <Sparkles className="w-3.5 h-3.5" />}
                          {trx.type === 'DEMO_RETURN' && <RotateCcw className="w-3.5 h-3.5" />}
                          {trx.type === 'INBOUND' ? 'Barang Masuk' :
                           trx.type === 'OUTBOUND' ? 'Barang Keluar' :
                           trx.type === 'DEMO_LOAN' ? 'Pinjam Demo' :
                           trx.type === 'DEMO_RETURN' ? 'Retur Demo' : 'Update Status'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {trx.referenceNumber || '-'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 leading-tight">{trx.itemName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{trx.itemSku}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-bold text-xs ${
                          trx.type === 'INBOUND' || trx.type === 'DEMO_RETURN' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {trx.type === 'INBOUND' ? `+${trx.quantity}` :
                           trx.type === 'OUTBOUND' ? `-${trx.quantity}` : `${trx.quantity}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {trx.partnerOrBorrower || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {trx.notes || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <span className="font-semibold text-slate-800">{trx.performedBy}</span>
                        <span className="text-slate-400 block uppercase text-[10px] font-mono">{trx.performedByRole}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada riwayat transaksi mutasi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
