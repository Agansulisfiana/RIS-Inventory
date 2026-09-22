export type UserRole = 'admin' | 'staff' | 'owner' | 'sales' | 'technician' | 'operator' | 'system';

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  password?: string;
  department?: string;
  lastLogin?: string;
  createdAt?: string;
  active?: boolean;
}

export type StockLocationStatus = 'tersedia' | 'in_warehouse' | 'on_demo' | 'demo_loaned' | 'service' | 'rusak' | 'hilang' | 'terjual' | 'lainnya' | 'maintenance' | 'broken' | 'repair';
export type ItemCondition = 'baru' | 'bagus' | 'perlu_servis' | 'rusak';

export interface DemoLoanInfo {
  quantity?: number;
  borrowerName: string;
  customerName?: string;
  companyName?: string;
  borrowerContact: string;
  borrowerDepartment?: string;
  contactEmail?: string;
  requestFrom?: string;
  productName?: string;
  productCode?: string;
  serialNumber?: string;
  serialNumbers?: string[];
  accessoriesNotes?: string;
  loanPeriod?: string;
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  purpose: string;
  notes: string;
  active: boolean;
  loanedBy: string;
  handedOverBy?: string;
  handedOverRole?: string;
  picReceiver?: string;
  documentNumber?: string;
  outgoingDocumentNumber?: string;
  signatureUrl?: string;
  damageNotes?: string;
  inspectionPhotos?: string[];
}

export type SnTrackingType = 'unique_per_unit' | 'shared_batch' | 'no_sn';

export interface InventoryItem {
  id: string;
  sku: string;
  serialNumber: string;
  snTrackingType?: SnTrackingType;
  serialNumbers?: string[];
  batchNumber?: string;
  barcode: string;
  name: string;
  category: string; // 'Card Printer', 'Consumables & Ribbon', 'PVC Blank & Smart Card', 'Cleaning Kit', 'Spare Part & Print Head', 'Lamination Film'
  brand: string;
  assetCode?: string;
  quantity: number;
  minStock: number;
  unit: string; // 'Unit', 'Pcs', 'Box', 'Roll', 'Set', 'Pack'
  price: number; // Nilai Aset / Harga Satuan IDR
  costPrice?: number; // Harga Modal / Beli
  sellPrice?: number; // Harga Jual Customer
  location: string; // e.g. "Gudang Jakarta - Rak A01"
  warehouseName?: string;
  warehouseStocks?: Record<string, number>;
  status: StockLocationStatus;
  condition: ItemCondition;
  pic?: string;
  notes: string;
  demoLoanInfo?: DemoLoanInfo;
  imageUrl?: string;
  documents?: { name: string; url: string; date: string }[];
  serviceHistory?: { date: string; action: string; technician: string; notes: string }[];
  lastUpdated: string;
  updatedBy: string;
  // Compatibility: optional alias
  unitPrice?: number;
}

// Per-warehouse stock map: key is warehouse name, value is quantity in that warehouse
export interface WarehouseStockMap {
  [warehouseName: string]: number;
}

export type StockMovementType = 
  | 'Penjualan'
  | 'Pembelian'
  | 'Masuk'
  | 'Keluar'
  | 'Retur'
  | 'Transfer'
  | 'Demo Out'
  | 'Demo In'
  | 'Service In'
  | 'Service Out'
  | 'Goods Receipt'
  | 'Opname Adjustment'
  // Compatibility: alternate casing / english variants seen in code
  | 'INBOUND'
  | 'OUTBOUND'
  | 'DEMO_LOAN'
  | 'DEMO_RETURN'
  | 'inbound'
  | 'outbound'
  | 'demo_loan'
  | 'demo_return';

export interface StockTransaction {
  id: string;
  transactionNumber: string; // e.g. SO-2024-00088, GR-2024-00057, DO-2024-00045, DI-2024-00032, TR-2024-00112, SV-2024-00021
  timestamp: string;
  type: StockMovementType;
  itemId: string;
  itemSku: string;
  serialNumber?: string;
  itemName: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  pic: string;
  status: 'Selesai' | 'On Demo' | 'Proses' | 'Pending' | 'Dikirim';
  notes?: string;
  documentUrl?: string;
  signatureUrl?: string;
  customer?: string;
  supplier?: string;
  totalPrice?: number;
  // Compatibility fields used in UI filters/search
  referenceNumber?: string;
  partnerOrBorrower?: string;
  performedBy?: string;
  performedByRole?: string;
  unit?: string;
}

// Sales Order (Penjualan & DO Keluar)
export interface SalesOrderItem {
  itemId: string;
  name: string;
  sku: string;
  serialNumber?: string;
  serialNumbers?: string[];
  snTrackingType?: SnTrackingType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sourceWarehouse?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. INV-2024-00102 / DO-2024-00088
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  orderDate: string;
  deliveryDate?: string;
  salesPic: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'Lunas' | 'Belum Lunas' | 'DP / Tempo';
  deliveryStatus: 'Terkirim' | 'Dalam Pengiriman' | 'Menunggu Kurir' | 'Draft';
  notes?: string;
}

// Goods Receipt (Penerimaan Barang Masuk Supplier)
export interface GoodsReceiptItem {
  itemId: string;
  name: string;
  sku: string;
  serialNumber?: string;
  serialNumbers?: string[];
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string; // e.g. GR-2024-00089
  poNumber?: string; // e.g. PO-RIS-2024-0044
  supplierName: string;
  receivedDate: string;
  warehouseLocation: string;
  receiverPic: string;
  items: GoodsReceiptItem[];
  totalValue: number;
  status: 'Selesai' | 'Parsial' | 'Draft';
  notes?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string; // e.g. SV-2024-00021
  itemId: string;
  itemName: string;
  serialNumber: string;
  customerName?: string;
  problem: string;
  diagnosis?: string;
  technician: string;
  entryDate: string;
  estimatedCompletion: string;
  completionDate?: string;
  status: 'Proses' | 'Selesai' | 'Menunggu Spare Part' | 'Dibatalkan';
  spareParts?: { name: string; qty: number; cost: number }[];
  costTotal?: number;
  notes?: string;
  imageUrl?: string;
  documents?: { name: string; date: string }[];
}

export interface StockOpnameSession {
  id: string;
  soNumber: string; // e.g. SO-2024-00012
  warehouse: string;
  location: string;
  date: string;
  status: 'Dalam Proses' | 'Selesai' | 'Draft';
  pic: string;
  notes?: string;
  items: {
    itemId: string;
    productName: string;
    serialNumber?: string;
    systemQty: number;
    physicalQty: number;
    difference: number;
    condition: string;
    notes: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: UserRole;
  action: string;
  module?: string;
  details: string;
  category?: 'inventory' | 'sales' | 'purchasing' | 'auth' | 'transaction' | 'system' | 'demo' | 'service' | 'opname';
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'demo_overdue' | 'service_alert' | 'missing_unit' | 'sales' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  itemId?: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
}

export interface WarehouseSettings {
  companyName: string;
  warehouseName: string;
  address: string;
  phone: string;
  picName: string;
  currency: string;
  soundEnabled: boolean;
  autoBackupDaily: boolean;
  lastBackupDate?: string;
  defaultMinStock: number;
  warehouseCapacityUnits: number;
  warehouses: string[];
  categories: string[];
  rackLocations: string[];
  // Optional compatibility fields used in some settings UI
  email?: string;
  lowStockThresholdDefault?: number;
  demoLoanDurationDays?: number;
  enableSoundEffects?: boolean;
  /**
   * Optional admin PIN for protected actions (stored in plain text for simplicity).
   * In production this should be hashed and secured.
   */
  adminPin?: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  itemCount: number;
  transactionCount: number;
  sizeBytes: number;
  dataJson: string;
  // compatibility aliases
  itemsCount?: number;
  transactionsCount?: number;
}

export type NavTab = 
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'sales_orders'
  | 'goods_receipt'
  | 'detail_unit'
  | 'demo_center'
  | 'demo_management'
  | 'request_demo'
  | 'checkout_demo'
  | 'checkin_demo'
  | 'service_maintenance'
  | 'service_ticket'
  | 'stock_opname'
  | 'transaksi'
  | 'stock_movement'
  | 'movement'
  | 'laporan'
  | 'reports'
  | 'pengaturan'
  | 'settings'
  | 'users';
