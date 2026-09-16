import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, Lock, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface DeletePinModalProps {
  isOpen: boolean;
  productName?: string;
  hasPinSet: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  onForgotPin?: () => void;
}

export const DeletePinModal: React.FC<DeletePinModalProps> = ({
  isOpen,
  productName,
  hasPinSet,
  onConfirm,
  onCancel,
  onForgotPin
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setShowPin(false);
      setShowForgotHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPinSet && !pin.trim()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onConfirm(pin.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden
          animate-in fade-in zoom-in-95 duration-150
          ${shaking ? 'animate-shake' : ''}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-rose-100 bg-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-rose-900 tracking-tight">KONFIRMASI PENGHAPUSAN</h2>
              <p className="text-[11px] text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Warning notice */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <p className="text-[12px] text-rose-800 font-semibold">
              ⚠️ Anda akan menghapus produk:
            </p>
            {productName && (
              <p className="text-xs text-rose-900 font-black mt-0.5 truncate">"{productName}"</p>
            )}
            <p className="text-[11px] text-rose-600 mt-1">
              Data produk akan terhapus permanen dari sistem.
            </p>
          </div>

          {/* PIN Input */}
          {hasPinSet ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Masukkan PIN Keamanan Admin
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN..."
                  maxLength={20}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot PIN link */}
              <button
                type="button"
                onClick={() => setShowForgotHint(!showForgotHint)}
                className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold underline cursor-pointer"
              >
                {showForgotHint ? 'Sembunyikan info' : 'Lupa PIN?'}
              </button>

              {/* Forgot PIN hint panel */}
              {showForgotHint && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] text-blue-800 font-bold">🔑 Cara Reset PIN yang Terlupa:</p>
                  <ol className="text-[11px] text-blue-700 list-decimal list-inside space-y-1 leading-relaxed">
                    <li>Tutup dialog ini (klik <strong>Batal</strong>).</li>
                    <li>Buka menu <strong>Pengaturan Perusahaan</strong> di sidebar.</li>
                    <li>Scroll ke section <strong>"Keamanan — PIN Penghapusan Produk"</strong>.</li>
                    <li>Ketik PIN baru, atau kosongkan field untuk nonaktifkan PIN.</li>
                    <li>Klik <strong>Simpan Pengaturan</strong>.</li>
                  </ol>
                  <p className="text-[10px] text-blue-600 italic">
                    * Hanya admin dengan akses ke menu Pengaturan yang dapat mereset PIN.
                  </p>
                  {onForgotPin && (
                    <button
                      type="button"
                      onClick={onForgotPin}
                      className="w-full mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Langsung Buka Pengaturan &amp; Reset PIN
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[12px] text-amber-800 font-semibold">
                ℹ️ PIN keamanan belum dikonfigurasi.
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Penghapusan akan diizinkan. Anda dapat mengatur PIN di menu <strong>Pengaturan Perusahaan</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Hapus Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
