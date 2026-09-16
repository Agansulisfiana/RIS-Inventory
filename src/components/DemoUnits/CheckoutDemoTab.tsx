import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  RotateCcw, 
  Upload, 
  CheckCircle2, 
  Trash2, 
  PenTool, 
  Calendar, 
  Building, 
  User as UserIcon,
  Save
} from 'lucide-react';
import { InventoryItem, User, WarehouseSettings } from '../../types';

interface CheckoutDemoTabProps {
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onSaveCheckout: (data: any) => void;
  onCancel: () => void;
}

export const CheckoutDemoTab: React.FC<CheckoutDemoTabProps> = ({
  items,
  currentUser,
  settings,
  onSaveCheckout,
  onCancel
}) => {
  const [doNumber, setDoNumber] = useState('DO-2024-00045');
  const [dateTime, setDateTime] = useState('2024-05-31T10:30');
  const [customer, setCustomer] = useState('PT. ABC');
  const [picReceiver, setPicReceiver] = useState('Budi Santoso');
  const [documentFile, setDocumentFile] = useState('DO-2024-00045.pdf');
  
  // Units in this DO
  const [units, setUnits] = useState([
    { sn: 'SN001235', product: 'IDP Smart-81', condition: 'Baik' },
    { sn: 'SN000950', product: 'Fargo HDP5600', condition: 'Baik' }
  ]);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(true);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const resetSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckout({
      doNumber,
      dateTime,
      customer,
      picReceiver,
      documentFile,
      units
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumbs matching Screenshot: Demo / Checkout */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Demo</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Checkout</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 mt-1">
          CHECK OUT (DEMO OUT)
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Top Grid: DO Info on Left, Daftar Unit on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: DO Details & Signature */}
          <div className="md:col-span-7 space-y-4">
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold text-[11px] mb-1">No. DO</label>
                <input
                  type="text"
                  value={doNumber}
                  onChange={(e) => setDoNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[11px] mb-1">Tanggal & Waktu</label>
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

            {/* Dokumen Attachment */}
            <div>
              <label className="block text-slate-500 font-bold text-[11px] mb-1">Dokumen</label>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">{documentFile}</span>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-600 p-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tanda Tangan Canvas matching Screenshot */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-500 font-bold text-[11px]">Tanda Tangan</label>
                <button
                  type="button"
                  onClick={resetSignature}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  Reset
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl bg-slate-50 relative h-28 flex items-center justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={110}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair bg-transparent"
                />
                {!hasSignature && (
                  <div className="absolute text-[11px] text-slate-400 pointer-events-none flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Tanda tangan penerima di sini</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Daftar Unit Table */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Unit
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Serial Number</th>
                    <th className="py-2.5 px-3.5">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700 bg-white">
                  {units.map((u, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3.5">
                        <div className="font-mono font-bold text-blue-600">{u.sn}</div>
                        <div className="text-[10px] text-slate-400">{u.product}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          {u.condition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Action Buttons matching Screenshot: [Batal], [Simpan & Cetak] */}
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
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Simpan & Cetak</span>
          </button>
        </div>

      </form>
    </div>
  );
};
