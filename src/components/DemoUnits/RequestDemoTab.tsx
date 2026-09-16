import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Send, 
  X, 
  Calendar, 
  Building, 
  UserCheck, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';

interface RequestDemoTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSubmitRequest: (formData: any) => void;
  onCancel: () => void;
}

export const RequestDemoTab: React.FC<RequestDemoTabProps> = ({
  items,
  currentUser,
  settings,
  onSubmitRequest,
  onCancel
}) => {
  const [customer, setCustomer] = useState('PT. ABC');
  const [purpose, setPurpose] = useState('Demo Produk');
  const [startDate, setStartDate] = useState('2024-06-01');
  const [returnDate, setReturnDate] = useState('2024-06-15');
  const [picSales, setPicSales] = useState(currentUser.name || 'Budi Santoso');
  const [notes, setNotes] = useState('Untuk demo produk di kantor cabang klien selama 14 hari');
  
  // Selected Units list
  const [selectedUnits, setSelectedUnits] = useState<Array<{ id: string; sn: string; product: string; condition: string }>>([
    { id: 'item-001', sn: 'SN001235', product: 'IDP Smart-81', condition: 'Baik' },
    { id: 'item-003', sn: 'SN000950', product: 'Fargo HDP5600', condition: 'Baik' }
  ]);

  const [showUnitSelector, setShowUnitSelector] = useState(false);

  const availableUnits = items.filter(i => 
    i.status === 'tersedia' || i.status === 'in_warehouse'
  );

  const handleAddUnit = (item: InventoryItem) => {
    if (selectedUnits.some(u => u.id === item.id)) return;
    setSelectedUnits([...selectedUnits, {
      id: item.id,
      sn: item.serialNumber,
      product: item.name,
      condition: item.condition === 'baru' || item.condition === 'bagus' ? 'Baik' : 'Perlu Servis'
    }]);
    setShowUnitSelector(false);
  };

  const handleRemoveUnit = (id: string) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnits.length === 0) {
      alert('Pilih minimal 1 unit untuk demo.');
      return;
    }
    onSubmitRequest({
      customer,
      purpose,
      startDate,
      returnDate,
      picSales,
      notes,
      units: selectedUnits
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumbs matching Screenshot: Demo / Request Demo / Tambah */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Demo</span>
            <span>/</span>
            <span>Request Demo</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Tambah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
            REQUEST DEMO
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Form Fields Grid matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Customer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="PT. ABC">PT. ABC</option>
              <option value="PT. Maju Jaya">PT. Maju Jaya</option>
              <option value="CV. Makmur">CV. Makmur</option>
              <option value="PT. Sukses Abadi">PT. Sukses Abadi</option>
              <option value="PT. Indo Global">PT. Indo Global</option>
              <option value="PT. Solusi Prima">PT. Solusi Prima</option>
            </select>
          </div>

          {/* Tujuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tujuan <span className="text-rose-500">*</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Demo Produk">Demo Produk</option>
              <option value="POC (Proof of Concept)">POC (Proof of Concept)</option>
              <option value="Uji Coba Tender">Uji Coba Tender</option>
              <option value="Peminjaman Sementara">Peminjaman Sementara</option>
            </select>
          </div>

          {/* Tgl Mulai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tgl Mulai <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Estimasi Kembali */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estimasi Kembali <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* PIC / Sales */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PIC / Sales <span className="text-rose-500">*</span>
            </label>
            <select
              value={picSales}
              onChange={(e) => setPicSales(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Budi Santoso">Budi Santoso (Warehouse / Sales)</option>
              <option value="Siti Aminah">Siti Aminah (Sales Enterprise)</option>
              <option value="Rudi Hermawan">Rudi Hermawan (Head of Sales)</option>
              <option value="Andi Setiawan">Andi Setiawan (Technical Specialist)</option>
            </select>
          </div>

          {/* Catatan */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Untuk demo produk di kantor cabang..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Selected Units Table matching Screenshot */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Unit Terpilih ({selectedUnits.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowUnitSelector(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pilih Unit</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Serial Number</th>
                  <th className="py-2.5 px-3.5">Produk</th>
                  <th className="py-2.5 px-3.5">Kondisi</th>
                  <th className="py-2.5 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {selectedUnits.length > 0 ? (
                  selectedUnits.map((u) => (
                    <tr key={u.id} className="bg-white">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{u.sn}</td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-semibold">{u.product}</td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          {u.condition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      Belum ada unit yang dipilih. Klik tombol "+ Pilih Unit" di atas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons matching Screenshot: [Batal], [Kirim Request] */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Request</span>
          </button>
        </div>

      </form>

      {/* Unit Selector Modal */}
      {showUnitSelector && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Pilih Unit Tersedia di Gudang</h3>
              <button onClick={() => setShowUnitSelector(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {availableUnits.map(item => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-mono font-bold text-blue-600 text-xs">{item.serialNumber}</div>
                    <div className="font-semibold text-slate-800 text-xs">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.location}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddUnit(item)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Pilih
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
