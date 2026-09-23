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
    const readyStock = getInventoryStockState(it).readyQuantity;
    const inCartQty = cart.filter(c => c.itemId === it.id).reduce((s, c) => s + c.quantity, 0);
    const maxAddable = Math.max(0, readyStock - inCartQty);

    if (maxAddable <= 0) {
      setAddQuantity(0);
      setFormError(`Stok ready untuk produk "${it.name}" sudah habis atau semua sisa stok sudah dimasukkan ke keranjang.`);
    } else {
      setAddQuantity(1);
    }

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

  // Handle quantity adjustment with strict clamp to ready stock
  const handleUpdateAddQuantity = (newQty: number) => {
    if (!currentSelectedItem) {
      setAddQuantity(Math.max(1, newQty));
      return;
    }

    const readyStock = getInventoryStockState(currentSelectedItem).readyQuantity;
    const inCartQty = cart.filter(c => c.itemId === currentSelectedItem.id).reduce((s, c) => s + c.quantity, 0);
    const maxAddable = Math.max(0, readyStock - inCartQty);

    if (maxAddable <= 0) {
      setAddQuantity(0);
      setFormError(`Seluruh stok ready (${readyStock} ${currentSelectedItem.unit}) untuk produk ini sudah dimasukkan ke keranjang!`);
      return;
    }

    const clampedQty = Math.max(1, Math.min(newQty, maxAddable));
    setAddQuantity(clampedQty);

    if (newQty > maxAddable) {
      setFormError(`Kuantitas tidak bisa melebihi stok yang ready! Maksimal bisa diinput: ${maxAddable} ${currentSelectedItem.unit}.`);
    } else {
      setFormError(null);
    }

    if (currentItemTrackingType === 'unique_per_unit' && currentSelectedItem) {
      if (selectedSerialNumbers.length > clampedQty) {
        setSelectedSerialNumbers(selectedSerialNumbers.slice(0, clampedQty));
      } else if (selectedSerialNumbers.length < clampedQty) {
        // Auto-fill remainder from selectable available SNs
        const currentSet = new Set(selectedSerialNumbers);
        const remainderCandidates = selectableAvailableSns.filter(sn => !currentSet.has(sn));
        const needed = clampedQty - selectedSerialNumbers.length;
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

    // Strict ready stock verification
    const stockState = getInventoryStockState(foundItem);
    const readyStock = stockState.readyQuantity;
    const existingInCartQty = cart.filter(c => c.itemId === selectedItemId).reduce((s, c) => s + c.quantity, 0);
    const maxAddable = Math.max(0, readyStock - existingInCartQty);

    if (maxAddable <= 0) {
      setFormError(`Stok ready tidak mencukupi! Seluruh stok ready (${readyStock} ${foundItem.unit}) sudah ada di dalam keranjang pesanan.`);
      return;
    }

    if (addQuantity <= 0) {
      setFormError('Kuantitas pesanan minimal 1 unit.');
      return;
    }

    if (addQuantity > maxAddable) {
      setFormError(`Kuantitas pesanan (${addQuantity} ${foundItem.unit}) melebihi stok yang ready/tersedia (${maxAddable} ${foundItem.unit}). Harap sesuaikan kuantitas.`);
      return;
    }

    // choose default warehouse
    const whEntries = Object.entries(foundItem.warehouseStocks || {});
    const preferred = whEntries.find(([wh, q]) => Number(q || 0) >= addQuantity);
    const defaultWarehouse = preferred ? preferred[0] : (whEntries[0] ? whEntries[0][0] : (foundItem.warehouseName || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta'));
    const availableInDefault = Number((foundItem.warehouseStocks && foundItem.warehouseStocks[defaultWarehouse]) ?? readyStock);

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

    // Validate that no item in cart exceeds current ready stock in database
    for (const item of cart) {
      const dbItem = items.find(i => i.id === item.itemId);
      if (!dbItem) {
        setFormError(`Produk "${item.name}" tidak ditemukan di database.`);
        return;
      }
      const readyQty = getInventoryStockState(dbItem).readyQuantity;
      if (item.quantity > readyQty) {
        setFormError(`Checkout DO Gagal! Kuantitas produk "${item.name}" (${item.quantity} ${dbItem.unit}) melebihi stok yang ready saat ini (${readyQty} ${dbItem.unit}). Harap sesuaikan kuantitas.`);
        return;
      }
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
    const formattedDate = new Date(order.orderDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rows = order.items.map((item, index) => {
      const snList = (item.serialNumbers && item.serialNumbers.length > 0)
        ? item.serialNumbers
        : (item.serialNumber && item.serialNumber !== '-' ? [item.serialNumber] : []);
      
      const snText = snList.length > 0
        ? `<div style="font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #3730a3; margin-top: 3px; background: #eef2ff; padding: 1.5px 5px; border-radius: 4px; display: inline-block; border: 1px solid #c7d2fe;">
             <strong>S/N:</strong> ${snList.join(', ')}
           </div>`
        : '';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="text-align: center; font-weight: 700; color: #64748b; font-size: 10px; padding: 6px 6px;">${index + 1}</td>
          <td style="padding: 6px 8px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 11.5px; line-height: 1.3;">${item.name}</div>
            <div style="font-size: 9.5px; font-family: 'JetBrains Mono', monospace; color: #64748b; margin-top: 1px;">SKU: ${item.sku}</div>
            ${snText}
          </td>
          <td style="text-align: center; font-weight: 800; color: #0f172a; font-size: 11.5px; padding: 6px 6px;">${item.quantity}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; color: #334155; font-size: 11px; padding: 6px 8px;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0f172a; font-size: 11.5px; padding: 6px 8px;">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
      
      <div class="doc" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 14px 18px; max-width: 780px; margin: 0 auto;">
        
        <!-- HEADER PERUSAHAAN & JUDUL DOKUMEN -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; gap: 16px;">
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.02em; color: #0f172a; text-transform: uppercase;">
              ${settings.companyName || 'PT. REYCOM INTEGRATED SOLUSI'}
            </div>
            <div style="font-size: 10px; color: #475569; line-height: 1.45; margin-top: 2px; max-width: 420px;">
              ${settings.address || 'Kawasan Niaga & Industri Pulogadung Blok B No. 12, Jakarta Timur'}
            </div>
            <div style="font-size: 10px; color: #475569; line-height: 1.45; margin-top: 1px;">
              <strong>Telp:</strong> ${settings.phone || '(021) 4682-9900 / 0812-3456-7890'}
            </div>
          </div>

          <div style="text-align: right; min-width: 190px;">
            <div style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 8.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; margin-bottom: 3px;">
              DOKUMEN PENGIRIMAN
            </div>
            <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.01em; color: #0f172a; text-transform: uppercase;">
              SURAT JALAN (DO)
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 800; color: #2563eb; margin-top: 1px;">
              ${order.orderNumber}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
              Tanggal: <strong style="color: #334155;">${formattedDate}</strong>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
              Sales PIC: <strong style="color: #334155;">${order.salesPic || '-'}</strong>
            </div>
          </div>
        </div>

        <!-- TUJUAN PENGIRIMAN / PENERIMA (CONSIGNEE) -->
        <div style="margin-bottom: 12px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; gap: 16px;">
          <div style="flex: 1;">
            <div style="font-size: 9px; letter-spacing: 0.08em; color: #64748b; text-transform: uppercase; font-weight: 800;">
              Tujuan Pengiriman / Penerima (Consignee):
            </div>
            <div style="font-size: 13.5px; font-weight: 900; margin-top: 2px; color: #0f172a;">
              ${order.customerName}
            </div>
            <div style="font-size: 10.5px; color: #334155; line-height: 1.45; margin-top: 1px;">
              ${order.customerAddress || '-'}
            </div>
            <div style="font-size: 10.5px; color: #475569; line-height: 1.45; margin-top: 1px;">
              <strong>Kontak / No. Telp:</strong> ${order.customerPhone || '-'}
            </div>
          </div>
          <div style="min-width: 150px; border-left: 1px dashed #cbd5e1; padding-left: 14px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 9px; letter-spacing: 0.06em; color: #64748b; text-transform: uppercase; font-weight: 800;">Status DO:</div>
            <div style="font-size: 11px; font-weight: 800; color: #059669; margin-top: 1px;">${order.deliveryStatus || 'Terkirim'}</div>
            <div style="font-size: 9px; letter-spacing: 0.06em; color: #64748b; text-transform: uppercase; font-weight: 800; margin-top: 4px;">Status Pembayaran:</div>
            <div style="font-size: 11px; font-weight: 800; color: #2563eb; margin-top: 1px;">${order.paymentStatus || 'Lunas'}</div>
          </div>
        </div>

        <!-- TABEL PRODUK & SERIAL NUMBER -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="width: 32px; text-align: center; padding: 6px 4px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">No.</th>
              <th style="padding: 6px 8px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Nama Produk & Serial Number</th>
              <th style="width: 50px; text-align: center; padding: 6px 4px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Qty</th>
              <th style="width: 110px; text-align: right; padding: 6px 8px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Harga Satuan</th>
              <th style="width: 120px; text-align: right; padding: 6px 8px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Total Harga</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <!-- TOTAL HARGA & CATATAN -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-top: 6px;">
          <div style="flex: 1;">
            ${order.notes ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
                <strong style="color: #0f172a;">Catatan:</strong> ${order.notes}
              </div>
            ` : ''}
            <div style="margin-top: 6px; font-size: 9.5px; color: #64748b; line-height: 1.35; font-style: italic;">
              * Harap periksa fisik & nomor seri (S/N) barang saat serah terima. Komplain wajib menyertakan Surat Jalan asli.
            </div>
          </div>

          <div style="width: 250px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px 12px;">
            <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569;">
              <span>Subtotal:</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${formatCurrency(order.subtotal)}</span>
            </div>
            ${order.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #dc2626;">
                <span>Diskon:</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">-${formatCurrency(order.discount)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 4px; margin-top: 3px; border-top: 1.5px solid #cbd5e1; font-size: 12.5px; color: #0f172a;">
              <strong style="font-weight: 900;">Grand Total:</strong>
              <strong style="font-family: 'JetBrains Mono', monospace; font-weight: 900; color: #047857;">${formatCurrency(order.grandTotal)}</strong>
            </div>
          </div>
        </div>

        <!-- SECTION TANDA TANGAN (TTD 3 KOLOM PROPORSIONAL & TIDAK TUMPAH KE HALAMAN 2) -->
        <div style="margin-top: 18px; padding-top: 10px; border-top: 1px solid #cbd5e1; page-break-inside: avoid;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
            
            <!-- Kolom 1: Yang Menyerahkan / Gudang -->
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #ffffff;">
              <div style="font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #0f172a;">
                YANG MENYERAHKAN
              </div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
                Bagian Gudang & Logistik
              </div>
              <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">
                <span style="font-size: 8px; color: #94a3b8; font-style: italic;">(Tanda Tangan & Cap)</span>
              </div>
              <div style="border-top: 1.5px solid #0f172a; padding-top: 3px; font-weight: 800; color: #0f172a; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${settings.companyName || 'PT. Reycom Integrated Solusi'}
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
                Tgl: _____ / _____ / 20___
              </div>
            </div>

            <!-- Kolom 2: Yang Membawa / Ekspedisi / Driver -->
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #ffffff;">
              <div style="font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #0f172a;">
                PENGEMUDI / KURIR
              </div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
                Ekspedisi / Pengantar
              </div>
              <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">
                <span style="font-size: 8px; color: #94a3b8; font-style: italic;">(Tanda Tangan Driver)</span>
              </div>
              <div style="border-top: 1.5px solid #0f172a; padding-top: 3px; font-weight: 700; color: #0f172a; font-size: 10.5px;">
                ( .................................................. )
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
                No. Pol / Resi: .....................
              </div>
            </div>

            <!-- Kolom 3: Diterima Oleh / Customer -->
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #ffffff;">
              <div style="font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #0f172a;">
                PENERIMA / CUSTOMER
              </div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
                Tanda Tangan & Cap PT
              </div>
              <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">
                <span style="font-size: 8px; color: #94a3b8; font-style: italic;">(Cap Stempel & TTD)</span>
              </div>
              <div style="border-top: 1.5px solid #0f172a; padding-top: 3px; font-weight: 800; color: #0f172a; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ( ${order.customerName} )
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
                Tgl Terima: _____ / _____ / 20___
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    printHtmlDocument(`Surat Jalan DO - ${order.orderNumber}`, html);
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
          <table className="w-full text-left text-xs min-w-[850px]">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-xl md:max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 overflow-hidden">
            
            {/* Header (shrink-0) */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">Detail Surat Jalan (DO)</h3>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium">
                    <span className="font-mono font-bold text-blue-600">{selectedOrderForDetail.orderNumber}</span>
                    <span>•</span>
                    <span>{new Date(selectedOrderForDetail.orderDate).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body (flex-1 overflow-y-auto) */}
            <div className="p-3.5 sm:p-5 space-y-3 text-xs flex-1 overflow-y-auto">
              
              {/* Customer Info Card */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row justify-between gap-2.5">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Tujuan Pengiriman / Customer:</div>
                  <div className="font-bold text-slate-900 text-sm truncate">{selectedOrderForDetail.customerName}</div>
                  <div className="text-slate-600 text-[11px] leading-snug">{selectedOrderForDetail.customerAddress || '-'}</div>
                  <div className="text-slate-500 text-[11px]">Kontak: {selectedOrderForDetail.customerPhone || '-'}</div>
                </div>
                <div className="sm:text-right shrink-0 space-y-1">
                  <div className="text-[10px] text-slate-500">Sales PIC: <strong className="text-slate-800">{selectedOrderForDetail.salesPic}</strong></div>
                  <div className="flex items-center sm:justify-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                      selectedOrderForDetail.paymentStatus === 'Lunas'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedOrderForDetail.paymentStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                      {selectedOrderForDetail.deliveryStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-44 overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[460px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Produk & Serial Number</th>
                        <th className="p-2.5 text-center w-12">Qty</th>
                        <th className="p-2.5 text-right w-24">Harga Satuan</th>
                        <th className="p-2.5 text-right w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedOrderForDetail.items.map((item, idx) => {
                        const snList = (item.serialNumbers && item.serialNumbers.length > 0)
                          ? item.serialNumbers
                          : (item.serialNumber && item.serialNumber !== '-' ? [item.serialNumber] : []);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800 leading-snug">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                              {snList.length > 0 && (
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">S/N:</span>
                                  {snList.map((sn, sIdx) => (
                                    <span key={sIdx} className="font-mono text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono text-[11px] text-slate-600">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-mono text-[11px] font-bold text-emerald-700">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Status Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Status DO:</span>
                  <select
                    value={selectedOrderStatus}
                    onChange={(e) => setSelectedOrderStatus(e.target.value as SalesOrder['deliveryStatus'])}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial"
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
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Simpan
                  </button>
                </div>

                <div className="w-full sm:w-56 space-y-0.5 text-right text-xs">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedOrderForDetail.subtotal)}</span>
                  </div>
                  {selectedOrderForDetail.discount > 0 && (
                    <div className="flex justify-between text-rose-600 text-[11px] font-bold">
                      <span>Diskon:</span>
                      <span className="font-mono">-{formatCurrency(selectedOrderForDetail.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black text-xs pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(selectedOrderForDetail.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {selectedOrderForDetail.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                  <strong className="text-slate-800">Catatan: </strong>
                  {selectedOrderForDetail.notes}
                </div>
              )}

              {/* Info TTD 3 Kolom Otomatis */}
              <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium truncate">
                    Format TTD 3 Pihak (Gudang, Driver, & Customer) otomatis tercetak rapi di lembar DO A4.
                  </span>
                </div>
                <span className="text-[9.5px] font-bold bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs ml-2">
                  Format Pas A4
                </span>
              </div>
            </div>

            {/* Sticky Footer (shrink-0, selalu terlihat dan mudah diklik) */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => handlePrintDeliveryOrder(selectedOrderForDetail)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
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

                {(() => {
                  const itemReady = currentSelectedItem ? getInventoryStockState(currentSelectedItem).readyQuantity : 0;
                  const itemInCart = currentSelectedItem ? cart.filter(c => c.itemId === currentSelectedItem.id).reduce((s, c) => s + c.quantity, 0) : 0;
                  const maxAddable = Math.max(0, itemReady - itemInCart);
                  const isCartFull = Boolean(currentSelectedItem && maxAddable <= 0);

                  return (
                    <div className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full">
                          <select
                            value={selectedItemId}
                            onChange={(e) => handleSelectProduct(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
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

                        <div className="w-28 relative">
                          <input
                            type="number"
                            min={maxAddable > 0 ? 1 : 0}
                            max={maxAddable}
                            value={addQuantity}
                            disabled={!currentSelectedItem || isCartFull}
                            onChange={(e) => handleUpdateAddQuantity(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-center font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-50"
                            placeholder="Qty"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddItemToCart}
                          disabled={!currentSelectedItem || isCartFull || addQuantity <= 0 || addQuantity > maxAddable}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          + Masukkan Keranjang
                        </button>
                      </div>

                      {currentSelectedItem && (
                        <div className="flex items-center justify-between text-[11px] px-1">
                          <span className={isCartFull ? "text-rose-600 font-bold" : "text-slate-500"}>
                            {isCartFull 
                              ? `⚠️ Semua stok ready (${itemReady} ${currentSelectedItem.unit}) sudah ada di keranjang.` 
                              : `Stok Ready: ${itemReady} ${currentSelectedItem.unit} • Di Keranjang: ${itemInCart} • Maks. Bisa Ditambah: ${maxAddable} ${currentSelectedItem.unit}`}
                          </span>
                          {!isCartFull && maxAddable > 1 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAddQuantity(maxAddable)}
                              className="text-emerald-700 font-bold hover:underline cursor-pointer"
                            >
                              Pilih Maks ({maxAddable})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
