import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  RotateCcw, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  Building, 
  User as UserIcon,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';

interface CheckinDemoTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSaveCheckin: (data: any) => void;
  onCancel: () => void;
}

export const CheckinDemoTab: React.FC<CheckinDemoTabProps> = ({
  items,
  currentUser,
  settings,
  onSaveCheckin,
  onCancel
}) => {
  const [diNumber, setDiNumber] = useState('DI-2024-00032');
  const [dateTime, setDateTime] = useState('2024-05-31T15:45');
  const [customer, setCustomer] = useState('PT. Maju Jaya');
  const [picReceiver, setPicReceiver] = useState(currentUser.name || 'Siti Aminah');
  const [damageNotes, setDamageNotes] = useState('Ada goresan kecil pada body bagian kanan.');

  // Demo units being checked in
  const [units, setUnits] = useState([
    { sn: 'SN001120', before: 'Baik', after: 'Baik' },
    { sn: 'SN000888', before: 'Baik', after: 'Rusak Ringan' }
  ]);

  // Inspection Photos
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
  ]);

  const handleAfterConditionChange = (index: number, newCond: string) => {
    const updated = [...units];
    updated[index].after = newCond;
    setUnits(updated);
  };

  const handleAddPhoto = () => {
    const sample = 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&auto=format&fit=crop&q=80';
    setPhotos([...photos, sample]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckin({
      diNumber,
      dateTime,
      customer,
      picReceiver,
      units,
      damageNotes,
      photos
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumbs matching Screenshot: Demo / Check In */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Demo</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Check In</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
          CHECK IN (DEMO IN)
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Top Grid: Left DI Meta & Right Units/Inspection */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Form Meta */}
          <div className="md:col-span-5 space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">No. DI</label>
              <input
                type="text"
                value={diNumber}
                onChange={(e) => setDiNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">Tanggal</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">Customer</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">PIC Penerima</label>
              <input
                type="text"
                value={picReceiver}
                onChange={(e) => setPicReceiver(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Column: Daftar Unit & Inspection Proof */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Daftar Unit Table matching Screenshot */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Daftar Unit
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Serial Number</th>
                      <th className="py-2.5 px-3.5">Kondisi Sebelum</th>
                      <th className="py-2.5 px-3.5">Kondisi Sesudah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700 bg-white">
                    {units.map((u, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3.5 font-mono font-bold text-blue-600">{u.sn}</td>
                        <td className="py-2 px-3.5 text-slate-600">{u.before}</td>
                        <td className="py-2 px-3.5">
                          <select
                            value={u.after}
                            onChange={(e) => handleAfterConditionChange(i, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Perlu Servis">Perlu Servis</option>
                            <option value="Rusak Total">Rusak Total</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Catatan / Kerusakan */}
            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">
                Catatan / Kerusakan
              </label>
              <textarea
                rows={2}
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Ada goresan kecil pada body bagian kanan..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Foto Upload Gallery matching Screenshot */}
            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1.5">
                Foto
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {photos.map((p, idx) => (
                  <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative group">
                    <img src={p} alt="Inspection" className="w-full h-full object-cover" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Buttons matching Screenshot: [Batal], [Simpan] */}
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
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>

      </form>
    </div>
  );
};
