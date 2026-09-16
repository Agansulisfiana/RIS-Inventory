import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  X,
  Calendar,
  User as UserIcon,
  Search,
  ChevronRight,
  ArrowLeft,
  Layers,
  Package,
  AlertTriangle,
  PenSquare,
  CheckSquare,
  XCircle,
  BarChart3,
  Hash,
  Cpu,
  Tag,
  MessageSquare,
  Save,
  Filter
} from 'lucide-react';
import { ServiceTicket, InventoryItem, User, WarehouseSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ServiceTicketTabProps {
  tickets: ServiceTicket[];
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onUpdateTicket: (id: string, updates: Partial<ServiceTicket>) => void;
  onCloseTicket: (id: string) => void;
  onAddNewTicket?: (ticket: Omit<ServiceTicket, 'id'>) => void;
}

type ViewMode = 'list' | 'detail' | 'new';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  'Proses': {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Wrench className="w-3 h-3" />,
    label: 'Sedang Diproses'
  },
  'Menunggu Spare Part': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="w-3 h-3" />,
    label: 'Tunggu Spare Part'
  },
  'Selesai': {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: 'Selesai'
  },
  'Dibatalkan': {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Dibatalkan'
  }
};

export const ServiceTicketTab: React.FC<ServiceTicketTabProps> = ({
  tickets,
  items,
  currentUser,
  settings,
  onUpdateTicket,
  onCloseTicket,
  onAddNewTicket
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [subTab, setSubTab] = useState<'informasi' | 'diagnosa' | 'history' | 'sparepart' | 'dokumen'>('informasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Update Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ServiceTicket['status']>('Proses');
  const [statusNotes, setStatusNotes] = useState('');

  // New Ticket Form
  const [form, setForm] = useState({
    itemId: '',
    customItemName: '',
    customSerialNumber: '',
    customerName: '',
    problem: '',
    technician: currentUser.name,
    entryDate: new Date().toISOString().split('T')[0],
    estimatedCompletion: '',
    notes: '',
    spareParts: [] as { name: string; qty: number; cost: number }[]
  });
  const [newSparePart, setNewSparePart] = useState({ name: '', qty: 1, cost: 0 });

  // Filtered tickets
  const filtered = tickets.filter(t => {
    const matchSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'Semua' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // KPI counts
  const countByStatus = (s: string) => tickets.filter(t => t.status === s).length;

  const handleOpenDetail = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setSubTab('informasi');
    setViewMode('detail');
  };

  const handleOpenStatusModal = () => {
    if (!selectedTicket) return;
    setNewStatus(selectedTicket.status);
    setStatusNotes(selectedTicket.notes || '');
    setShowStatusModal(true);
  };

  const handleSaveStatus = () => {
    if (!selectedTicket) return;
    onUpdateTicket(selectedTicket.id, {
      status: newStatus,
      notes: statusNotes,
      ...(newStatus === 'Selesai' ? { completionDate: new Date().toISOString() } : {})
    });
    setShowStatusModal(false);
    // Close if selesai
    if (newStatus === 'Selesai') {
      onCloseTicket(selectedTicket.id);
      setViewMode('list');
    }
  };

  const handleAddSparePart = () => {
    if (!newSparePart.name.trim()) return;
    setForm(f => ({ ...f, spareParts: [...f.spareParts, { ...newSparePart }] }));
    setNewSparePart({ name: '', qty: 1, cost: 0 });
  };

  const handleRemoveSparePart = (idx: number) => {
    setForm(f => ({ ...f, spareParts: f.spareParts.filter((_, i) => i !== idx) }));
  };

  const handleSubmitNewTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.id === form.itemId);
    const itemName = selectedItem?.name || form.customItemName;
    const serialNumber = selectedItem?.serialNumber || form.customSerialNumber;
    const ticketNumber = `SV-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000)).slice(-5)}`;

    if (!itemName || !form.problem || !form.technician) {
      alert('Nama unit, problem, dan teknisi wajib diisi!');
      return;
    }

    const payload: Omit<ServiceTicket, 'id'> = {
      ticketNumber,
      itemId: form.itemId,
      itemName,
      serialNumber: serialNumber || '-',
      customerName: form.customerName,
      problem: form.problem,
      technician: form.technician,
      entryDate: new Date(form.entryDate).toISOString(),
      estimatedCompletion: form.estimatedCompletion
        ? new Date(form.estimatedCompletion).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'Proses',
      notes: form.notes,
      spareParts: form.spareParts,
      costTotal: form.spareParts.reduce((a, c) => a + c.cost * c.qty, 0)
    };

    if (onAddNewTicket) {
      onAddNewTicket(payload);
    }

    // Reset form
    setForm({
      itemId: '',
      customItemName: '',
      customSerialNumber: '',
      customerName: '',
      problem: '',
      technician: currentUser.name,
      entryDate: new Date().toISOString().split('T')[0],
      estimatedCompletion: '',
      notes: '',
      spareParts: []
    });
    setViewMode('list');
  };

  // ===================== VIEWS =====================

  if (viewMode === 'new') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('list')}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Service</span>
              <span>/</span>
              <span className="text-blue-600 font-bold">Tiket Baru</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
              BUAT TIKET SERVICE BARU
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmitNewTicket} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Form Header */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-slate-900">Form Tiket Service & Maintenance</div>
              <p className="text-xs text-slate-500 font-medium">Isi detail unit dan permasalahan untuk membuat tiket baru</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* Section 1: Unit Info */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Informasi Unit / Perangkat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Unit dari Inventaris</label>
                  <select
                    value={form.itemId}
                    onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih dari database inventaris --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.serialNumber || item.sku})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Atau isi manual di bawah jika tidak ada di inventaris</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Customer / Instansi</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="PT. ABC / Perorangan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {!form.itemId && (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Unit / Produk <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={form.customItemName}
                        onChange={e => setForm(f => ({ ...f, customItemName: e.target.value }))}
                        placeholder="Contoh: Fargo HDP5600"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Serial Number</label>
                      <input
                        type="text"
                        value={form.customSerialNumber}
                        onChange={e => setForm(f => ({ ...f, customSerialNumber: e.target.value }))}
                        placeholder="SN-XXXXXX"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Problem & Technician */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Detail Permasalahan</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Problem / Keluhan <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={form.problem}
                  onChange={e => setForm(f => ({ ...f, problem: e.target.value }))}
                  placeholder="Jelaskan gejala kerusakan atau keluhan secara detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PIC Teknisi <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.technician}
                    onChange={e => setForm(f => ({ ...f, technician: e.target.value }))}
                    placeholder="Nama teknisi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={form.entryDate}
                    onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimasi Selesai</label>
                  <input
                    type="date"
                    value={form.estimatedCompletion}
                    onChange={e => setForm(f => ({ ...f, estimatedCompletion: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Catatan internal teknisi, kelengkapan aksesori yang dibawa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 3: Spare Parts (optional) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Perkiraan Spare Part (Opsional)</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSparePart.name}
                  onChange={e => setNewSparePart(s => ({ ...s, name: e.target.value }))}
                  placeholder="Nama spare part..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={newSparePart.qty}
                  onChange={e => setNewSparePart(s => ({ ...s, qty: Number(e.target.value) }))}
                  placeholder="Qty"
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={newSparePart.cost}
                  onChange={e => setNewSparePart(s => ({ ...s, cost: Number(e.target.value) }))}
                  placeholder="Biaya/pcs"
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSparePart}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap"
                >
                  + Tambah
                </button>
              </div>

              {form.spareParts.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Spare Part</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Biaya / pcs</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.spareParts.map((sp, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{sp.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{sp.qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(sp.cost)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatCurrency(sp.cost * sp.qty)}</td>
                          <td className="py-2.5 px-3">
                            <button type="button" onClick={() => handleRemoveSparePart(i)} className="text-rose-500 hover:text-rose-700">
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 font-bold text-slate-700 text-right">Estimasi Total Biaya:</td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-700">
                          {formatCurrency(form.spareParts.reduce((a, c) => a + c.cost * c.qty, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Buat Tiket Service</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedTicket) {
    const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG['Proses'];
    const totalSparePart = (selectedTicket.spareParts || []).reduce((a, c) => a + c.cost * c.qty, 0);
    const overdue = new Date(selectedTicket.estimatedCompletion) < new Date() && selectedTicket.status !== 'Selesai';

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('list')}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => setViewMode('list')}>Service</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-bold">Detail Tiket</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
              {selectedTicket.ticketNumber}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Ticket Header */}
          <div className={`p-5 border-b border-slate-200 ${overdue ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                  <Wrench className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unit / Perangkat</div>
                  <div className="font-black text-slate-900 text-sm">{selectedTicket.itemName}</div>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">SN: {selectedTicket.serialNumber}</div>
                  {selectedTicket.customerName && (
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {selectedTicket.customerName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${statusCfg.color}`}>
                  {statusCfg.icon}
                  {selectedTicket.status}
                </span>
                {overdue && (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    MELEWATI ESTIMASI
                  </span>
                )}
              </div>
            </div>

            {/* Quick info strip */}
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Masuk: <strong className="text-slate-900">{new Date(selectedTicket.entryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Estimasi: <strong className={overdue ? 'text-rose-600' : 'text-slate-900'}>{new Date(selectedTicket.estimatedCompletion).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Teknisi: <strong className="text-slate-900">{selectedTicket.technician}</strong></span>
              </div>
              {totalSparePart > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Biaya Part: <strong className="text-blue-700">{formatCurrency(totalSparePart)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="px-5 border-b border-slate-200">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['informasi', 'diagnosa', 'history', 'sparepart', 'dokumen'] as const).map(tabKey => (
                <button
                  key={tabKey}
                  onClick={() => setSubTab(tabKey)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px ${
                    subTab === tabKey
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tabKey === 'sparepart' ? 'Spare Part' : tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-tab Content */}
          <div className="p-5">
            {subTab === 'informasi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Problem / Keluhan
                  </div>
                  <p className="text-slate-900 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100 leading-relaxed">
                    {selectedTicket.problem}
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detail Unit</div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nama Produk</span>
                      <span className="font-bold text-slate-900">{selectedTicket.itemName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Serial Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTicket.serialNumber}</span>
                    </div>
                    {selectedTicket.customerName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-bold text-slate-900">{selectedTicket.customerName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>{selectedTicket.status}</span>
                    </div>
                  </div>
                </div>

                {selectedTicket.notes && (
                  <div className="sm:col-span-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Catatan Teknisi
                    </div>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                      {selectedTicket.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {subTab === 'diagnosa' && (
              <div className="space-y-3 text-xs">
                {selectedTicket.diagnosis ? (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Hasil Diagnosa & Analisa Kerusakan
                    </div>
                    <p className="text-blue-800 leading-relaxed">{selectedTicket.diagnosis}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                    <Cpu className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Diagnosa belum diisi</p>
                    <p className="text-[11px]">Teknisi belum menambahkan hasil diagnosa untuk tiket ini.</p>
                  </div>
                )}

                {selectedTicket.status !== 'Selesai' && selectedTicket.status !== 'Dibatalkan' && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-slate-500 text-[11px]">Untuk mengisi atau mengubah diagnosa, gunakan tombol <strong>"Update Status"</strong> di bawah.</p>
                  </div>
                )}
              </div>
            )}

            {subTab === 'history' && (
              <div className="space-y-2 text-xs">
                {/* Entry event always exists */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Unit Masuk Service Workshop</div>
                    <div className="text-[11px] text-slate-500">{new Date(selectedTicket.entryDate).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Teknisi PIC: {selectedTicket.technician}</div>
                  </div>
                </div>

                {selectedTicket.diagnosis && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Diagnosa Kerusakan Tercatat</div>
                      <div className="text-[11px] text-slate-500">Update dari teknisi</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{selectedTicket.diagnosis}</div>
                    </div>
                  </div>
                )}

                {selectedTicket.status === 'Selesai' && selectedTicket.completionDate && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-800">Service Selesai — Unit Dikembalikan</div>
                      <div className="text-[11px] text-emerald-600">{new Date(selectedTicket.completionDate).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {subTab === 'sparepart' && (
              <div className="space-y-3 text-xs">
                {(selectedTicket.spareParts || []).length > 0 ? (
                  <>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Nama Spare Part</th>
                            <th className="py-2.5 px-3 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right">Biaya / pcs</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedTicket.spareParts || []).map((sp, i) => (
                            <tr key={i}>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{sp.name}</td>
                              <td className="py-2.5 px-3 text-center font-mono">{sp.qty}</td>
                              <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(sp.cost)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatCurrency(sp.cost * sp.qty)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 font-bold text-slate-900 text-right">Total Biaya:</td>
                            <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatCurrency(totalSparePart)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="text-[11px] text-slate-400">Spare part di atas merupakan data yang diinput saat pembuatan tiket atau saat update status.</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                    <Layers className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Belum ada spare part</p>
                  </div>
                )}
              </div>
            )}

            {subTab === 'dokumen' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Form_Service_{selectedTicket.ticketNumber}.pdf</div>
                      <div className="text-[10px] text-slate-400">Tanggal masuk: {new Date(selectedTicket.entryDate).toLocaleDateString('id-ID')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Cetak
                  </button>
                </div>

                {(selectedTicket.documents || []).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-800">{doc.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{doc.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions — read-only for closed tickets */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              ← Kembali ke Daftar
            </button>

            {selectedTicket.status !== 'Selesai' && selectedTicket.status !== 'Dibatalkan' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Batalkan tiket ${selectedTicket.ticketNumber}?`)) {
                      onUpdateTicket(selectedTicket.id, { status: 'Dibatalkan' });
                      setViewMode('list');
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batalkan Tiket
                </button>
                <button
                  onClick={handleOpenStatusModal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <PenSquare className="w-4 h-4" />
                  Update Status
                </button>
              </div>
            )}

            {(selectedTicket.status === 'Selesai' || selectedTicket.status === 'Dibatalkan') && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${statusCfg.color}`}>
                {statusCfg.icon}
                Tiket {selectedTicket.status} — Read Only
              </div>
            )}
          </div>
        </div>

        {/* Update Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-5 border-b border-slate-200 bg-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-black text-slate-900">Update Status Tiket</h3>
                    <p className="text-xs text-slate-500">{selectedTicket.ticketNumber} — {selectedTicket.itemName}</p>
                  </div>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Baru</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Proses', 'Menunggu Spare Part', 'Selesai', 'Dibatalkan'] as const).map(s => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewStatus(s)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold transition-all cursor-pointer text-left ${
                            newStatus === s ? cfg.color + ' ring-2 ring-offset-1 ring-blue-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Diagnosa / Update Catatan</label>
                  <textarea
                    rows={4}
                    value={statusNotes}
                    onChange={e => setStatusNotes(e.target.value)}
                    placeholder="Tulis hasil diagnosa, progress perbaikan, atau alasan pembatalan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {newStatus === 'Selesai' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-medium">
                    ✅ Menutup tiket ini akan mengembalikan status unit ke <strong>"Tersedia"</strong> di inventaris secara otomatis.
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Wrench className="w-4 h-4" />
            <span>MANAJEMEN SERVICE & MAINTENANCE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            SERVICE TICKET
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Kelola tiket service, perbaikan unit, dan histori maintenance
          </p>
        </div>

        <button
          onClick={() => setViewMode('new')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Tiket Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tiket', value: tickets.length, color: 'bg-slate-50 border-slate-200', numColor: 'text-slate-900' },
          { label: 'Sedang Proses', value: countByStatus('Proses'), color: 'bg-amber-50 border-amber-200', numColor: 'text-amber-700' },
          { label: 'Tunggu Part', value: countByStatus('Menunggu Spare Part'), color: 'bg-blue-50 border-blue-200', numColor: 'text-blue-700' },
          { label: 'Selesai', value: countByStatus('Selesai'), color: 'bg-emerald-50 border-emerald-200', numColor: 'text-emerald-700' }
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-xl border ${kpi.color} space-y-1`}>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-2xl font-black font-heading ${kpi.numColor}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Ticket, nama unit, serial number, teknisi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Proses">Sedang Proses</option>
            <option value="Menunggu Spare Part">Tunggu Spare Part</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Ticket</th>
                <th className="py-3.5 px-4">Unit & Serial</th>
                <th className="py-3.5 px-4">Problem</th>
                <th className="py-3.5 px-4">Teknisi</th>
                <th className="py-3.5 px-4">Tanggal Masuk</th>
                <th className="py-3.5 px-4">Estimasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length > 0 ? filtered.map(ticket => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['Proses'];
                const isOverdue = new Date(ticket.estimatedCompletion) < new Date() && ticket.status !== 'Selesai' && ticket.status !== 'Dibatalkan';

                return (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isOverdue ? 'bg-rose-50/30' : ''}`}
                    onClick={() => handleOpenDetail(ticket)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-black text-blue-700 text-xs">{ticket.ticketNumber}</div>
                      {isOverdue && (
                        <div className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ticket.itemName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{ticket.serialNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <p className="line-clamp-2 text-slate-700">{ticket.problem}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[10px] font-black">
                          {ticket.technician.charAt(0).toUpperCase()}
                        </div>
                        <span>{ticket.technician}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(ticket.entryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {new Date(ticket.estimatedCompletion).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${cfg.color}`}>
                        {cfg.icon}
                        {ticket.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(ticket)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        Detail <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Wrench className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Tidak ada tiket service ditemukan</p>
                    <p className="text-[11px] mt-1">Coba ubah filter atau buat tiket baru</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-900">{filtered.length}</strong> dari <strong className="text-slate-900">{tickets.length}</strong> tiket
          </div>
        )}
      </div>
    </div>
  );
};
