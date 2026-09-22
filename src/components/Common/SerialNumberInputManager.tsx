import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  FastForward, 
  PlusCircle, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Barcode, 
  Boxes, 
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Info,
  ScanLine
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { 
  findLatestSerialNumber, 
  generateContinuedSerialNumbers, 
  generateNewSerialNumbers, 
  suggestSerialNumberPrefix,
  LatestSnDetection 
} from '../../utils/serialNumberHelper';

export interface SerialNumberInputManagerProps {
  quantity: number;
  serialNumbers: string[];
  onChangeSerialNumbers: (sns: string[]) => void;
  productName?: string;
  category?: string;
  brand?: string;
  sku?: string;
  itemId?: string;
  existingItems?: InventoryItem[];
  compact?: boolean;
}

export const SerialNumberInputManager: React.FC<SerialNumberInputManagerProps> = ({
  quantity,
  serialNumbers,
  onChangeSerialNumbers,
  productName = '',
  category = '',
  brand = '',
  sku = '',
  itemId = '',
  existingItems = [],
  compact = false
}) => {
  // Mode: 'continue' (Lanjutkan SN Terakhir) | 'new_pattern' (Buat SN Baru) | 'manual' (Input Manual / Scan)
  const [activeMode, setActiveMode] = useState<'continue' | 'new_pattern' | 'manual'>('continue');

  // Detect latest SN from database
  const detectedLatest: LatestSnDetection | null = useMemo(() => {
    return findLatestSerialNumber(
      existingItems,
      { itemId, sku, name: productName, brand, category },
      quantity
    );
  }, [existingItems, itemId, sku, productName, brand, category, quantity]);

  // State for "Buat SN Baru"
  const defaultPrefix = useMemo(() => {
    return suggestSerialNumberPrefix(productName, category, brand);
  }, [productName, category, brand]);

  const [newPrefix, setNewPrefix] = useState(defaultPrefix);
  const [newStartNum, setNewStartNum] = useState<number>(1);
  const [newPadLength, setNewPadLength] = useState<number>(3);

  // Update default prefix when product details change
  useEffect(() => {
    if (!newPrefix || newPrefix === 'SN-2024-' || newPrefix === 'SN-2025-') {
      setNewPrefix(defaultPrefix);
    }
  }, [defaultPrefix]);

  // Bulk paste modal
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Check for duplicates
  const duplicates = useMemo(() => {
    const dupSet = new Set<string>();
    const seen = new Set<string>();
    serialNumbers.forEach(s => {
      const clean = s?.trim()?.toLowerCase();
      if (clean) {
        if (seen.has(clean)) {
          dupSet.add(clean);
        } else {
          seen.add(clean);
        }
      }
    });
    return dupSet;
  }, [serialNumbers]);

  const filledCount = serialNumbers.filter(s => s && s.trim()).length;
  const isComplete = filledCount === quantity && duplicates.size === 0;

  // Handle single SN change
  const handleSingleChange = (idx: number, val: string) => {
    const next = [...serialNumbers];
    while (next.length < quantity) next.push('');
    next[idx] = val;
    onChangeSerialNumbers(next.slice(0, quantity));
  };

  // Action: Apply Continuing Sequence
  const handleApplyContinued = () => {
    if (detectedLatest) {
      const nextList = generateContinuedSerialNumbers(detectedLatest.lastSn, quantity);
      onChangeSerialNumbers(nextList);
    } else {
      // If no last SN found, generate standard sequence starting at 1
      const generated = generateNewSerialNumbers(newPrefix || 'SN-2026-', 1, 3, quantity);
      onChangeSerialNumbers(generated);
    }
  };

  // Action: Apply New Pattern
  const handleApplyNewPattern = () => {
    const pfx = newPrefix.trim() || 'SN-';
    const generated = generateNewSerialNumbers(pfx, newStartNum, newPadLength, quantity);
    onChangeSerialNumbers(generated);
  };

  // Action: Apply Bulk Paste
  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split(/[\r\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const next = [...serialNumbers];
    while (next.length < quantity) next.push('');

    lines.slice(0, quantity).forEach((val, idx) => {
      next[idx] = val;
    });

    onChangeSerialNumbers(next.slice(0, quantity));
    setShowBulkPasteModal(false);
    setBulkPasteText('');
  };

  // Action: Copy single SN
  const handleCopy = (text: string, idx: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Action: Clear All SNs
  const handleClearAll = () => {
    onChangeSerialNumbers(Array(quantity).fill(''));
  };

  // Preview for new pattern
  const newPatternPreview = useMemo(() => {
    const pfx = newPrefix.trim() || 'SN-';
    const first = `${pfx}${String(newStartNum).padStart(newPadLength, '0')}`;
    const last = `${pfx}${String(newStartNum + Math.max(0, quantity - 1)).padStart(newPadLength, '0')}`;
    return { first, last };
  }, [newPrefix, newStartNum, newPadLength, quantity]);

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      
      {/* Top Header: Title & Filled Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Barcode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black font-heading text-slate-900 flex items-center gap-2">
              <span>Input Serial Number (SN) Unit</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {quantity} Unit Fisik
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Tentukan nomor seri untuk tiap unit yang ditambahkan
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
            isComplete
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{filledCount} dari {quantity} SN Terisi</span>
          </span>

          {duplicates.size > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{duplicates.size} Duplikat</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Tab 1: Lanjutkan SN Terakhir */}
        <button
          type="button"
          onClick={() => setActiveMode('continue')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeMode === 'continue'
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5" />
              <span>1. Lanjutkan SN Terakhir</span>
            </span>
            {activeMode === 'continue' && <Check className="w-4 h-4 text-white" />}
          </div>
          <p className={`text-[10px] leading-relaxed ${activeMode === 'continue' ? 'text-indigo-100' : 'text-slate-500'}`}>
            Otomatis deteksi SN terakhir di gudang & lanjutkan urutan nomornya
          </p>
        </button>

        {/* Tab 2: Buat Pola SN Baru */}
        <button
          type="button"
          onClick={() => setActiveMode('new_pattern')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeMode === 'new_pattern'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>2. Buat Pola SN Baru</span>
            </span>
            {activeMode === 'new_pattern' && <Check className="w-4 h-4 text-white" />}
          </div>
          <p className={`text-[10px] leading-relaxed ${activeMode === 'new_pattern' ? 'text-purple-100' : 'text-slate-500'}`}>
            Tentukan awalan (prefix), nomor mulai, dan digit urutan custom
          </p>
        </button>

        {/* Tab 3: Input / Scan Manual */}
        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeMode === 'manual'
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5" />
              <span>3. Scan / Paste Manual</span>
            </span>
            {activeMode === 'manual' && <Check className="w-4 h-4 text-white" />}
          </div>
          <p className={`text-[10px] leading-relaxed ${activeMode === 'manual' ? 'text-slate-200' : 'text-slate-500'}`}>
            Ketik manual per unit, scan barcode fisik, atau paste list dari Excel
          </p>
        </button>
      </div>

      {/* MODE 1 BODY: Lanjutkan SN Terakhir */}
      {activeMode === 'continue' && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 sm:p-4 space-y-3">
          {detectedLatest ? (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nomor Seri Terakhir Ditemukan di Sistem:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {detectedLatest.lastSn}
                    </span>
                    {detectedLatest.sourceItemName && (
                      <span className="text-xs text-slate-500 font-medium line-clamp-1">
                        ({detectedLatest.sourceItemName})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Kelanjutan Untuk {quantity} Unit:
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    {detectedLatest.suggestedNextList[0]} {quantity > 1 ? `s/d ${detectedLatest.suggestedNextList[quantity - 1]}` : ''}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleApplyContinued}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FastForward className="w-4 h-4" />
                <span>Terapkan Penomoran Lanjutan ke Semua ({quantity} Unit)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 text-center py-2">
              <p className="text-xs text-slate-600 font-medium">
                Belum ditemukan data serial number sebelumnya untuk produk ini di database.
              </p>
              <button
                type="button"
                onClick={handleApplyContinued}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Penomoran Awal ({newPrefix || 'SN-2026-'}001 s/d {quantity})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2 BODY: Buat Pola SN Baru */}
      {activeMode === 'new_pattern' && (
        <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Prefix */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Awalan (Prefix)
              </label>
              <input
                type="text"
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value)}
                placeholder="SN-2026- atau IDP-"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Nomor Mulai */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nomor Mulai (Start No.)
              </label>
              <input
                type="number"
                min="1"
                value={newStartNum}
                onChange={(e) => setNewStartNum(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Digit Padding */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Format Digit Angka
              </label>
              <select
                value={newPadLength}
                onChange={(e) => setNewPadLength(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value={2}>2 Digit (misal: 01, 02)</option>
                <option value={3}>3 Digit (misal: 001, 002)</option>
                <option value={4}>4 Digit (misal: 0001, 0002)</option>
                <option value={5}>5 Digit (misal: 00001, 00002)</option>
              </select>
            </div>
          </div>

          {/* Live Preview & Apply Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-purple-100">
            <div className="text-xs text-purple-900 font-medium">
              <span className="font-bold">Preview Hasil: </span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700">
                {newPatternPreview.first}
              </span>
              {quantity > 1 && (
                <>
                  <span className="mx-1 text-slate-400">s/d</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700">
                    {newPatternPreview.last}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleApplyNewPattern}
              className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Terapkan Format Baru ({quantity} Unit)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3 / COMMON TOOLBAR: Quick Tools & Manual Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5 text-indigo-600" />
          <span>Daftar Serial Number per Unit Fisik:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkPasteModal(true)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Paste daftar SN dari Excel / Notepad"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paste dari Excel</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Kosongkan semua SN"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* UNIT INPUT GRID */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-2.5 max-h-64 overflow-y-auto pr-1`}>
        {Array.from({ length: quantity }).map((_, idx) => {
          const val = serialNumbers[idx] || '';
          const isDup = val.trim() && duplicates.has(val.trim().toLowerCase());
          const isFilled = Boolean(val.trim());

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                isDup
                  ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-300'
                  : isFilled
                  ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
                  : 'border-slate-200 bg-slate-50/50 border-dashed hover:border-slate-300'
              }`}
            >
              <div className="shrink-0 flex items-center justify-center">
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                  isFilled
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  #{idx + 1}
                </span>
              </div>

              <input
                type="text"
                value={val}
                onChange={(e) => handleSingleChange(idx, e.target.value)}
                placeholder={`SN Unit #${idx + 1}`}
                className="flex-1 min-w-0 bg-transparent text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />

              <div className="flex items-center gap-1 shrink-0">
                {isFilled && (
                  <button
                    type="button"
                    onClick={() => handleCopy(val, idx)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                    title="Salin SN"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {isFilled && (
                  <button
                    type="button"
                    onClick={() => handleSingleChange(idx, '')}
                    className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog: Paste dari Excel */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Paste Massal Serial Number (Excel)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">
                Salin kolom nomor seri dari file Excel / daftar pengiriman, lalu tempelkan (paste) di bawah ini:
              </p>

              <textarea
                rows={6}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={`SN-001\nSN-002\nSN-003`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPasteModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkPaste}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Terapkan ke List ({quantity} Unit)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
