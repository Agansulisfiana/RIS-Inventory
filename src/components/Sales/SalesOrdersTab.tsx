import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Truck, 
  DollarSign, 
  User as UserIcon, 
  Calendar, 
  Trash2, 
  Printer, 
  Download,
  AlertCircle,
  Building,
  Package,
  X,
  Check,
  Tag,
  Layers,
  Hash,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { SalesOrder, InventoryItem, User, WarehouseSettings, SnTrackingType } from '../../types';
import { getInventoryStockState } from '../../utils/inventoryStock';
import { formatCurrency } from '../../utils/currency';
import { exportService } from '../../services/exportService';
import { RisLogo } from '../Common/RisLogo';
import { printHtmlDocument } from '../../utils/print';
import { 
  resolveSnTrackingType, 
  getAvailableItemSerialNumbers, 
  getRegisteredSerialNumbers, 
  normalizeSerialNumberList 
} from '../../utils/snManagement';

export interface SalesCartItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
  sourceWarehouse?: string;
  snTrackingType: SnTrackingType;
  serialNumbers: string[];
  serialNumber?: string;
}

interface SalesOrdersTabProps {
  salesOrders: SalesOrder[];
  items: InventoryItem[];
  currentUser: User;
  settings: WarehouseSettings;
  onCreateSalesOrder: (order: Omit<SalesOrder, 'id'>) => void;
  onUpdateSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
}

export const SalesOrdersTab: React.FC<SalesOrdersTabProps> = ({
  salesOrders,
  items,
  currentUser,
  settings,
  onCreateSalesOrder,
  onUpdateSalesOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<SalesOrder['deliveryStatus']>('Terkirim');

  // New Sales Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [salesPic, setSalesPic] = useState(currentUser?.name || '');
  const [paymentStatus, setPaymentStatus] = useState<SalesOrder['paymentStatus']>('Lunas');
  const [deliveryStatus, setDeliveryStatus] = useState<SalesOrder['deliveryStatus']>('Terkirim');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Cart items in form
  const [cart, setCart] = useState<SalesCartItem[]>([]);

  // Selected item to add to cart
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([]);
  const [customSnInput, setCustomSnInput] = useState('');

  // Currently selected item details
  const currentSelectedItem = items.find(i => i.id === selectedItemId) || null;
  const currentItemTrackingType: SnTrackingType = currentSelectedItem 
    ? resolveSnTrackingType(currentSelectedItem) 
    : 'no_sn';

  // Available stock SNs for currently selected item (excluding those already in cart)
  const availableStockSns = currentSelectedItem 
    ? getAvailableItemSerialNumbers(currentSelectedItem, items)
    : [];
  
  const alreadyChosenSnsInCart = cart
    .filter(c => c.itemId === selectedItemId)
    .flatMap(c => c.serialNumbers);

  const selectableAvailableSns = availableStockSns.filter(
    sn => !alreadyChosenSnsInCart.includes(sn)
  );

  // Handle product selection change
  const handleSelectProduct = (itemId: string) => {
    setSelectedItemId(itemId);
    setFormError(null);
    setCustomSnInput('');
    if (!itemId) {
      setAddQuantity(1);
      setSelectedSerialNumbers([]);
      return;
    }

    const it = items.find(i => i.id === itemId);
    if (!it) {
      setSelectedSerialNumbers([]);
      return;
    }

    const tracking = resolveSnTrackingType(it);
    setAddQuantity(1);

    if (tracking === 'unique_per_unit') {
      const avail = getAvailableItemSerialNumbers(it, items).filter(
        sn => !cart.filter(c => c.itemId === itemId).flatMap(c => c.serialNumbers).includes(sn)
      );
      setSelectedSerialNumbers(avail.length > 0 ? [avail[0]] : []);
    } else if (tracking === 'shared_batch') {
      const shared = it.batchNumber || it.serialNumber || 'LOT-SHARED';
      setSelectedSerialNumbers([shared]);
    } else {
      setSelectedSerialNumbers([]);
    }
  };

  // Handle quantity adjustment
  const handleUpdateAddQuantity = (newQty: number) => {
    const qty = Math.max(1, newQty);
    setAddQuantity(qty);

    if (currentItemTrackingType === 'unique_per_unit' && currentSelectedItem) {
      if (selectedSerialNumbers.length > qty) {
        setSelectedSerialNumbers(selectedSerialNumbers.slice(0, qty));
      } else if (selectedSerialNumbers.length < qty) {
        // Auto-fill remainder from selectable available SNs
        const currentSet = new Set(selectedSerialNumbers);
        const remainderCandidates = selectableAvailableSns.filter(sn => !currentSet.has(sn));
        const needed = qty - selectedSerialNumbers.length;
        const additional = remainderCandidates.slice(0, needed);
        setSelectedSerialNumbers([...selectedSerialNumbers, ...additional]);
      }
    }
  };

  // Toggle SN chip
  const handleToggleSnChip = (sn: string) => {
    if (selectedSerialNumbers.includes(sn)) {
      setSelectedSerialNumbers(selectedSerialNumbers.filter(s => s !== sn));
    } else {
      if (selectedSerialNumbers.length >= addQuantity) {
        // Replace the last one or append if within limit
        const updated = [...selectedSerialNumbers.slice(0, addQuantity - 1), sn];
        setSelectedSerialNumbers(updated);
      } else {
        setSelectedSerialNumbers([...selectedSerialNumbers, sn]);
      }
    }
  };

  // Auto pick available SNs
  const handleAutoPickSns = () => {
    const picked = selectableAvailableSns.slice(0, addQuantity);
    setSelectedSerialNumbers(picked);
  };

  // Add custom SN (e.g. from barcode scanner or manual keyboard)
  const handleAddCustomSn = () => {
    const trimmed = customSnInput.trim();
    if (!trimmed) return;
    if (selectedSerialNumbers.includes(trimmed)) {
      setCustomSnInput('');
      return;
    }
    if (alreadyChosenSnsInCart.includes(trimmed)) {
      alert(`Serial Number ${trimmed} sudah dimasukkan pada pesanan produk ini di keranjang.`);
      return;
    }
    if (selectedSerialNumbers.length >= addQuantity) {
      setSelectedSerialNumbers([...selectedSerialNumbers.slice(0, addQuantity - 1), trimmed]);
    } else {
      setSelectedSerialNumbers([...selectedSerialNumbers, trimmed]);
    }
    setCustomSnInput('');
  };

  // Filtered orders
  const filteredOrders = salesOrders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.salesPic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSalesRevenue = salesOrders.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const totalCompletedOrders = salesOrders.filter(o => o.deliveryStatus === 'Terkirim').length;

  const handleAddItemToCart = () => {
    if (!selectedItemId) return;
    const foundItem = items.find(i => i.id === selectedItemId);
    if (!foundItem) return;

    // choose default warehouse
    const whEntries = Object.entries(foundItem.warehouseStocks || {});
    const preferred = whEntries.find(([wh, q]) => Number(q || 0) >= addQuantity);
    const defaultWarehouse = preferred ? preferred[0] : (whEntries[0] ? whEntries[0][0] : (foundItem.warehouseName || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta'));
    const availableInDefault = Number((foundItem.warehouseStocks && foundItem.warehouseStocks[defaultWarehouse]) || 0);

    const totalAvailable = Object.values(foundItem.warehouseStocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    const existingInCartQty = cart.filter(c => c.itemId === selectedItemId).reduce((s, c) => s + c.quantity, 0);

    if (existingInCartQty + addQuantity > totalAvailable) {
      setFormError(`Stok tidak mencukupi! Total stok tersedia di gudang: ${foundItem.quantity} ${foundItem.unit}. Sudah di keranjang: ${existingInCartQty} unit.`);
      return;
    }

    const tracking = resolveSnTrackingType(foundItem);
    let finalSns: string[] = [];

    if (tracking === 'unique_per_unit') {
      // Validate SN selection
      if (selectedSerialNumbers.length < addQuantity) {
        setFormError(`Produk ini bertipe SN Per Unit. Anda harus memilih atau menginput tepat ${addQuantity} Serial Number (saat ini terpilih: ${selectedSerialNumbers.length}).`);
        return;
      }
      finalSns = selectedSerialNumbers.slice(0, addQuantity);
    } else if (tracking === 'shared_batch') {
      const sharedSn = foundItem.batchNumber || foundItem.serialNumber || 'LOT-SHARED';
      finalSns = [sharedSn];
    } else {
      finalSns = [];
    }

    const unitPrice = foundItem.sellPrice || foundItem.price;

    setCart([
      ...cart,
      {
        itemId: foundItem.id,
        name: foundItem.name,
        sku: foundItem.sku,
        quantity: addQuantity,
        unitPrice,
        totalPrice: addQuantity * unitPrice,
        availableStock: availableInDefault,
        sourceWarehouse: defaultWarehouse,
        snTrackingType: tracking,
        serialNumbers: finalSns,
        serialNumber: finalSns[0] || '-'
      }
    ]);

    // Reset picker
    setSelectedItemId('');
    setAddQuantity(1);
    setSelectedSerialNumbers([]);
    setCustomSnInput('');
    setFormError(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Nama customer / instansi wajib diisi!');
      return;
    }
    if (cart.length === 0) {
      setFormError('Pilih minimal 1 produk untuk dijual!');
      return;
    }

    // Validate that all items in cart have compliant SNs
    for (const item of cart) {
      if (item.snTrackingType === 'unique_per_unit') {
        if (!item.serialNumbers || item.serialNumbers.length !== item.quantity) {
          setFormError(`Serial number untuk produk "${item.name}" belum lengkap (${item.serialNumbers?.length || 0} dari ${item.quantity} unit).`);
          return;
        }
      }
    }

    const orderNumber = `DO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    onCreateSalesOrder({
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      orderDate: new Date(orderDate).toISOString(),
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : new Date().toISOString(),
      salesPic: salesPic || currentUser?.name || 'Sales Staff',
      items: cart.map(c => ({
        itemId: c.itemId,
        name: c.name,
        sku: c.sku,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        totalPrice: c.totalPrice,
        sourceWarehouse: c.sourceWarehouse,
        snTrackingType: c.snTrackingType,
        serialNumbers: c.serialNumbers,
        serialNumber: c.serialNumbers[0] || c.serialNumber || '-'
      })),
      subtotal,
      tax: 0,
      discount,
      grandTotal,
      paymentStatus,
      deliveryStatus,
      notes: notes.trim()
    });

    // Reset & Close
    setIsModalOpen(false);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDiscount(0);
    setNotes('');
    setFormError(null);
  };

  const handlePrintDeliveryOrder = (order: SalesOrder) => {
    const rows = order.items.map((item) => {
      const snList = (item.serialNumbers && item.serialNumbers.length > 0)
        ? item.serialNumbers
        : (item.serialNumber ? [item.serialNumber] : []);
      const snText = snList.length > 0
        ? `<div style="font-size: 10px; font-family: monospace; color: #4338ca; margin-top: 3px;">
             <strong>S/N:</strong> ${snList.join(', ')}
           </div>`
        : '';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
            <div style="font-size: 10px; color: #64748b;">SKU: ${item.sku}</div>
            ${snText}
          </td>
          <td style="text-align:center; font-weight: 700;">${item.quantity}</td>
          <td style="text-align:right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align:right; font-weight:700; color:#047857;">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div class="doc" style="font-family: 'Segoe UI', 'Inter', Arial, sans-serif;">
        <div class="meta" style="font-family: 'Segoe UI', 'Inter', Arial, sans-serif;">
          <div>
            <div class="brand" style="font-size: 17px; font-weight: 800; letter-spacing: -0.03em; color: #0f172a;">${settings.companyName}</div>
            <div class="muted" style="font-size: 11px; line-height: 1.5;">${settings.address}</div>
            <div class="muted" style="font-size: 11px; line-height: 1.5;">Telp: ${settings.phone}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size: 14px; color: #1d4ed8; font-weight: 900; letter-spacing: 0.04em;">${order.orderNumber}</div>
            <div class="muted" style="font-size: 11px;">Tanggal: ${new Date(order.orderDate).toLocaleDateString('id-ID')}</div>
            <div class="muted" style="font-size: 11px;">Sales PIC: ${order.salesPic}</div>
          </div>
        </div>

        <div style="margin-bottom: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 9px; letter-spacing: 0.12em; color: #64748b; text-transform: uppercase; font-weight: 700;">Tujuan Pengiriman / Customer</div>
          <div style="font-size: 14px; font-weight: 800; margin-top: 4px; color: #111827;">${order.customerName}</div>
          <div class="muted" style="font-size: 11px; line-height: 1.6;">${order.customerAddress || '-'}</div>
          <div class="muted" style="font-size: 11px; line-height: 1.6;">Kontak: ${order.customerPhone || '-'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk & Serial Number</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Harga Satuan</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
          ${order.discount > 0 ? `<div class="total-row" style="color:#dc2626;"><span>Diskon</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
          <div class="total-row" style="padding-top: 8px; border-top: 1px solid #e5e7eb; margin-top: 6px;"><strong>Grand Total</strong><strong style="color:#047857;">${formatCurrency(order.grandTotal)}</strong></div>
        </div>

        ${order.notes ? `<div class="note" style="font-size: 11px; line-height: 1.5; margin-top: 12px;"><strong>Catatan:</strong> ${order.notes}</div>` : ''}

        <div style="display:flex; justify-content:space-between; gap:20px; margin-top: 26px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
          <div style="flex:1; text-align:center; color:#475569;">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px;">Yang Menyerahkan / Gudang</div>
            <div style="border-top:1px solid #cbd5e1; display:inline-block; min-width: 160px; padding-top: 8px; font-weight: 700; color: #0f172a; font-size: 11px;">${settings.companyName}</div>
          </div>
          <div style="flex:1; text-align:center; color:#475569;">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px;">Penerima / Customer</div>
            <div style="border-top:1px solid #cbd5e1; display:inline-block; min-width: 160px; padding-top: 8px; font-weight: 700; color: #0f172a; font-size: 11px;">${order.customerName}</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument('Surat Jalan DO', html);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>TRANSAKSI PENJUALAN & PENGIRIMAN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
            SALES ORDER & DELIVERY ORDER (DO)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Catat invoice penjualan customer, kurangi stok otomatis, dan cetak surat jalan DO
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Penjualan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Omset Penjualan</span>
          <div className="text-2xl font-black font-heading text-emerald-600">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Dari {salesOrders.length} transaksi tercatat</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pengiriman Sukses</span>
          <div className="text-2xl font-black font-heading text-blue-600">
            {totalCompletedOrders} Order Selesai
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Surat jalan DO terkonfirmasi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Pembayaran</span>
          <div className="text-2xl font-black font-heading text-slate-900">
            {salesOrders.filter(o => o.paymentStatus === 'Lunas').length} Lunas
          </div>
          <div className="text-[11px] text-amber-600 font-bold">
            {salesOrders.filter(o => o.paymentStatus !== 'Lunas').length} Pending / DP Tempo
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor invoice / DO, nama customer, sales PIC, atau item barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Invoice & Tanggal</th>
                <th className="py-3.5 px-4">Customer & PIC</th>
                <th className="py-3.5 px-4">Item Pesanan</th>
                <th className="py-3.5 px-4">Total Nilai (IDR)</th>
                <th className="py-3.5 px-4">Status Bayar</th>
                <th className="py-3.5 px-4">Status Pengiriman</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Invoice Number & Date */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-blue-700 text-xs">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Sales: {order.salesPic}</div>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1.5">
                      {order.items.map((it, idx) => {
                        const snList = (it.serialNumbers && it.serialNumbers.length > 0)
                          ? it.serialNumbers
                          : (it.serialNumber && it.serialNumber !== '-' ? [it.serialNumber] : []);

                        return (
                          <div key={idx} className="text-[11px] space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {it.quantity}x
                              </span>
                              <span className="truncate max-w-[200px] font-semibold text-slate-800">{it.name}</span>
                            </div>
                            {snList.length > 0 && (
                              <div className="pl-6 flex flex-wrap items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">SN:</span>
                                {snList.slice(0, 2).map((sn, sIdx) => (
                                  <span key={sIdx} className="font-mono text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                    {sn}
                                  </span>
                                ))}
                                {snList.length > 2 && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                    +{snList.length - 2} lagi
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Grand Total */}
                  <td className="py-3.5 px-4">
                    <div className="font-black text-emerald-700 text-xs">
                      {formatCurrency(order.grandTotal)}
                    </div>
                    {order.discount > 0 && (
                      <div className="text-[10px] text-rose-500">Diskon: -{formatCurrency(order.discount)}</div>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      order.paymentStatus === 'Lunas'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>

                  {/* Delivery Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                      order.deliveryStatus === 'Terkirim'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      <Truck className="w-3 h-3" />
                      <span>{order.deliveryStatus}</span>
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedOrderStatus(order.deliveryStatus);
                          setSelectedOrderForDetail(order);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Detail DO
                      </button>
                      <button
                        onClick={() => handlePrintDeliveryOrder(order)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Cetak DO
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Order / Print Preview */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">SURAT JALAN & INVOICE PENJUALAN</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <RisLogo size={44} />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{settings.companyName}</div>
                    <div className="text-slate-500">{settings.address}</div>
                    <div className="text-slate-500">Telp: {settings.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-blue-600 text-base">{selectedOrderForDetail.orderNumber}</div>
                  <div className="text-slate-500">Tanggal: {new Date(selectedOrderForDetail.orderDate).toLocaleDateString('id-ID')}</div>
                  <div className="text-slate-500">Sales PIC: {selectedOrderForDetail.salesPic}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tujuan Pengiriman / Customer:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrderForDetail.customerName}</div>
                <div className="text-slate-600">{selectedOrderForDetail.customerAddress || '-'}</div>
                <div className="text-slate-600">Kontak: {selectedOrderForDetail.customerPhone || '-'}</div>
              </div>

              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">Produk & Serial Number</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Harga Satuan</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrderForDetail.items.map((item, idx) => {
                    const snList = (item.serialNumbers && item.serialNumbers.length > 0)
                      ? item.serialNumbers
                      : (item.serialNumber && item.serialNumber !== '-' ? [item.serialNumber] : []);

                    return (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                          {snList.length > 0 && (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">S/N:</span>
                              {snList.map((sn, sIdx) => (
                                <span key={sIdx} className="font-mono text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                  {sn}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrderForDetail.subtotal)}</span>
                  </div>
                  {selectedOrderForDetail.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Diskon:</span>
                      <span>-{formatCurrency(selectedOrderForDetail.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-emerald-700">{formatCurrency(selectedOrderForDetail.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pengiriman</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{selectedOrderForDetail.deliveryStatus}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOrderStatus}
                      onChange={(e) => setSelectedOrderStatus(e.target.value as SalesOrder['deliveryStatus'])}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Terkirim">Terkirim</option>
                      <option value="Dalam Pengiriman">Dalam Pengiriman</option>
                      <option value="Menunggu Kurir">Menunggu Kurir</option>
                      <option value="Draft">Draft</option>
                    </select>
                    <button
                      onClick={() => {
                        onUpdateSalesOrder(selectedOrderForDetail.id, { deliveryStatus: selectedOrderStatus });
                        setSelectedOrderForDetail({ ...selectedOrderForDetail, deliveryStatus: selectedOrderStatus });
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>

              {selectedOrderForDetail.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                  <span className="font-bold text-slate-800">Catatan: </span>
                  {selectedOrderForDetail.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => handlePrintDeliveryOrder(selectedOrderForDetail)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat Jalan (DO)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Penjualan Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">BUAT PENJUALAN & DO KELUAR</h3>
                  <p className="text-xs text-slate-500 font-medium">Kurangi stok inventory dan terbitkan delivery order</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Form Error Banner */}
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Perhatian: Validasi Penjualan</div>
                    <div className="mt-0.5 text-rose-700">{formError}</div>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Customer / Perusahaan <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Bank Mandiri (Persero) Tbk"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Kontak / Telepon</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Alamat Pengiriman</label>
                  <input
                    type="text"
                    placeholder="Gedung / Jalan / Kota"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Picker */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Pilih Produk & Serial Number dari Stok Gudang</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Produk Ready Stock --</option>
                      {items.filter(i => getInventoryStockState(i).readyQuantity > 0).map(item => {
                        const st = getInventoryStockState(item);
                        return (
                          <option key={item.id} value={item.id}>
                            {item.name} (Sisa Ready: {st.readyQuantity} {item.unit} | {formatCurrency(item.sellPrice || item.price)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => handleUpdateAddQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-center font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemToCart}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    + Masukkan Keranjang
                  </button>
                </div>

                {/* Dynamic SN Selection Interface if item selected */}
                {currentSelectedItem && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    {currentItemTrackingType === 'unique_per_unit' && (
                      <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md font-bold text-[10px] flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>SN Per Barang (Unik per Unit)</span>
                            </span>
                            <span className="text-slate-600 text-[11px] font-medium">
                              Wajib memilih {addQuantity} Serial Number spesifik untuk checkout
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              selectedSerialNumbers.length === addQuantity
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              Terpilih: {selectedSerialNumbers.length} / {addQuantity} SN
                            </span>
                            {selectableAvailableSns.length > 0 && (
                              <button
                                type="button"
                                onClick={handleAutoPickSns}
                                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Pilih Otomatis {addQuantity} SN</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Available Stock SN Chips */}
                        {selectableAvailableSns.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Klik Nomor Seri di Bawah untuk Memilih:</span>
                              <span className="text-purple-700 font-semibold">{selectableAvailableSns.length} SN siap jual di gudang</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-white rounded-xl border border-purple-200 shadow-inner">
                              {selectableAvailableSns.map((sn) => {
                                const isSelected = selectedSerialNumbers.includes(sn);
                                return (
                                  <button
                                    key={sn}
                                    type="button"
                                    onClick={() => handleToggleSnChip(sn)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      isSelected 
                                        ? 'bg-purple-600 text-white shadow-xs scale-102 ring-1 ring-purple-600' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3" />}
                                    <span>{sn}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                            Semua serial number terdaftar untuk produk ini telah dipilih. Anda dapat memasukkan serial number manual di bawah jika ada stok baru.
                          </div>
                        )}

                        {/* Manual / Barcode Scan Input */}
                        <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                          <div className="relative flex-1">
                            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Ketik manual atau scan barcode SN tambahan..."
                              value={customSnInput}
                              onChange={(e) => setCustomSnInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSn();
                                }
                              }}
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustomSn}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            + Tambah SN
                          </button>
                        </div>

                        {/* Selected SNs list */}
                        {selectedSerialNumbers.length > 0 && (
                          <div className="pt-2 border-t border-purple-100">
                            <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                              Serial Number Terpilih ({selectedSerialNumbers.length} unit):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSerialNumbers.map((sn, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-purple-300 text-purple-900 font-mono text-[11px] font-bold shadow-2xs"
                                >
                                  <span className="text-[9px] text-purple-500 font-sans">#{idx + 1}</span>
                                  <span>{sn}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSerialNumbers(selectedSerialNumbers.filter((_, i) => i !== idx))}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentItemTrackingType === 'shared_batch' && (
                      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-blue-900 text-xs">1 Serial Number / Batch Digunakan di Semua Produk</div>
                            <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                              Produk consumables/bahan: Semua {addQuantity} {currentSelectedItem.unit || 'unit'} menggunakan nomor batch/lot yang sama secara otomatis.
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-black text-blue-800 bg-white border border-blue-300 px-3 py-1 rounded-lg shadow-2xs">
                            LOT: {currentSelectedItem.batchNumber || currentSelectedItem.serialNumber || 'LOT-SHARED'}
                          </span>
                        </div>
                      </div>
                    )}

                    {currentItemTrackingType === 'no_sn' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600 text-xs font-medium">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Produk Non-SN (Tidak memerlukan pelacakan nomor seri per unit)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Table */}
                {cart.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">Produk & Serial Number</th>
                          <th className="p-2.5 text-center">Gudang</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Harga Jual</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                          <th className="p-2.5 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cart.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SKU: {c.sku}</div>

                              {/* SN Info in Cart */}
                              {c.snTrackingType === 'unique_per_unit' && (
                                <div className="mt-1 space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-bold border border-purple-200">
                                      SN Per Unit ({c.serialNumbers.length}/{c.quantity})
                                    </span>
                                    {c.serialNumbers.length < c.quantity && (
                                      <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5">
                                        <AlertTriangle className="w-3 h-3" /> Kurang {c.quantity - c.serialNumbers.length} SN
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-w-sm">
                                    {c.serialNumbers.map((sn, sIdx) => (
                                      <span key={sIdx} className="font-mono text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                        {sn}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {c.snTrackingType === 'shared_batch' && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
                                    1 SN Bersama
                                  </span>
                                  <span className="font-mono text-[9px] font-bold text-blue-800 bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                                    {c.serialNumber || c.serialNumbers[0]}
                                  </span>
                                </div>
                              )}

                              {c.snTrackingType === 'no_sn' && (
                                <div className="mt-1 text-[10px] text-slate-400">Non-SN</div>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <select
                                value={c.sourceWarehouse}
                                onChange={(e) => {
                                  const updated = [...cart];
                                  updated[idx].sourceWarehouse = e.target.value;
                                  const foundIt = items.find(i => i.id === c.itemId);
                                  updated[idx].availableStock = foundIt ? Number(foundIt.warehouseStocks?.[e.target.value] || 0) : updated[idx].availableStock;
                                  setCart(updated);
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                              >
                                {(() => {
                                  const foundIt = items.find(i => i.id === c.itemId);
                                  const whs = foundIt ? Object.keys(foundIt.warehouseStocks || {}) : (settings.warehouses || []);
                                  return whs.map(wh => <option key={wh} value={wh}>{wh.split(' - ')[0] || wh}</option>);
                                })()}
                              </select>
                              <div className="text-[10px] text-slate-400 mt-1">Avail: {c.availableStock}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold">{c.quantity}</td>
                            <td className="p-2.5 text-right">{formatCurrency(c.unitPrice)}</td>
                            <td className="p-2.5 text-right font-black text-emerald-700">{formatCurrency(c.totalPrice)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(idx)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <div className="text-slate-600">Diskon Potongan (IDR):</div>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-40 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-rose-600 focus:outline-none"
                  />
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-medium">Total Tagihan:</div>
                  <div className="text-2xl font-black text-emerald-700">{formatCurrency(grandTotal)}</div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Lunas">Lunas (Cash / Transfer)</option>
                    <option value="DP / Tempo">DP / Tempo (30 Hari)</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Pengiriman</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Terkirim">Terkirim (Barang Diterima)</option>
                    <option value="Dalam Pengiriman">Dalam Pengiriman Kurir</option>
                    <option value="Menunggu Kurir">Menunggu Kurir Pick-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan nomor PO customer, instruksi kurir..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Terbitkan DO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
