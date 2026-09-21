import React, { useEffect, useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Copy, 
  RotateCcw, 
  Plus, 
  Minus, 
  ScanLine, 
  Search, 
  AlertCircle, 
  Info
} from 'lucide-react';
import { InventoryItem, StockOpnameSession, User, WarehouseSettings } from '../../types';

interface StockOpnameTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSaveOpname: (session: StockOpnameSession) => void;
  onFinishOpname: (session: StockOpnameSession) => void;
  onCancel: () => void;
}

interface OpnameRow {
  itemId: string;
  sku?: string;
  productName: string;
  unit?: string;
  systemQty: number;
  physicalQty: number;
  difference: number;
  condition: string;
  notes: string;
}

const buildOpnameRows = (items: InventoryItem[], defaultMode: 'zero' | 'system' = 'zero'): OpnameRow[] => {
  const source = items.filter(item => item && item.name);

  if (source.length === 0) {
    return [{
      itemId: 'empty',
      sku: '-',
      productName: 'Belum ada item di database inventori',
      unit: 'Unit',
      systemQty: 0,
      physicalQty: 0,
      difference: 0,
      condition: 'Baik',
      notes: 'Tambahkan item terlebih dahulu sebelum opname.'
    }];
  }

  return source.map((item) => {
    const sys = Number(item.quantity || 0);
    const phys = defaultMode === 'system' ? sys : 0;
    return {
      itemId: item.id,
      sku: item.sku || '-',
      productName: item.name,
      unit: item.unit || 'Unit',
      systemQty: sys,
      physicalQty: phys,
      difference: phys - sys,
      condition: item.condition === 'perlu_servis' ? 'Perlu Servis' : item.condition === 'rusak' ? 'Rusak' : 'Baik',
      notes: item.notes || 'Audit fisik sesuai rak / lokasi aktual.'
    };
  });
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
  const [warehouse, setWarehouse] = useState(settings.warehouseName || 'Gudang Utama Jakarta');
  const [location, setLocation] = useState(settings.rackLocations?.[0] || 'Rak A01');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Dalam Proses' | 'Selesai'>('Dalam Proses');
  const [opnameRows, setOpnameRows] = useState<OpnameRow[]>(() => buildOpnameRows(items, 'zero'));
  const [searchQuery, setSearchQuery] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(true);

  useEffect(() => {
    setWarehouse(settings.warehouseName || 'Gudang Utama Jakarta');
    setLocation(settings.rackLocations?.[0] || 'Rak A01');
    setOpnameRows(buildOpnameRows(items, 'zero'));
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

  const handleStepPhysical = (index: number, delta: number) => {
    const current = opnameRows[index].physicalQty || 0;
    handlePhysicalChange(index, Math.max(0, current + delta));
  };

  const handleSetToSystem = (index: number) => {
    const updated = [...opnameRows];
    updated[index].physicalQty = updated[index].systemQty;
    updated[index].difference = 0;
    setOpnameRows(updated);
  };

  const handleCopyAllSystemToPhysical = () => {
    const updated = opnameRows.map(row => ({
      ...row,
      physicalQty: row.systemQty,
      difference: 0
    }));
    setOpnameRows(updated);
    setScanMessage('Semua stok fisik disamakan dengan stok sistem (Selisih 0). Anda tinggal menyesuaikan item yang bermasalah.');
    setTimeout(() => setScanMessage(null), 5000);
  };

  const handleResetAllToZero = () => {
    const updated = opnameRows.map(row => ({
      ...row,
      physicalQty: 0,
      difference: 0 - row.systemQty
    }));
    setOpnameRows(updated);
    setScanMessage('Semua stok fisik di-reset ke 0 (Mode Hitung Buta / Blind Audit).');
    setTimeout(() => setScanMessage(null), 5000);
  };

  const handleNotesChange = (index: number, val: string) => {
    const updated = [...opnameRows];
    updated[index].notes = val;
    setOpnameRows(updated);
  };

  // Quick Barcode / SKU Scan increment
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const term = scanInput.trim().toLowerCase();
    const idx = opnameRows.findIndex(r => 
      r.itemId.toLowerCase() === term || 
      (r.sku && r.sku.toLowerCase() === term) ||
      r.productName.toLowerCase().includes(term)
    );

    if (idx >= 0) {
      handleStepPhysical(idx, 1);
      setScanMessage(`+1 fisik ditambahkan untuk ${opnameRows[idx].productName} (Total: ${opnameRows[idx].physicalQty + 1})`);
      setScanInput('');
    } else {
      setScanMessage(`Produk dengan SKU / Barcode "${scanInput}" tidak ditemukan dalam daftar.`);
    }

    setTimeout(() => setScanMessage(null), 4000);
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return opnameRows;
    const q = searchQuery.toLowerCase();
    return opnameRows.filter(r => 
      r.productName.toLowerCase().includes(q) ||
      r.itemId.toLowerCase().includes(q) ||
      (r.sku && r.sku.toLowerCase() === termMatch(q))
    );
  }, [opnameRows, searchQuery]);

  function termMatch(q: string) {
    return q;
  }

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
    if (confirm(`Selesaikan Stock Opname ${soNumber}? Selisih fisik (${summary.totalDiff > 0 ? `+${summary.totalDiff}` : summary.totalDiff}) akan otomatis disinkronkan ke master inventori & dicatat di mutasi stok.`)) {
      const session = buildSession('Selesai');
      onFinishOpname(session);
      setStatus('Selesai');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Stock Opname (Audit)</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Detail Perhitungan</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
              STOCK OPNAME AUDIT
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi dan rekonsiliasi jumlah fisik gudang terhadap catatan data sistem secara transparan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{showFormulaInfo ? 'Sembunyikan Panduan Rumus' : 'Panduan Rumus Perhitungan'}</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {showFormulaInfo && (
        <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/60 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Penjelasan Rumus & Alur Perhitungan Stock Opname</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Total Sistem</div>
                  <div className="font-semibold text-slate-900 mt-1">Jumlah Stok di Aplikasi</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Akumulasi kuantitas seluruh produk yang tercatat di database saat ini (contoh: <strong>{summary.totalSystem}</strong> unit).
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Total Fisik</div>
                  <div className="font-semibold text-slate-900 mt-1">Hasil Hitung Aktual Gudang</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total hitungan riil di rak gudang. Diisi manual pada kotak <strong className="text-blue-600 font-mono">[ FISIK ]</strong> di tabel bawah.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Rumus Selisih</div>
                  <div className="font-bold text-slate-900 mt-1 font-mono text-[13px]">
                    Selisih = Fisik - Sistem
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jika fisik 0 dan sistem 415, maka <strong>0 - 415 = -415</strong> (artinya belum dihitung atau stok fisik kurang).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 bg-blue-100/40 p-2.5 rounded-lg border border-blue-200/50">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Tips Cepat:</strong> Jika sebagian besar fisik cocok dengan sistem, klik tombol <strong>"Salin Semua Sesuai Sistem"</strong> di bawah, lalu Anda tinggal menyesuaikan beberapa item yang selisih saja.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Header Information */}
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
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Lokasi / Rak</span>
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
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border mt-0.5 ${
              status === 'Selesai'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Total Sistem</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{summary.totalSystem}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Kuantitas di aplikasi</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
            <div className="text-[10px] uppercase text-blue-700 font-bold tracking-wider">Total Fisik</div>
            <div className="mt-1 text-2xl font-black text-blue-900">{summary.totalPhysical}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Hasil hitungan aktual</div>
          </div>
          <div className={`rounded-xl border p-3.5 ${
            summary.totalDiff === 0 
              ? 'border-emerald-200 bg-emerald-50/40' 
              : summary.totalDiff > 0 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-rose-200 bg-rose-50/40'
          }`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider ${
              summary.totalDiff === 0 ? 'text-emerald-700' : summary.totalDiff > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              Selisih (Fisik - Sistem)
            </div>
            <div className={`mt-1 text-2xl font-black ${
              summary.totalDiff === 0 ? 'text-emerald-800' : summary.totalDiff > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.totalDiff > 0 ? `+${summary.totalDiff}` : summary.totalDiff}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {summary.totalDiff === 0 ? 'Stok seimbang / cocok' : summary.totalDiff < 0 ? 'Fisik kurang dari sistem' : 'Fisik lebih dari sistem'}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Item Selisih</div>
            <div className={`mt-1 text-2xl font-black ${summary.countMismatch > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {summary.countMismatch}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {summary.countMismatch === 0 ? 'Semua item cocok' : `${summary.countMismatch} produk perlu penyesuaian`}
            </div>
          </div>
        </div>

        {/* Toolbar & Fast Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
          {/* Barcode / SKU quick scan form */}
          <form onSubmit={handleScanSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode / ketik SKU untuk +1 fisik..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              +1 Hitung
            </button>
          </form>

          {/* Quick Buttons: Fill All vs Reset 0 */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleCopyAllSystemToPhysical}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Isi semua kolom fisik sama persis dengan sistem saat ini"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Salin Semua Sesuai Sistem</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllToZero}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Reset semua kolom fisik ke 0 untuk mode hitung buta"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset ke 0 (Hitung Buta)</span>
            </button>
          </div>
        </div>

        {/* Scan / Status Alert Notification */}
        {scanMessage && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium animate-fadeIn">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, SKU, atau ID item pada tabel opname..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Opname Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Daftar Produk Audit ({filteredRows.length} item)</span>
            <span className="text-[11px] text-blue-600 font-semibold">
              Ketik angka fisik langsung di kolom berbingkai biru atau gunakan tombol - / +
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Produk & SKU</th>
                  <th className="py-3 px-3.5 text-center">Sistem</th>
                  <th className="py-3 px-3.5 text-center min-w-[170px]">
                    <span className="text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded border border-blue-200">
                      Fisik (Input Manual)
                    </span>
                  </th>
                  <th className="py-3 px-3.5 text-center">Selisih</th>
                  <th className="py-3 px-3.5 text-center">Kondisi</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Catatan Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => {
                    const originalIdx = opnameRows.findIndex(r => r.itemId === row.itemId);
                    const isDiff = row.difference !== 0;

                    return (
                      <tr 
                        key={`${row.itemId}`} 
                        className={`hover:bg-slate-50/70 align-top transition-colors ${
                          isDiff ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-slate-900 max-w-xs">
                          <div className="leading-snug">{row.productName}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">SKU: {row.sku || row.itemId}</span>
                            <span className="text-slate-400">• Satuan: {row.unit || 'Unit'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800">
                          <span className="inline-block px-2 py-1 bg-slate-100 rounded-lg text-slate-800 text-xs">
                            {row.systemQty} {row.unit}
                          </span>
                        </td>

                        {/* Fisik Input Column with Stepper and Quick Match */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStepPhysical(originalIdx, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
                              title="Kurangi 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={row.physicalQty}
                              onChange={(e) => handlePhysicalChange(originalIdx, Number(e.target.value) || 0)}
                              className="w-16 py-1 text-center font-mono font-black text-sm bg-white border-2 border-blue-400 focus:border-blue-600 rounded-lg text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                              title="Ketik hasil hitungan fisik gudang di sini"
                            />

                            <button
                              type="button"
                              onClick={() => handleStepPhysical(originalIdx, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
                              title="Tambah 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetToSystem(originalIdx)}
                              className="px-1.5 py-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer shrink-0 ml-0.5"
                              title="Samakan fisik dengan sistem"
                            >
                              Sesuai
                            </button>
                          </div>
                        </td>

                        {/* Selisih Column */}
                        <td className="py-3 px-3.5 text-center font-mono font-bold whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs ${
                            row.difference < 0 
                              ? 'text-rose-700 bg-rose-50 border border-rose-200 font-black' 
                              : row.difference > 0 
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-black' 
                              : 'text-slate-500 bg-slate-50 border border-slate-200'
                          }`}>
                            {row.difference > 0 ? `+${row.difference}` : row.difference} {row.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            row.condition === 'Rusak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            row.condition === 'Perlu Servis' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {row.condition}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => handleNotesChange(originalIdx, e.target.value)}
                            placeholder="Catatan hasil audit..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada produk yang cocok dengan pencarian "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            PIC Petugas Audit: <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.role})</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal / Kembali
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Simpan Draft SO
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan & Sinkronisasi Stok</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
