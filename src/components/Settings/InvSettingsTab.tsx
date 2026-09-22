import React, { useRef, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Volume2, 
  VolumeX, 
  Save, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Shield,
  Plus,
  X,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Check,
  Smartphone,
  QrCode
} from 'lucide-react';
import { WarehouseSettings, User as UserType } from '../../types';
import { storageService } from '../../services/storage';
import { getPermissions } from '../../utils/permissions';
import RoleManagement from './RoleManagement';
import { PWAInstallButton } from '../PWA/PWAInstallButton';

interface InvSettingsTabProps {
  settings: WarehouseSettings;
  currentUser: UserType;
  onRefreshData: () => void;
}

const ListManager = ({ title, items, onChange }: { title: string, items: string[], onChange: (i: string[]) => void }) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-64">
      <div className="text-xs font-bold text-slate-800 mb-2">{title}</div>
      <div className="flex gap-2 mb-3">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="Tambah..."
          className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button type="button" onClick={handleAdd} className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-100 shadow-xs">
            <span className="text-[11px] font-medium text-slate-700 truncate">{item}</span>
            <button type="button" onClick={() => handleRemove(idx)} className="text-slate-400 hover:text-rose-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-[10px] text-slate-400 text-center italic mt-4">Belum ada data</div>}
      </div>
    </div>
  );
};

export const InvSettingsTab: React.FC<InvSettingsTabProps> = ({
  settings,
  currentUser,
  onRefreshData
}) => {
  const [formData, setFormData] = useState<WarehouseSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
    resetConfirmed: false
  });
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clearMessage, setClearMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [keepMasterStructure, setKeepMasterStructure] = useState(true);
  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData, currentUser);
    storageService.addAuditLog({
      action: 'UPDATE_SETTINGS',
      module: 'system',
      category: 'system',
      details: 'Mengubah konfigurasi & profil gudang',
      user: currentUser
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handlePinUpdate = () => {
    const currentPin = formData.adminPin || '';
    const enteredCurrentPin = pinForm.currentPin.trim();
    const newPin = pinForm.newPin.trim();
    const confirmPin = pinForm.confirmPin.trim();

    if (!newPin || !confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN baru dan konfirmasi PIN wajib diisi.' });
      return;
    }

    if (newPin.length < 4) {
      setPinMessage({ type: 'error', text: 'PIN baru minimal 4 karakter.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }

    if (currentPin && enteredCurrentPin && enteredCurrentPin !== currentPin) {
      setPinMessage({ type: 'error', text: 'PIN lama yang Anda masukkan salah.' });
      return;
    }

    if (currentPin && !enteredCurrentPin && !pinForm.resetConfirmed) {
      setPinMessage({ type: 'error', text: 'Masukkan PIN lama atau centang opsi reset jika Anda lupa PIN lama.' });
      return;
    }

    const nextSettings: WarehouseSettings = {
      ...formData,
      adminPin: newPin
    };

    setFormData(nextSettings);
    storageService.saveSettings(nextSettings, currentUser);
    storageService.addAuditLog({
      action: 'UPDATE_ADMIN_PIN',
      module: 'system',
      category: 'system',
      details: currentPin ? 'Mengubah PIN keamanan admin' : 'Membuat PIN keamanan admin',
      user: currentUser
    });

    setPinMessage({
      type: 'success',
      text: currentPin ? 'PIN admin berhasil diubah.' : 'PIN admin berhasil dibuat.'
    });
    setPinForm({ currentPin: '', newPin: '', confirmPin: '', resetConfirmed: false });
    onRefreshData();
  };

  const handleBackup = () => {
    const snap = storageService.createBackup(currentUser);
    const blob = new Blob([snap.dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INVTRACK_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setRestoreMessage({ type: 'error', text: 'File restore harus berformat JSON backup.' });
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const ok = storageService.importBackupJSON(text, currentUser);

      if (!ok) {
        setRestoreMessage({ type: 'error', text: 'Format file backup tidak valid atau data tidak dapat dipulihkan.' });
        event.target.value = '';
        return;
      }

      storageService.addAuditLog({
        action: 'RESTORE_BACKUP_JSON',
        module: 'system',
        category: 'system',
        details: `Restore data dari file backup ${file.name}`,
        user: currentUser
      });

      setRestoreMessage({ type: 'success', text: 'Backup berhasil dipulihkan ke aplikasi.' });
      onRefreshData();
    } catch {
      setRestoreMessage({ type: 'error', text: 'Gagal membaca file backup. Coba file lain.' });
    } finally {
      event.target.value = '';
    }
  };

  const handleOpenClearModal = () => {
    setClearConfirmationText('');
    setIsClearModalOpen(true);
  };

  const handleConfirmClearAllData = () => {
    storageService.clearAllData(keepMasterStructure);
    storageService.addAuditLog({
      action: 'CLEAR_ALL_DATA',
      module: 'system',
      category: 'system',
      details: keepMasterStructure 
        ? 'Menghapus seluruh inventaris & transaksi untuk mulai input data riil (struktur master dipertahankan)' 
        : 'Menghapus semua data aplikasi & reset total untuk memulai dari nol',
      user: currentUser
    });

    const refreshedSettings = storageService.getSettings();
    setFormData(refreshedSettings);

    setClearMessage({
      type: 'success',
      text: keepMasterStructure
        ? 'Semua data barang, transaksi, dan demo berhasil dibersihkan. Struktur kategori & gudang siap digunakan untuk input data riil!'
        : 'Semua data aplikasi berhasil direset total. Aplikasi sekarang dalam keadaan kosong dari nol.'
    });

    setIsClearModalOpen(false);
    setClearConfirmationText('');
    onRefreshData();
  };

  const handleConfirmResetDemoData = () => {
    storageService.resetToDefaultData();
    storageService.addAuditLog({
      action: 'RESET_DEFAULT_DEMO',
      module: 'system',
      category: 'system',
      details: 'Mereset data aplikasi kembali ke contoh data demo awal',
      user: currentUser
    });

    const refreshedSettings = storageService.getSettings();
    setFormData(refreshedSettings);

    setClearMessage({
      type: 'success',
      text: 'Data contoh demo (produk printer, ribbon, kartu, dan transaksi) berhasil dimuat kembali.'
    });

    setIsResetDemoModalOpen(false);
    onRefreshData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Pengaturan</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Profil Perusahaan & Sistem</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
          PENGATURAN
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Profil Perusahaan & Lokasi Gudang</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Nama Perusahaan</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Nama Gudang / Cabang</label>
              <input
                type="text"
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">Alamat Gudang</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Nomor Telepon / Hotline</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Kepala Gudang (PIC)</label>
              <input
                type="text"
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Master Data */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Master Data (Pilihan Form)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListManager
              title="Daftar Gudang"
              items={formData.warehouses || []}
              onChange={(newItems) => setFormData({ ...formData, warehouses: newItems })}
            />
            <ListManager
              title="Kategori Produk"
              items={formData.categories || []}
              onChange={(newItems) => setFormData({ ...formData, categories: newItems })}
            />
            <ListManager
              title="Lokasi Rak"
              items={formData.rackLocations || []}
              onChange={(newItems) => setFormData({ ...formData, rackLocations: newItems })}
            />
          </div>
        </div>

        {/* Security PIN */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-600" />
            <span>Keamanan — PIN Penghapusan Produk</span>
          </h2>

          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">PIN Keamanan Admin</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Digunakan untuk validasi penghapusan produk dan tindakan sensitif.
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                formData.adminPin
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {formData.adminPin ? '🔒 PIN Aktif' : '🔓 Belum Diset'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {formData.adminPin ? 'PIN Lama' : 'PIN Baru'}
                  </label>
                  <input
                    type="password"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                    placeholder={formData.adminPin ? 'Masukkan PIN lama' : 'PIN baru awal'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono tracking-widest focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">PIN Baru</label>
                  <input
                    type="password"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                    placeholder="Masukkan PIN baru"
                    maxLength={20}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono tracking-widest focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Konfirmasi PIN Baru</label>
                  <input
                    type="password"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                    placeholder="Ulangi PIN baru"
                    maxLength={20}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono tracking-widest focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>

                {formData.adminPin && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <input
                      type="checkbox"
                      checked={pinForm.resetConfirmed}
                      onChange={(e) => setPinForm({ ...pinForm, resetConfirmed: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    Saya lupa PIN lama dan ingin reset PIN keamanan.
                  </label>
                )}

                <button
                  type="button"
                  onClick={handlePinUpdate}
                  className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {formData.adminPin ? 'Ubah PIN Admin' : 'Buat PIN Admin'}
                </button>

                {pinMessage && (
                  <div className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${
                    pinMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {pinMessage.text}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 flex-1">
                  <p className="font-bold mb-1">⚠️ Perhatian:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-600">
                    <li>PIN disimpan di localStorage browser.</li>
                    <li>Catat PIN di tempat aman.</li>
                    <li>Jika lupa PIN lama, aktifkan opsi reset untuk membuat PIN baru.</li>
                  </ul>
                </div>

                {formData.adminPin && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, adminPin: '' });
                      setPinForm({ currentPin: '', newPin: '', confirmPin: '', resetConfirmed: false });
                      setPinMessage({ type: 'success', text: 'PIN admin berhasil dinonaktifkan.' });
                      storageService.saveSettings({ ...formData, adminPin: '' }, currentUser);
                      storageService.addAuditLog({
                        action: 'DISABLE_ADMIN_PIN',
                        module: 'system',
                        category: 'system',
                        details: 'Menonaktifkan PIN keamanan admin',
                        user: currentUser
                      });
                      onRefreshData();
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 underline text-left cursor-pointer"
                  >
                    🗑 Nonaktifkan PIN
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PWA & Multi-Device Field Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Mode Aplikasi Lapangan (PWA &amp; Akses Multi-Device)</span>
          </h2>

          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl shadow-sm border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>PWA Lapangan Siap Digunakan</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                    ONLINE &amp; OFFLINE READY
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Staf gudang dan sales dapat menginstal aplikasi langsung ke layar utama HP/tablet (Android &amp; iOS) untuk scan barcode cepat tanpa perlu membuka browser.
                </p>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <PWAInstallButton variant="settings" className="w-full sm:w-auto" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android &amp; PDA Gudang</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Buka di Google Chrome &rarr; Ketuk menu titik tiga &rarr; Pilih <strong>&ldquo;Install app&rdquo;</strong> atau <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong>.
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone &amp; iPad (iOS)</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Buka di Safari &rarr; Ketuk ikon <strong>Share</strong> &rarr; Pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Kamera Barcode Cepat</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Didukung pemindaian barcode langsung via kamera ponsel untuk cek stok dan pengembalian unit demo di lapangan.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System & Audio */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Preferensi &amp; Database</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">Audio Feedback & Scanner Bip</div>
              <div className="text-[11px] text-slate-500">Bunyikan efek suara saat pemindaian barcode sukses</div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, soundEnabled: !formData.soundEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                formData.soundEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {formData.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{formData.soundEnabled ? 'Aktif' : 'Muted'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-blue-950">Backup Database Manual</div>
                <div className="text-[11px] text-blue-800/70">Unduh arsip lengkap data inventaris, demo unit, dan riwayat transaksi (JSON)</div>
              </div>
              <button
                type="button"
                onClick={handleBackup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Backup</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-blue-100">
              <div>
                <div className="text-xs font-bold text-blue-950">Restore Backup JSON</div>
                <div className="text-[11px] text-blue-800/70">Pilih file backup yang sudah diunduh untuk mengembalikan data aplikasi.</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestore}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Backup</span>
                </button>
              </div>
            </div>

            {restoreMessage && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${
                restoreMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {restoreMessage.text}
              </div>
            )}
          </div>

          <div className="border border-rose-200 bg-rose-50/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-bold text-rose-800">Zona Berbahaya & Reset Data</div>
            </div>
            <div className="text-[11px] text-rose-700 leading-relaxed">
              Hapus semua data inventaris, transaksi, dan riwayat demo saat ini agar Anda dapat memasukkan data riil perusahaan dari awal (bersih dari nol).
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenClearModal}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Data (Mulai Real dari Nol)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Muat Ulang Contoh Data Demo"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat Contoh Demo</span>
              </button>
            </div>
            {clearMessage && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${
                clearMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {clearMessage.text}
              </div>
            )}
          </div>
        </div>

          {/* Role Management (Admin only) */}
          {getPermissions(currentUser.role).canManageUsers && (
            <div className="pt-4 border-t border-slate-100">
              <RoleManagement currentUser={currentUser} />
            </div>
          )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Pengaturan berhasil disimpan!
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>

      </form>

      {/* Modal Konfirmasi Hapus Semua Data */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Semua Data</h3>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    Tindakan permanen untuk membersihkan data aplikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Anda akan menghapus seluruh data yang ada saat ini agar sistem siap digunakan untuk <strong>input data riil dari nol</strong>.
              </div>

              {/* Checklist items to be cleared */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-slate-700 font-medium">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data yang akan dikosongkan (0 data):
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Seluruh Produk Inventaris, Unit SN & Stok per Gudang</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Riwayat Mutasi Stok (Inbound, Outbound, Transfer)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Peminjaman Unit Demo & Surat Peminjaman</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Surat Jalan (Sales Order) & Penerimaan Barang (GR)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Tiket Servis Workshop & Sesi Stock Opname</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Pilihan Pembersihan:</label>
                <div 
                  onClick={() => setKeepMasterStructure(true)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    keepMasterStructure 
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      checked={keepMasterStructure}
                      onChange={() => setKeepMasterStructure(true)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Pertahankan Master Kategori & Gudang (Direkomendasikan)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Menghapus semua stok dan transaksi ke 0, tetapi mempertahankan nama perusahaan, daftar gudang, kategori produk, dan lokasi rak agar langsung siap input produk riil.
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setKeepMasterStructure(false)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    !keepMasterStructure 
                      ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      checked={!keepMasterStructure}
                      onChange={() => setKeepMasterStructure(false)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Reset Total / Kosongkan Penuh</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Mereset seluruh data dan mengosongkan profil perusahaan, kategori, serta daftar gudang.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation input */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Ketik kata <span className="font-black text-rose-600 uppercase tracking-wider">HAPUS</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={clearConfirmationText}
                  onChange={(e) => setClearConfirmationText(e.target.value)}
                  placeholder="Ketik HAPUS di sini..."
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:font-normal placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllData}
                disabled={clearConfirmationText.trim().toUpperCase() !== 'HAPUS'}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Muat Contoh Demo */}
      {isResetDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Muat Contoh Data Demo</h3>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    Memuat kembali sampel produk printer, ribbon, kartu, dan transaksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memuat kembali data contoh demo bawaan sistem? Data saat ini akan digantikan dengan data contoh printer IDP Smart, ribbon, dan kartu.
              </p>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDemoData}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Muat Contoh Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
