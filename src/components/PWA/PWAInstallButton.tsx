import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode, hide in header or show badge in settings
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Aplikasi Lapangan (PWA) Berjalan Aktif di Perangkat Ini</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop Install Flow
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all transform active:scale-95 cursor-pointer ${className}`}
          title="Pasang aplikasi di laptop atau smartphone Anda untuk akses instan tanpa browser"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install PWA</span>
          <span className="sm:hidden">Install</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className={`p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md border border-blue-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Pasang Aplikasi Lapangan (PWA)</div>
              <div className="text-xs text-blue-200">Akses cepat satu-ketuk di layar utama HP/tablet tim gudang & sales tanpa mengetik URL</div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 font-black rounded-xl text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Pasang Sekarang</span>
          </button>
        </div>
      );
    }

    // Settings variant
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install Aplikasi RIS di Perangkat Ini</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        {variant === 'header' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Install di iOS</span>
            <span className="sm:hidden">Install</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer ${className}`}
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Petunjuk Pasang di iPhone / iPad</span>
          </button>
        )}

        {/* Modal Petunjuk iOS */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-xs text-slate-600">
                <p className="font-medium text-slate-700">
                  Untuk menginstal aplikasi ini di perangkat iOS Apple:
                </p>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Buka browser <strong>Safari</strong>, lalu ketuk tombol <strong>Share (Bagikan)</strong> <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> di bilah bawah browser.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Gulir ke bawah dan pilih opsi <strong>Add to Home Screen (Tambahkan ke Layar Utama)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Ketuk <strong>Add (Tambah)</strong> di sudut kanan atas. Ikon aplikasi RIS akan langsung muncul di layar utama iPhone/iPad Anda!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback info in Settings
  if (variant === 'settings') {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Aplikasi Lapangan (PWA Ready)</span>
        </div>
        <div>
          Buka situs ini di Chrome (Android/Windows/Mac) atau Safari (iOS), lalu pilih <em>&ldquo;Tambahkan ke Layar Utama&rdquo;</em> untuk menginstal aplikasi layaknya aplikasi native tanpa URL bar.
        </div>
      </div>
    );
  }

  return null;
};
