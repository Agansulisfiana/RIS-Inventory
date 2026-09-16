import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { WarehouseSettings, User as UserType } from '../../types';
import { storageService } from '../../services/storage';
import { getPermissions } from '../../utils/permissions';
import RoleManagement from './RoleManagement';

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
      category: 'security',
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
                        category: 'security',
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
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
    </div>
  );
};
