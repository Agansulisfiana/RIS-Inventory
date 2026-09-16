import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  ShieldAlert, 
  Bell, 
  Building, 
  Phone, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Save
} from 'lucide-react';
import { WarehouseSettings, User, BackupSnapshot } from '../../types';
import { storageService } from '../../services/storage';
import { RisLogo } from '../Common/RisLogo';

interface SettingsTabProps {
  settings: WarehouseSettings;
  currentUser: User;
  onRefreshData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  currentUser,
  onRefreshData
}) => {
  const [formData, setFormData] = useState<WarehouseSettings>({ ...settings });
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(storageService.getBackupSnapshots());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData, currentUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefreshData();
  };

  // Export full DB backup JSON file
  const handleExportJSON = () => {
    const backupJson = storageService.exportFullBackupJSON();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GUDANGPRO_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const success = storageService.importBackupJSON(content, currentUser);
        if (success) {
          alert('Data backup berhasil di-restore!');
          setSnapshots(storageService.getBackupSnapshots());
          onRefreshData();
        } else {
          alert('Format file JSON backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file backup.');
      }
    };
    reader.readAsText(file);
  };

  // Restore snapshot
  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    if (confirm(`Pulihkan data ke titik restore snapshot "${snap.timestamp}"? Data saat ini akan diperbarui.`)) {
      const success = storageService.restoreFromSnapshot(snap.id, currentUser);
      if (success) {
        alert('Data berhasil dipulihkan dari snapshot!');
        onRefreshData();
      }
    }
  };

  // Reset to sample data
  const handleResetToDemo = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset data gudang ke contoh data awal (Default Demo)?')) {
      storageService.resetToDefaultData();
      onRefreshData();
      alert('Data gudang berhasil direset ke mode demo bawaan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Pengaturan Gudang & Sistem Backup Harian
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Konfigurasi identitas perusahaan, batas minimum notifikasi stok, dan pencadangan data otomatis harian
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pengaturan berhasil disimpan dan langsung diterapkan ke seluruh sistem!
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-blue-600" />
              Identitas & Informasi Gudang
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Nama Perusahaan / Bisnis:</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Nama Cabang Gudang:</label>
                  <input
                    type="text"
                    value={formData.warehouseName}
                    onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Alamat Lengkap Gudang:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Nomor WhatsApp PIC / Kepala Gudang:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Email Kontak:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pt-3 pb-3">
              <Bell className="w-4 h-4 text-amber-500" />
              Parameter Notifikasi Otomatis
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Ambang Batas Minimum Stok Default:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThresholdDefault}
                    onChange={(e) => setFormData({ ...formData, lowStockThresholdDefault: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Notifikasi merah akan menyala saat sisa stok ≤ angka ini.
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    Durasi Peminjaman Demo Default (Hari):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.demoLoanDurationDays}
                    onChange={(e) => setFormData({ ...formData, demoLoanDurationDays: parseInt(e.target.value) || 7 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Peringatan telat akan muncul jika melewati durasi ini.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableSoundEffects}
                    onChange={(e) => setFormData({ ...formData, enableSoundEffects: e.target.checked })}
                    className="rounded bg-slate-50 border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Aktifkan Efek Suara (Audio Feedback) saat Scan Barcode & Notifikasi</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoBackupDaily}
                    onChange={(e) => setFormData({ ...formData, autoBackupDaily: e.target.checked })}
                    className="rounded bg-slate-50 border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Buat Snapshot Backup Otomatis Harian saat Aplikasi Dibuka</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Database Backup & Restore */}
        <div className="space-y-6">
          {/* Logo & Application Brand Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Logo & Identitas Resmi
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <RisLogo size={48} />
              <div>
                <div className="font-black text-slate-900 text-sm">RIS Inventory</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase">Produk & Demo Unit</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Vektor Transparan Resmi RIS</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Logo resmi PT. Reycom Integrated Solusi dengan format transparan beresolusi tinggi digunakan di seluruh header, cetak surat jalan, TV wallboard, dan favicon browser.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-emerald-600" />
              Pencadangan Data (Backup & Restore)
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Amankan database gudang dengan mengekspor seluruh tabel (barang, transaksi, log audit, user) ke file JSON offline.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh File Backup Database (.JSON)
              </button>

              <label className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-200">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Restore dari File Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Snapshots List */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Snapshot Harian Otomatis:</span>
                <span className="text-[10px] text-slate-400 font-normal">{snapshots.length} tersimpan</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {snapshots.length > 0 ? (
                  snapshots.map(snap => (
                    <div key={snap.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-[11px] text-slate-800 font-medium">{snap.timestamp.replace('T', ' ').substring(0, 16)}</div>
                        <div className="text-[10px] text-slate-500">{snap.itemsCount} SKU • {snap.transactionsCount} Trx</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 py-2 text-center">
                    Belum ada snapshot backup otomatis harian.
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {currentUser.role === 'admin' && (
              <div className="pt-3 border-t border-rose-100">
                <div className="text-xs font-bold text-rose-600 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Zona Berbahaya
                </div>
                <button
                  type="button"
                  onClick={handleResetToDemo}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Database ke Contoh Demo Bawaan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
