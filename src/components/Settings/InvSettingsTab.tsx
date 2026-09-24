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
  QrCode,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Users
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

type SettingsSection = 'profile' | 'master' | 'security' | 'pwa' | 'database' | 'roles';

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
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-72 shadow-2xs">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{title}</div>
      <div className="flex gap-2 mb-3">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="Tambah item baru..."
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
        <button 
          type="button" 
          onClick={handleAdd} 
          className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700 truncate">{item}</span>
            <button 
              type="button" 
              onClick={() => handleRemove(idx)} 
              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Hapus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-slate-400 text-center italic py-8">
            Belum ada item ditambahkan
          </div>
        )}
      </div>
    </div>
  );
};

export const InvSettingsTab: React.FC<InvSettingsTabProps> = ({
  settings,
  currentUser,
  onRefreshData
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
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

  const permissions = getPermissions(currentUser.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData, currentUser);
    storageService.addAuditLog({
      action: 'UPDATE_SETTINGS',
      module: 'system',
      category: 'system',
      details: 'Mengubah konfigurasi profil & master gudang',
      user: currentUser
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handlePinUpdate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentPin = formData.adminPin || '';
    const enteredCurrentPin = pinForm.currentPin.trim();
    const newPin = pinForm.newPin.trim();
    const confirmPin = pinForm.confirmPin.trim();

    if (!newPin || !confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN baru dan konfirmasi PIN wajib diisi.' });
      return;
    }

    if (newPin.length < 4) {
      setPinMessage({ type: 'error', text: 'PIN keamanan minimal terdiri dari 4 karakter.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }

    if (currentPin && enteredCurrentPin && enteredCurrentPin !== currentPin) {
      setPinMessage({ type: 'error', text: 'PIN lama yang Anda masukkan tidak sesuai.' });
      return;
    }

    if (currentPin && !enteredCurrentPin && !pinForm.resetConfirmed) {
      setPinMessage({ type: 'error', text: 'Masukkan PIN lama atau aktifkan opsi reset jika Anda lupa PIN lama.' });
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
      details: currentPin ? 'Mengubah PIN keamanan admin' : 'Membuat PIN keamanan admin baru',
      user: currentUser
    });

    setPinMessage({
      type: 'success',
      text: currentPin ? 'PIN admin berhasil diperbarui!' : 'PIN admin berhasil diaktifkan!'
    });
    setPinForm({ currentPin: '', newPin: '', confirmPin: '', resetConfirmed: false });
    onRefreshData();
  };

  const handleDisablePin = () => {
    const nextSettings: WarehouseSettings = { ...formData, adminPin: '' };
    setFormData(nextSettings);
    setPinForm({ currentPin: '', newPin: '', confirmPin: '', resetConfirmed: false });
    storageService.saveSettings(nextSettings, currentUser);
    storageService.addAuditLog({
      action: 'DISABLE_ADMIN_PIN',
      module: 'system',
      category: 'system',
      details: 'Menonaktifkan PIN keamanan admin',
      user: currentUser
    });
    setPinMessage({ type: 'success', text: 'Proteksi PIN keamanan telah dinonaktifkan.' });
    onRefreshData();
  };

  const handleBackup = () => {
    const snap = storageService.createBackup(currentUser);
    const blob = new Blob([snap.dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setRestoreMessage({ type: 'error', text: 'File restore harus berformat .JSON backup.' });
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const ok = storageService.importBackupJSON(text, currentUser);

      if (!ok) {
        setRestoreMessage({ type: 'error', text: 'Format file backup tidak valid atau data korup.' });
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

      setRestoreMessage({ type: 'success', text: 'Seluruh data backup berhasil dipulihkan.' });
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
        ? 'Menghapus seluruh inventaris & transaksi (struktur master dipertahankan)' 
        : 'Menghapus semua data aplikasi & reset total untuk mulai dari nol',
      user: currentUser
    });

    const refreshedSettings = storageService.getSettings();
    setFormData(refreshedSettings);

    setClearMessage({
      type: 'success',
      text: keepMasterStructure
        ? 'Semua data barang, transaksi, dan demo berhasil dibersihkan. Kategori & gudang tetap dipertahankan.'
        : 'Semua data aplikasi berhasil direset total. Aplikasi sekarang kosong dari nol.'
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

  // Navigasi sub-tab yang terstruktur
  const navTabs: { id: SettingsSection; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'profile', label: 'Profil Perusahaan', icon: Building2 },
    { id: 'master', label: 'Master Data', icon: Database },
    { 
      id: 'security', 
      label: 'Keamanan & PIN', 
      icon: Shield, 
      badge: formData.adminPin ? 'PIN Aktif' : undefined 
    },
    { id: 'pwa', label: 'Mode Lapangan (PWA)', icon: Smartphone },
    { id: 'database', label: 'Database & Cadangan', icon: Layers },
    ...(permissions.canManageUsers ? [{ id: 'roles' as SettingsSection, label: 'Hak Akses & Role', icon: Users }] : [])
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Pengaturan</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Profil Perusahaan &amp; Sistem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
            PENGATURAN SISTEM
          </h1>
        </div>

        {/* Global Save Indicator */}
        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>

      {/* Modern Horizontal Navigation Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar select-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: PROFIL PERUSAHAAN ================= */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Identitas Perusahaan &amp; Lokasi Utama</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi ini akan tercetak pada kop surat jalan, tanda terima demo, dan laporan resmi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Perusahaan / Organisasi</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Contoh: PT. Reycom Integrated Solusi"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Gudang / Cabang Operasional</label>
              <input
                type="text"
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Contoh: Gudang Utama Jakarta"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5">Alamat Lengkap Gudang</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Jl. Raya Pos Pengumben No. 12, Kebon Jeruk, Jakarta Barat"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nomor Telepon / Hotline</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="+62 21 5366 1234"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Kepala Gudang / Penanggung Jawab (PIC)</label>
              <input
                type="text"
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Nama PIC Gudang"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Perusahaan</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: MASTER DATA ================= */}
      {activeSection === 'master' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Pilihan Master Data Form</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola daftar pilihan dropdown saat input produk baru, mutasi stok, dan lokasi rak.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListManager
              title="Daftar Gudang / Cabang"
              items={formData.warehouses || []}
              onChange={(newItems) => setFormData({ ...formData, warehouses: newItems })}
            />
            <ListManager
              title="Kategori Produk"
              items={formData.categories || []}
              onChange={(newItems) => setFormData({ ...formData, categories: newItems })}
            />
            <ListManager
              title="Lokasi Rak / Baris"
              items={formData.rackLocations || []}
              onChange={(newItems) => setFormData({ ...formData, rackLocations: newItems })}
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Master Data</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 3: KEAMANAN & PIN ================= */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          {/* Card Status PIN */}
          <div className={`p-5 rounded-2xl border transition-all ${
            formData.adminPin 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  formData.adminPin ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {formData.adminPin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {formData.adminPin ? 'Proteksi PIN Admin Aktif' : 'Proteksi PIN Belum Diatur'}
                  </h3>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {formData.adminPin 
                      ? 'Penghapusan master produk memerlukan verifikasi PIN keamanan agar tidak dapat dihapus sembarangan.' 
                      : 'Produk saat ini dapat dihapus langsung tanpa konfirmasi PIN. Disarankan membuat PIN untuk mencegah data terhapus tidak sengaja.'}
                  </p>
                </div>
              </div>

              {formData.adminPin && (
                <button
                  type="button"
                  onClick={handleDisablePin}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  Nonaktifkan PIN
                </button>
              )}
            </div>
          </div>

          {/* Form Pengaturan PIN */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>{formData.adminPin ? 'Ganti PIN Keamanan Admin' : 'Buat PIN Keamanan Admin'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                PIN dapat berupa angka atau kombinasi huruf (minimal 4 karakter).
              </p>
            </div>

            <form onSubmit={handlePinUpdate} className="space-y-4 max-w-lg">
              {formData.adminPin && !pinForm.resetConfirmed && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Lama Saat Ini
                  </label>
                  <input
                    type="password"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                    placeholder="Masukkan PIN lama Anda"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono tracking-widest text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {formData.adminPin && (
                <label className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinForm.resetConfirmed}
                    onChange={(e) => setPinForm({ ...pinForm, resetConfirmed: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Saya lupa PIN lama, izinkan buat PIN baru langsung (Reset Admin).</span>
                </label>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.adminPin ? 'PIN Baru' : 'PIN Keamanan'}
                  </label>
                  <input
                    type="password"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                    placeholder="Min. 4 karakter"
                    maxLength={20}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono tracking-widest text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type="password"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                    placeholder="Ulangi PIN baru"
                    maxLength={20}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono tracking-widest text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {pinMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  pinMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {pinMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{pinMessage.text}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{formData.adminPin ? 'Simpan Perubahan PIN' : 'Aktifkan PIN Keamanan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 4: MODE LAPANGAN (PWA) ================= */}
      {activeSection === 'pwa' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-md border border-slate-700 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-black text-base tracking-tight text-white">
                    Aplikasi Lapangan PWA (Progressive Web App)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    ONLINE &amp; OFFLINE READY
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Staf gudang dan sales dapat menginstal aplikasi langsung ke layar utama smartphone atau tablet (Android &amp; iOS) untuk scan barcode cepat tanpa perlu membuka URL browser.
                </p>
              </div>

              <div className="shrink-0">
                <PWAInstallButton variant="settings" />
              </div>
            </div>

            {/* 3 Kartu Panduan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Android &amp; PDA Gudang</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Buka di Google Chrome &rarr; Ketuk menu titik tiga di kanan atas &rarr; Pilih <strong>&ldquo;Install app&rdquo;</strong> atau <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong>.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>iPhone &amp; iPad (Apple iOS)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Buka di Safari &rarr; Ketuk ikon <strong>Share (Bagikan)</strong> di bilah bawah &rarr; Pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>Kamera Barcode Cepat</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Didukung scanner kamera langsung dari perangkat ponsel untuk pencarian stok dan check-in/out unit demo di lapangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: DATABASE & CADANGAN ================= */}
      {activeSection === 'database' && (
        <div className="space-y-6">
          {/* Preferensi Suara */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Audio Feedback &amp; Scanner Bip</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Bunyikan efek audio saat scan barcode sukses atau transaksi selesai.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextSettings = { ...formData, soundEnabled: !formData.soundEnabled };
                setFormData(nextSettings);
                storageService.saveSettings(nextSettings, currentUser);
                onRefreshData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                formData.soundEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {formData.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{formData.soundEnabled ? 'Suara Aktif' : 'Muted (Nonaktif)'}</span>
            </button>
          </div>

          {/* Backup & Restore Data */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Cadangan &amp; Pemulihan Data (Backup &amp; Restore)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan file salinan data secara berkala atau pulihkan data dari file backup JSON sebelumnya.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <div className="font-bold text-xs text-blue-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Backup Database</span>
                </div>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Unduh seluruh data produk, stok gudang, riwayat mutasi, dan unit demo dalam 1 file JSON aman.
                </p>
                <button
                  type="button"
                  onClick={handleBackup}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Backup (.JSON)</span>
                </button>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                <div className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restore Data dari Backup</span>
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  Pulihkan kembali data inventaris dari file backup JSON yang pernah diunduh sebelumnya.
                </p>
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
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Backup untuk Restore</span>
                </button>
              </div>
            </div>

            {restoreMessage && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                restoreMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {restoreMessage.text}
              </div>
            )}
          </div>

          {/* Zona Bahaya & Reset */}
          <div className="border border-rose-200 bg-rose-50/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Zona Bahaya &amp; Pengosongan Data</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Tindakan ini permanen. Pastikan Anda sudah mengunduh backup sebelum melakukan reset.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenClearModal}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Data (Mulai Real dari Nol)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Muat Contoh Data Demo</span>
              </button>
            </div>

            {clearMessage && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                clearMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {clearMessage.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: HAK AKSES & ROLE ================= */}
      {activeSection === 'roles' && permissions.canManageUsers && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs">
          <RoleManagement currentUser={currentUser} />
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS SEMUA DATA ================= */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
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

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Anda akan menghapus data yang ada saat ini agar sistem siap digunakan untuk <strong>input data riil dari nol</strong>.
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-slate-700 font-medium">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data yang akan dikosongkan (0 data):
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Seluruh Produk Inventaris, Unit SN &amp; Stok per Gudang</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Riwayat Mutasi Stok (Inbound, Outbound, Transfer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Peminjaman Unit Demo &amp; Surat Jalan Demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Semua Surat Jalan Penjualan (SO) &amp; Penerimaan Barang (GR)</span>
                </div>
              </div>

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
                      <div className="font-bold text-slate-900">Pertahankan Master Kategori &amp; Gudang (Direkomendasikan)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Menghapus semua stok ke 0, tetapi profil perusahaan, daftar gudang, dan kategori tetap tersimpan.
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
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Mereset seluruh data dan mengosongkan semua kategori serta lokasi gudang.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Ketik kata <span className="font-black text-rose-600 uppercase tracking-wider">HAPUS</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={clearConfirmationText}
                  onChange={(e) => setClearConfirmationText(e.target.value)}
                  placeholder="Ketik HAPUS di sini..."
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>
            </div>

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

      {/* ================= MODAL KONFIRMASI MUAT CONTOH DEMO ================= */}
      {isResetDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Muat Contoh Data Demo</h3>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    Memuat sampel produk printer, ribbon, kartu, dan transaksi
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
                Apakah Anda yakin ingin memuat kembali data contoh bawaan sistem? Data produk dan transaksi saat ini akan diganti dengan sampel printer IDP Smart, ribbon, dan kartu.
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

