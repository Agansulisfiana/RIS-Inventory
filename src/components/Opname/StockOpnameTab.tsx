import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { InventoryItem, StockOpnameSession, User, WarehouseSettings } from '../../types';

interface StockOpnameTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSaveOpname: (session: StockOpnameSession) => void;
  onFinishOpname: (session: StockOpnameSession) => void;
  onCancel: () => void;
}

const buildOpnameRows = (items: InventoryItem[]) => {
  const source = items.filter(item => item && item.name).slice(0, 12);

  if (source.length === 0) {
    return [{
      itemId: 'empty',
      productName: 'Belum ada item di database inventori',
      systemQty: 0,
      physicalQty: 0,
      difference: 0,
      condition: 'Baik',
      notes: 'Tambahkan item terlebih dahulu sebelum opname.'
    }];
  }

  return source.map((item) => ({
    itemId: item.id,
    productName: item.name,
    systemQty: item.quantity,
    physicalQty: 0,
    difference: 0,
    condition: item.condition === 'perlu_servis' ? 'Perlu Servis' : item.condition === 'rusak' ? 'Rusak' : 'Baik',
    notes: item.notes || 'Audit fisik sesuai rak / lokasi aktual.'
  }));
};

export const StockOpnameTab: React.FC<StockOpnameTabProps> = ({
  items,
  currentUser,
  settings,
  onSaveOpname,
  onFinishOpname,
  onCancel
}) => {
  const [soNumber, setSoNumber] = useState(`SO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`);
  const [warehouse, setWarehouse] = useState(settings.warehouseName || 'Gudang Jakarta');
  const [location, setLocation] = useState(settings.rackLocations[0] || 'Rak A01');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Dalam Proses' | 'Selesai'>('Dalam Proses');
  const [opnameRows, setOpnameRows] = useState(() => buildOpnameRows(items));

  useEffect(() => {
    setWarehouse(settings.warehouseName || 'Gudang Jakarta');
    setLocation(settings.rackLocations?.[0] || 'Rak A01');
    setOpnameRows(buildOpnameRows(items));
  }, [items, settings]);

  const summary = useMemo(() => {
    const totalSystem = opnameRows.reduce((sum, row) => sum + Number(row.systemQty || 0), 0);
    const totalPhysical = opnameRows.reduce((sum, row) => sum + Number(row.physicalQty || 0), 0);
    const totalDiff = totalPhysical - totalSystem;
    const countMismatch = opnameRows.filter((row) => Number(row.difference || 0) !== 0).length;

    return { totalSystem, totalPhysical, totalDiff, countMismatch };
  }, [opnameRows]);

  const handlePhysicalChange = (index: number, val: number) => {
    const updated = [...opnameRows];
    const nextValue = Number.isFinite(val) ? Math.max(0, val) : 0;
    updated[index].physicalQty = nextValue;
    updated[index].difference = nextValue - updated[index].systemQty;
    setOpnameRows(updated);
  };

  const handleNotesChange = (index: number, val: string) => {
    const updated = [...opnameRows];
    updated[index].notes = val;
    setOpnameRows(updated);
  };

  const buildSession = (finalStatus: 'Dalam Proses' | 'Selesai') => ({
    id: `so-${Date.now()}`,
    soNumber,
    warehouse,
    location,
    date,
    status: finalStatus,
    pic: currentUser.name,
    items: opnameRows.map((row) => ({
      itemId: row.itemId,
      productName: row.productName,
      systemQty: Number(row.systemQty || 0),
      physicalQty: Number(row.physicalQty || 0),
      difference: Number(row.difference || 0),
      condition: row.condition,
      notes: row.notes || '-'
    }))
  } as StockOpnameSession);

  const handleSave = () => {
    onSaveOpname(buildSession('Dalam Proses'));
    setStatus('Dalam Proses');
  };

  const handleFinish = () => {
    if (confirm('Selesaikan stock opname ini? Selisih stok fisik akan disinkronisasikan ke sistem inventory.')) {
      const session = buildSession('Selesai');
      onFinishOpname(session);
      setStatus('Selesai');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Stock Opname</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Detail</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
          STOCK OPNAME
        </h1>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">No. SO</span>
            <input
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value)}
              className="w-full font-mono font-bold text-slate-900 bg-transparent border-b border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Gudang</span>
            <input
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Lokasi</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanggal</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              status === 'Selesai'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Total Sistem</div>
            <div className="mt-1 text-lg font-black text-slate-900">{summary.totalSystem}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Total Fisik</div>
            <div className="mt-1 text-lg font-black text-slate-900">{summary.totalPhysical}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Selisih</div>
            <div className={`mt-1 text-lg font-black ${summary.totalDiff === 0 ? 'text-slate-700' : summary.totalDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.totalDiff > 0 ? `+${summary.totalDiff}` : summary.totalDiff}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Item Selisih</div>
            <div className="mt-1 text-lg font-black text-slate-900">{summary.countMismatch}</div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Produk</th>
                <th className="py-2.5 px-3 text-center">Sistem</th>
                <th className="py-2.5 px-3 text-center">Fisik</th>
                <th className="py-2.5 px-3 text-center">Selisih</th>
                <th className="py-2.5 px-3 text-center">Kondisi</th>
                <th className="py-2.5 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {opnameRows.map((row, idx) => (
                <tr key={`${row.itemId}-${idx}`} className="hover:bg-slate-50/50 align-top">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <div>{row.productName}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500 font-medium">{row.itemId}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{row.systemQty}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      value={row.physicalQty}
                      onChange={(e) => handlePhysicalChange(idx, Number(e.target.value) || 0)}
                      className="w-16 py-1 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    <span className={row.difference < 0 ? 'text-rose-600 font-black' : row.difference > 0 ? 'text-emerald-600 font-black' : 'text-slate-500'}>
                      {row.difference > 0 ? `+${row.difference}` : row.difference}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      row.condition === 'Rusak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      row.condition === 'Perlu Servis' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {row.condition}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleNotesChange(idx, e.target.value)}
                      placeholder="Catatan opname..."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesaikan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
