import {
  User,
  InventoryItem,
  StockTransaction,
  SalesOrder,
  GoodsReceipt,
  ServiceTicket,
  StockOpnameSession,
  AuditLog,
  AppNotification,
  WarehouseSettings,
  BackupSnapshot,
  StockLocationStatus,
  ItemCondition,
  DemoLoanInfo
} from '../types';
import { warehouseAudio } from '../utils/audio';
import { getPermissions } from '../utils/permissions';

const STORAGE_KEYS = {
  USERS: 'invtrack_users_v3',
  CURRENT_USER: 'invtrack_current_user_v3',
  INVENTORY: 'invtrack_inventory_v3',
  TRANSACTIONS: 'invtrack_transactions_v3',
  SALES_ORDERS: 'invtrack_sales_orders_v3',
  GOODS_RECEIPTS: 'invtrack_goods_receipts_v3',
  SERVICE_TICKETS: 'invtrack_service_tickets_v3',
  STOCK_OPNAME: 'invtrack_stock_opname_v3',
  AUDIT_LOGS: 'invtrack_audit_logs_v3',
  NOTIFICATIONS: 'invtrack_notifications_v3',
  SETTINGS: 'invtrack_settings_v3',
  BACKUPS: 'invtrack_backups_v3',
};

// Initial Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Budi Santoso',
    username: 'admin',
    email: 'admin@reycom.co.id',
    role: 'admin',
    department: 'Warehouse & Logistics Manager',
    phone: '0812-3456-7890',
    password: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-10T08:00:00.000Z',
    active: true
  },
  {
    id: 'usr-sales-1',
    name: 'Doni Pratama',
    username: 'sales',
    email: 'doni.sales@reycom.co.id',
    role: 'sales',
    department: 'Sales & Account Executive',
    phone: '0813-9988-1122',
    password: 'sales',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-01T09:00:00.000Z',
    active: true
  },
  {
    id: 'usr-staff-1',
    name: 'Siti Aminah',
    username: 'operator',
    email: 'siti.logistik@reycom.co.id',
    role: 'operator',
    department: 'Operasional Gudang & Inventory',
    phone: '0813-9876-5432',
    password: 'operator',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-01T09:00:00.000Z',
    active: true
  },
  {
    id: 'usr-tech-1',
    name: 'Andi Setiawan',
    username: 'teknisi',
    email: 'andi.tech@reycom.co.id',
    role: 'technician',
    department: 'Technical Support & Workshop',
    phone: '0813-5566-7788',
    password: 'teknisi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-02-15T09:00:00.000Z',
    active: true
  }
];

const INITIAL_SETTINGS: WarehouseSettings = {
  companyName: 'PT. Reycom Integrated Solusi',
  warehouseName: 'Gudang Utama Jakarta',
  address: 'Kawasan Niaga & Industri Pulogadung Blok B No. 12, Jakarta Timur',
  phone: '(021) 4682-9900 / 0812-3456-7890',
  picName: 'Budi Santoso',
  currency: 'IDR',
  soundEnabled: true,
  autoBackupDaily: true,
  defaultMinStock: 10,
  warehouseCapacityUnits: 5000,
  warehouses: ['Gudang Utama Jakarta', 'Gudang Transit', 'Gudang Barang Rusak', 'Gudang Surabaya'],
  categories: [
    'Card Printer',
    'Consumables & Ribbon',
    'PVC Blank & Smart Card',
    'Cleaning Kit',
    'Spare Part & Print Head',
    'Lamination Film',
    'Lainnya'
  ],
  rackLocations: ['Rak A01', 'Rak A02', 'Rak A03', 'Rak B01', 'Rak B02', 'Rak C01', 'Workshop Service Lab']
};

// Rich Inventory Master matching Commercial Catalog & Demo Units
const INITIAL_INVENTORY: InventoryItem[] = [
  // 1. HARDWARE CARD PRINTERS (PRODUK UTAMA DIJUAL & STOK GUDANG)
  {
    id: 'prod-001',
    sku: 'IDP-SM81-RET',
    serialNumber: 'SN-IDP81-2024-010',
    barcode: '899123500002',
    name: 'IDP Smart-81 Industrial Retransfer Card Printer',
    category: 'Card Printer',
    brand: 'IDP Corp Korea',
    assetCode: 'AST-IDP-000236',
    quantity: 12,
    minStock: 15,
    unit: 'Unit',
    costPrice: 32000000,
    price: 38500000,
    sellPrice: 38500000,
    location: 'Gudang Jakarta - Rak A01',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Stok siap jual. Garansi resmi 2 tahun service & printhead.',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-31T09:15:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-002',
    sku: 'FARGO-HDP5600-600',
    serialNumber: 'SN-HDP56-2024-088',
    barcode: '899560000001',
    name: 'HID Fargo HDP5600 600DPI Retransfer Printer Dual Sided',
    category: 'Card Printer',
    brand: 'HID Global Fargo',
    assetCode: 'AST-FARGO-000123',
    quantity: 6,
    minStock: 8,
    unit: 'Unit',
    costPrice: 41000000,
    price: 49500000,
    sellPrice: 49500000,
    location: 'Gudang Jakarta - Rak A02',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Ready stock batch terbaru. Resolusi ultra high 600 DPI.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-30T11:20:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-003',
    sku: 'IDP-SM70-MOD',
    serialNumber: 'SN-IDP70-2024-034',
    barcode: '899070000001',
    name: 'IDP Smart-70 Modular Multi-Hopper Industrial Printer',
    category: 'Card Printer',
    brand: 'IDP Corp Korea',
    assetCode: 'AST-IDP-000098',
    quantity: 4,
    minStock: 6,
    unit: 'Unit',
    costPrice: 45000000,
    price: 54000000,
    sellPrice: 54000000,
    location: 'Gudang Jakarta - Rak A03',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Budi Santoso',
    notes: 'Unit cetak kartu skala besar untuk perbankan & institusi.',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-30T16:45:00.000Z',
    updatedBy: 'Budi Santoso'
  },
  {
    id: 'prod-004',
    sku: 'ZEBRA-ZC300-DS',
    serialNumber: 'SN-ZC300-2024-112',
    barcode: '899300000001',
    name: 'Zebra ZC300 Dual Sided Direct-to-Card Printer',
    category: 'Card Printer',
    brand: 'Zebra Technologies',
    assetCode: 'AST-ZEB-000300',
    quantity: 15,
    minStock: 10,
    unit: 'Unit',
    costPrice: 19500000,
    price: 24500000,
    sellPrice: 24500000,
    location: 'Gudang Jakarta - Rak A04',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Printer kartu ringkas dan elegan untuk kantor & sekolah.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-28T14:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-005',
    sku: 'EVOLIS-PRIMACY2',
    serialNumber: 'SN-EVO-2024-055',
    barcode: '899200000001',
    name: 'Evolis Primacy 2 Duplex High-Speed Card Printer',
    category: 'Card Printer',
    brand: 'Evolis France',
    assetCode: 'AST-EVO-000055',
    quantity: 8,
    minStock: 10,
    unit: 'Unit',
    costPrice: 23000000,
    price: 28000000,
    sellPrice: 28000000,
    location: 'Gudang Jakarta - Rak A05',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Konektivitas USB & Ethernet dengan opsi rewritable card.',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-29T10:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },

  // 2. CONSUMABLES & RIBBON (PRODUK BAHAN HABIS PAKAI)
  {
    id: 'prod-006',
    sku: 'RBN-HDP5000-YMCK',
    serialNumber: 'RBN-2024-0988',
    barcode: '899888777001',
    name: 'HID Fargo HDP5000/HDP5600 YMCK Color Ribbon (500 Prints)',
    category: 'Consumables & Ribbon',
    brand: 'HID Global',
    assetCode: 'AST-RBN-00088',
    quantity: 45,
    minStock: 25,
    unit: 'Roll',
    costPrice: 1450000,
    price: 1850000,
    sellPrice: 1850000,
    location: 'Gudang Jakarta - Rak B01',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Tinta warna asli HID Fargo part number 084051.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-31T08:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-007',
    sku: 'RBN-IDP81-YMCKO',
    serialNumber: 'RBN-IDP-2024-11',
    barcode: '899888777003',
    name: 'IDP Smart-81 YMCKO Full Color Ribbon (1000 Prints)',
    category: 'Consumables & Ribbon',
    brand: 'IDP Corp',
    assetCode: 'AST-RBN-00112',
    quantity: 35,
    minStock: 20,
    unit: 'Roll',
    costPrice: 1950000,
    price: 2450000,
    sellPrice: 2450000,
    location: 'Gudang Jakarta - Rak B02',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Kapasitas cetak 1.000 sisi per roll dengan lapisan overlay proteksi.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-30T10:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-008',
    sku: 'RBN-ZEBRA-ZC300',
    serialNumber: 'RBN-ZEB-2024-77',
    barcode: '899888777004',
    name: 'Zebra ZC300 YMCKO Color Ribbon (300 Prints)',
    category: 'Consumables & Ribbon',
    brand: 'Zebra Technologies',
    assetCode: 'AST-RBN-00077',
    quantity: 60,
    minStock: 30,
    unit: 'Roll',
    costPrice: 720000,
    price: 950000,
    sellPrice: 950000,
    location: 'Gudang Jakarta - Rak B03',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Cartridge ribbon drop-in pintar mudah dipasang.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-29T11:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-009',
    sku: 'FLM-HDP-RETRANS',
    serialNumber: 'FLM-2024-0045',
    barcode: '899888777005',
    name: 'HID Fargo Clear HDP Retransfer Film (1500 Prints)',
    category: 'Consumables & Ribbon',
    brand: 'HID Global',
    assetCode: 'AST-FLM-00045',
    quantity: 28,
    minStock: 15,
    unit: 'Roll',
    costPrice: 1250000,
    price: 1650000,
    sellPrice: 1650000,
    location: 'Gudang Jakarta - Rak B04',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Film pelindung transfer panas untuk Fargo HDP5000/HDP5600.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-28T09:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },

  // 3. PVC BLANK CARD & SMART CARD RFID (KARTU KOSONG & RFID)
  {
    id: 'prod-010',
    sku: 'CRD-PVC-NOCO',
    serialNumber: 'PVC-2024-1200',
    barcode: '899777111001',
    name: 'Blank Card PVC Ultracard Noco ISO CR-80 0.76mm (Box 500 Pcs)',
    category: 'PVC Blank & Smart Card',
    brand: 'UltraCard ISO',
    assetCode: 'AST-CRD-00120',
    quantity: 120,
    minStock: 50,
    unit: 'Box',
    costPrice: 320000,
    price: 450000,
    sellPrice: 450000,
    location: 'Gudang Jakarta - Rak C01',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Permukaan putih mengkilap standar perbankan anti-gores.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-31T08:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-011',
    sku: 'CRD-RFID-MIFARE',
    serialNumber: 'MIF-2024-0080',
    barcode: '899777111002',
    name: 'Mifare Classic 1K S50 RFID Smart Card 13.56MHz (Box 200 Pcs)',
    category: 'PVC Blank & Smart Card',
    brand: 'NXP Semiconductors',
    assetCode: 'AST-CRD-00080',
    quantity: 80,
    minStock: 40,
    unit: 'Box',
    costPrice: 850000,
    price: 1200000,
    sellPrice: 1200000,
    location: 'Gudang Jakarta - Rak C02',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Chip RFID 13.56 MHz untuk akses pintu kantor, hotel, dan absensi.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-30T14:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },
  {
    id: 'prod-012',
    sku: 'CRD-PROX-125KHZ',
    serialNumber: 'PRX-2024-0050',
    barcode: '899777111003',
    name: 'Proximity EM4100 125Khz Clamshell Access Card (Box 100 Pcs)',
    category: 'PVC Blank & Smart Card',
    brand: 'HID Compatible',
    assetCode: 'AST-CRD-00050',
    quantity: 50,
    minStock: 30,
    unit: 'Box',
    costPrice: 420000,
    price: 650000,
    sellPrice: 650000,
    location: 'Gudang Jakarta - Rak C03',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Kartu tebal dengan lubang tali id card standar akses gedung.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-28T16:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },

  // 4. CLEANING KIT & PERAWATAN (STOK KRITIS ALERT)
  {
    id: 'prod-013',
    sku: 'CLN-KIT-UNIVERSAL',
    serialNumber: 'CLN-2024-0012',
    barcode: '899888777002',
    name: 'Universal Complete Card Printer Cleaning Kit (Cards, Swabs, Pen)',
    category: 'Cleaning Kit',
    brand: 'Universal Clean',
    assetCode: 'AST-CLN-00012',
    quantity: 3,
    minStock: 10,
    unit: 'Box',
    costPrice: 280000,
    price: 450000,
    sellPrice: 450000,
    location: 'Gudang Jakarta - Rak B05',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Siti Aminah',
    notes: 'Perlu restock segera! Sisa 3 box dari batas minimum 10.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-31T08:00:00.000Z',
    updatedBy: 'Siti Aminah'
  },

  // 5. SPARE PART & PRINTHEAD
  {
    id: 'prod-014',
    sku: 'SPR-HD-IDP81-300',
    serialNumber: 'HD-IDP-2024-06',
    barcode: '899666000001',
    name: 'Thermal Printhead 300DPI IDP Smart-81 Original Replacement',
    category: 'Spare Part & Print Head',
    brand: 'IDP Corp',
    assetCode: 'AST-SPR-00006',
    quantity: 6,
    minStock: 5,
    unit: 'Pcs',
    costPrice: 4800000,
    price: 6500000,
    sellPrice: 6500000,
    location: 'Workshop Service Lab',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Andi Setiawan',
    notes: 'Sparepart cadangan resmi untuk service workshop.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-25T11:00:00.000Z',
    updatedBy: 'Andi Setiawan'
  },
  {
    id: 'prod-015',
    sku: 'SPR-RLR-HDP5600',
    serialNumber: 'RLR-HDP-2024-14',
    barcode: '899666000002',
    name: 'Card Feed Roller Assembly Kit Fargo HDP5600',
    category: 'Spare Part & Print Head',
    brand: 'HID Global',
    assetCode: 'AST-SPR-00014',
    quantity: 14,
    minStock: 10,
    unit: 'Set',
    costPrice: 550000,
    price: 850000,
    sellPrice: 850000,
    location: 'Workshop Service Lab',
    status: 'tersedia',
    condition: 'baru',
    pic: 'Andi Setiawan',
    notes: 'Karet roller penarik kartu cadangan pengganti kartu macet.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-26T14:00:00.000Z',
    updatedBy: 'Andi Setiawan'
  },

  // 6. DEMO UNITS (UNIT PINJAMAN POC CUSTOMER)
  {
    id: 'demo-001',
    sku: 'IDP-SM81-DEMO1',
    serialNumber: 'SN001235',
    barcode: '899123500001',
    name: 'IDP Smart-81 Industrial Card Printer (Demo Unit)',
    category: 'Card Printer',
    brand: 'IDP Corp Korea',
    assetCode: 'AST-DEMO-001235',
    quantity: 1,
    minStock: 2,
    unit: 'Unit',
    costPrice: 32000000,
    price: 38500000,
    sellPrice: 38500000,
    location: 'Customer PT. Bank Central Asia',
    status: 'on_demo',
    condition: 'bagus',
    pic: 'Doni Pratama (Sales)',
    notes: 'Peminjaman POC uji coba cetak kartu pegawai & magnetic stripe di BCA Menara Thamrin.',
    demoLoanInfo: {
      borrowerName: 'Doni Pratama (Sales)',
      customerName: 'PT. Bank Central Asia (BCA)',
      borrowerContact: '0812-8899-1122',
      borrowerDepartment: 'Enterprise Sales',
      loanDate: '2026-05-20T08:30:00.000Z',
      expectedReturnDate: '2026-06-05T17:00:00.000Z',
      purpose: 'POC Pencetakan Kartu ID Akses Gedung Bank',
      notes: 'Kelengkapan: Kabel Power, Kabel USB, 1 Roll Color Ribbon, 100 Blank PVC Card.',
      active: true,
      loanedBy: 'Doni Pratama',
      documentNumber: 'DO-DEMO-2024-0045'
    },
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-31T10:32:00.000Z',
    updatedBy: 'Doni Pratama'
  },
  {
    id: 'demo-002',
    sku: 'IDP-SM81-OD1',
    serialNumber: 'SN001122',
    barcode: '899112200001',
    name: 'IDP Smart-81 Enterprise Edition (Demo Unit)',
    category: 'Card Printer',
    brand: 'IDP Corp',
    assetCode: 'AST-DEMO-001122',
    quantity: 1,
    minStock: 2,
    unit: 'Unit',
    costPrice: 32000000,
    price: 38500000,
    sellPrice: 38500000,
    location: 'Customer PT. Sukses Abadi',
    status: 'on_demo',
    condition: 'bagus',
    pic: 'Doni Pratama',
    notes: 'Terlambat 7 hari dari jadwal kembali! Segera hubungi customer untuk penjemputan.',
    demoLoanInfo: {
      borrowerName: 'Doni Pratama',
      customerName: 'PT. Sukses Abadi',
      borrowerContact: '0812-9988-7766',
      borrowerDepartment: 'Enterprise Sales',
      loanDate: '2026-05-01T08:00:00.000Z',
      expectedReturnDate: '2026-05-24T17:00:00.000Z',
      purpose: 'Demo Proyek Cetak ID Card Karyawan 5000 Lembar',
      notes: 'Customer meminta perpanjangan pengetesan printer.',
      active: true,
      loanedBy: 'Doni Pratama',
      documentNumber: 'DO-DEMO-2024-0018'
    },
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-24T17:00:00.000Z',
    updatedBy: 'Doni Pratama'
  },
  {
    id: 'demo-003',
    sku: 'FARGO-HDP-OD2',
    serialNumber: 'SN001105',
    barcode: '899110500001',
    name: 'Fargo HDP5600 Dual Sided (Demo Unit)',
    category: 'Card Printer',
    brand: 'HID Global',
    assetCode: 'AST-DEMO-001105',
    quantity: 1,
    minStock: 2,
    unit: 'Unit',
    costPrice: 41000000,
    price: 49500000,
    sellPrice: 49500000,
    location: 'Customer PT. Maju Jaya Bersama',
    status: 'on_demo',
    condition: 'bagus',
    pic: 'Doni Pratama',
    notes: 'Terlambat 5 hari. Kurir logistik sudah dijadwalkan.',
    demoLoanInfo: {
      borrowerName: 'Doni Pratama',
      customerName: 'PT. Maju Jaya Bersama',
      borrowerContact: '0813-1122-3344',
      borrowerDepartment: 'Enterprise Sales',
      loanDate: '2026-05-05T09:00:00.000Z',
      expectedReturnDate: '2026-05-26T17:00:00.000Z',
      purpose: 'Demo Pencetakan E-KTP Mockup Uji Coba RFID',
      notes: 'Kelengkapan komplit.',
      active: true,
      loanedBy: 'Doni Pratama',
      documentNumber: 'DO-DEMO-2024-0022'
    },
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-26T17:00:00.000Z',
    updatedBy: 'Doni Pratama'
  },

  // 7. SERVICE UNITS (DALAM PERBAIKAN DI WORKSHOP LAB)
  {
    id: 'serv-001',
    sku: 'FARGO-HDP-SRV',
    serialNumber: 'HD5600123',
    barcode: '899560000099',
    name: 'HID Fargo HDP5600 High Definition Printer (Service Unit)',
    category: 'Card Printer',
    brand: 'HID Global Fargo',
    assetCode: 'AST-SRV-000123',
    quantity: 1,
    minStock: 2,
    unit: 'Unit',
    costPrice: 41000000,
    price: 49500000,
    sellPrice: 49500000,
    location: 'Workshop Service Lab',
    status: 'service',
    condition: 'perlu_servis',
    pic: 'Andi Setiawan (Teknisi)',
    notes: 'Diagnosa: Feed roller karet aus & sensor optik kotor debu. Sedang proses penggantian spare part roller kit.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
    lastUpdated: '2026-05-30T11:20:00.000Z',
    updatedBy: 'Andi Setiawan'
  }
];

// Initial Transactions (Sales, Purchasing, Demo, Service)
const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-001',
    transactionNumber: 'SO-2024-00088',
    timestamp: '2026-05-31T14:30:00.000Z',
    type: 'Penjualan',
    itemId: 'prod-001',
    itemSku: 'IDP-SM81-RET',
    serialNumber: 'SN-IDP81-2024-008',
    itemName: 'IDP Smart-81 Industrial Retransfer Card Printer',
    fromLocation: 'Gudang Utama Jakarta',
    toLocation: 'PT. Bank Mandiri (Persero) Tbk',
    quantity: 2,
    pic: 'Doni Pratama',
    status: 'Selesai',
    notes: 'Penjualan 2 Unit IDP Smart-81 untuk Cabang Plaza Mandiri Jakarta.',
    customer: 'PT. Bank Mandiri (Persero) Tbk',
    totalPrice: 77000000
  },
  {
    id: 'tx-002',
    transactionNumber: 'SO-2024-00087',
    timestamp: '2026-05-31T11:15:00.000Z',
    type: 'Penjualan',
    itemId: 'prod-006',
    itemSku: 'RBN-HDP5000-YMCK',
    serialNumber: 'RBN-2024-0988',
    itemName: 'HID Fargo HDP5000/HDP5600 YMCK Color Ribbon',
    fromLocation: 'Gudang Utama Jakarta',
    toLocation: 'PT. Telkom Indonesia',
    quantity: 10,
    pic: 'Doni Pratama',
    status: 'Selesai',
    notes: 'Pembelian 10 roll ribbon Fargo YMCK PO: TELKOM-ID-2024.',
    customer: 'PT. Telkom Indonesia',
    totalPrice: 18500000
  },
  {
    id: 'tx-003',
    transactionNumber: 'GR-2024-00057',
    timestamp: '2026-05-30T15:20:00.000Z',
    type: 'Goods Receipt',
    itemId: 'prod-004',
    itemSku: 'ZEBRA-ZC300-DS',
    serialNumber: 'SN-ZC300-2024-112',
    itemName: 'Zebra ZC300 Dual Sided Direct-to-Card Printer',
    fromLocation: 'Supplier Zebra Technologies Singapore',
    toLocation: 'Gudang Utama Jakarta',
    quantity: 10,
    pic: 'Siti Aminah',
    status: 'Selesai',
    notes: 'Penerimaan stok import resmi PO-RIS-2024-042.',
    supplier: 'Zebra Technologies Singapore'
  },
  {
    id: 'tx-004',
    transactionNumber: 'DO-DEMO-2024-0045',
    timestamp: '2026-05-30T10:32:00.000Z',
    type: 'Demo Out',
    itemId: 'demo-001',
    itemSku: 'IDP-SM81-DEMO1',
    serialNumber: 'SN001235',
    itemName: 'IDP Smart-81 Industrial Card Printer (Demo Unit)',
    fromLocation: 'Gudang Utama Jakarta',
    toLocation: 'PT. Bank Central Asia (BCA)',
    quantity: 1,
    pic: 'Doni Pratama',
    status: 'On Demo',
    notes: 'Peminjaman unit demo POC pencetakan kartu akses.',
    customer: 'PT. Bank Central Asia (BCA)'
  },
  {
    id: 'tx-005',
    transactionNumber: 'SV-2024-00021',
    timestamp: '2026-05-29T11:20:00.000Z',
    type: 'Service In',
    itemId: 'serv-001',
    itemSku: 'FARGO-HDP-SRV',
    serialNumber: 'HD5600123',
    itemName: 'HID Fargo HDP5600 High Definition Printer',
    fromLocation: 'Gudang Utama Jakarta',
    toLocation: 'Workshop Service Lab',
    quantity: 1,
    pic: 'Andi Setiawan',
    status: 'Proses',
    notes: 'Penyerahan unit service perbaikan feeder jam ke meja teknisi.'
  }
];

// Initial Sales Orders
const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-rec-001',
    orderNumber: 'INV-2024-00102',
    customerName: 'PT. Bank Mandiri (Persero) Tbk',
    customerPhone: '021-5265045',
    customerAddress: 'Plaza Mandiri Lt. 15, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta',
    orderDate: '2026-05-31T14:30:00.000Z',
    deliveryDate: '2026-06-02T10:00:00.000Z',
    salesPic: 'Doni Pratama',
    items: [
      {
        itemId: 'prod-001',
        name: 'IDP Smart-81 Industrial Retransfer Card Printer',
        sku: 'IDP-SM81-RET',
        quantity: 2,
        unitPrice: 38500000,
        totalPrice: 77000000
      },
      {
        itemId: 'prod-007',
        name: 'IDP Smart-81 YMCKO Full Color Ribbon (1000 Prints)',
        sku: 'RBN-IDP81-YMCKO',
        quantity: 4,
        unitPrice: 2450000,
        totalPrice: 9800000
      }
    ],
    subtotal: 86800000,
    tax: 0,
    discount: 1800000,
    grandTotal: 85000000,
    paymentStatus: 'Lunas',
    deliveryStatus: 'Terkirim',
    notes: 'Surat Jalan DO-2024-00088 telah ditandatangani bagian procurement Bank Mandiri.'
  },
  {
    id: 'so-rec-002',
    orderNumber: 'INV-2024-00101',
    customerName: 'PT. Telkom Indonesia',
    customerPhone: '021-8088990',
    customerAddress: 'Telkom Landmark Tower Lt. 20, Jl. Gatot Subroto Kav. 52, Jakarta',
    orderDate: '2026-05-31T11:15:00.000Z',
    deliveryDate: '2026-06-01T14:00:00.000Z',
    salesPic: 'Doni Pratama',
    items: [
      {
        itemId: 'prod-006',
        name: 'HID Fargo HDP5000/HDP5600 YMCK Color Ribbon',
        sku: 'RBN-HDP5000-YMCK',
        quantity: 10,
        unitPrice: 1850000,
        totalPrice: 18500000
      },
      {
        itemId: 'prod-010',
        name: 'Blank Card PVC Ultracard Noco ISO CR-80 0.76mm (Box 500 Pcs)',
        sku: 'CRD-PVC-NOCO',
        quantity: 5,
        unitPrice: 450000,
        totalPrice: 2250000
      }
    ],
    subtotal: 20750000,
    tax: 0,
    discount: 750000,
    grandTotal: 20000000,
    paymentStatus: 'DP / Tempo',
    deliveryStatus: 'Dalam Pengiriman',
    notes: 'Tempo pembayaran 30 hari via transfer Bank Mandiri.'
  }
];

// Initial Goods Receipts (Penerimaan Barang Supplier)
const INITIAL_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'gr-rec-001',
    receiptNumber: 'GR-2024-00057',
    poNumber: 'PO-RIS-2024-042',
    supplierName: 'Zebra Technologies Singapore Pte Ltd',
    receivedDate: '2026-05-30T15:20:00.000Z',
    warehouseLocation: 'Gudang Utama Jakarta - Rak A04',
    receiverPic: 'Siti Aminah',
    items: [
      {
        itemId: 'prod-004',
        name: 'Zebra ZC300 Dual Sided Direct-to-Card Printer',
        sku: 'ZEBRA-ZC300-DS',
        quantityReceived: 10,
        unitCost: 19500000,
        totalCost: 195000000
      }
    ],
    totalValue: 195000000,
    status: 'Selesai',
    notes: 'Kondisi kemasan kayu utuh, segel garansi resmi aman.'
  }
];

// Initial Service Tickets
const INITIAL_SERVICE_TICKETS: ServiceTicket[] = [
  {
    id: 'st-001',
    ticketNumber: 'SV-2024-00021',
    itemId: 'serv-001',
    itemName: 'HID Fargo HDP5600 High Definition Printer',
    serialNumber: 'HD5600123',
    customerName: 'PT. Asuransi Jiwa Sejahtera',
    problem: 'Paper sering macet / card feeder slip saat pencetakan batch',
    diagnosis: 'Feed roller karet mengalami keausan & sensor optik tertutup debu pemotongan ribbon.',
    technician: 'Andi Setiawan',
    entryDate: '2026-05-29T11:20:00.000Z',
    estimatedCompletion: '2026-06-03T17:00:00.000Z',
    status: 'Proses',
    spareParts: [
      { name: 'Card Feed Roller Assembly Kit', qty: 1, cost: 650000 },
      { name: 'Optical Sensor Cleaning Swab', qty: 2, cost: 75000 }
    ],
    costTotal: 800000,
    notes: 'Menunggu spare part roller kit tiba dari principal.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'st-002',
    ticketNumber: 'SV-2024-00020',
    itemId: 'prod-001',
    itemName: 'IDP Smart-81 Retransfer Printer',
    serialNumber: 'SN001100',
    customerName: 'Universitas Indonesia',
    problem: 'Kerusakan Head / Garis vertikal putih pada kartu hasil cetak',
    diagnosis: 'Thermal printhead pixel dead line pada pin ke-120.',
    technician: 'Andi Setiawan',
    entryDate: '2026-05-26T09:00:00.000Z',
    estimatedCompletion: '2026-06-01T15:00:00.000Z',
    status: 'Menunggu Spare Part',
    spareParts: [
      { name: 'Thermal Printhead 300DPI IDP Smart-81', qty: 1, cost: 4800000 }
    ],
    costTotal: 4800000,
    notes: 'Sudah diorderkan printhead baru.'
  }
];

// Initial Stock Opname
const INITIAL_STOCK_OPNAME: StockOpnameSession[] = [
  {
    id: 'so-001',
    soNumber: 'SO-2024-00012',
    warehouse: 'Gudang Utama Jakarta',
    location: 'Rak A01 - Rak A05',
    date: '2026-05-31',
    status: 'Dalam Proses',
    pic: 'Budi Santoso',
    notes: 'Audit stok berkala akhir bulan Mei 2024.',
    items: [
      {
        itemId: 'prod-001',
        productName: 'IDP Smart-81 Industrial Retransfer Card Printer',
        serialNumber: 'SN-IDP81-2024-010',
        systemQty: 14,
        physicalQty: 12,
        difference: -2,
        condition: 'Baik',
        notes: '2 unit telah dikirim ke Bank Mandiri (SO-2024-00088)'
      },
      {
        itemId: 'prod-002',
        productName: 'HID Fargo HDP5600 600DPI Retransfer Printer Dual Sided',
        serialNumber: 'SN-HDP56-2024-088',
        systemQty: 6,
        physicalQty: 6,
        difference: 0,
        condition: 'Baik',
        notes: 'Sesuai fisik'
      },
      {
        itemId: 'prod-006',
        productName: 'HID Fargo HDP5000/HDP5600 YMCK Color Ribbon',
        serialNumber: 'RBN-2024-0988',
        systemQty: 55,
        physicalQty: 45,
        difference: -10,
        condition: 'Baik',
        notes: '10 roll terkirim ke PT. Telkom (SO-2024-00087)'
      },
      {
        itemId: 'prod-013',
        productName: 'Universal Complete Card Printer Cleaning Kit',
        serialNumber: 'CLN-2024-0012',
        systemQty: 3,
        physicalQty: 3,
        difference: 0,
        condition: 'Baik',
        notes: 'Stok kritis sisa 3 box'
      }
    ]
  }
];

class StorageService {
  private ensurePermission(user: User | undefined, key: keyof ReturnType<typeof getPermissions>) {
    const role = user?.role as any;
    const perms = getPermissions(role);
    if (!perms[key]) {
      this.addAuditLog({
        action: 'PERMISSION_DENIED',
        module: 'storage',
        category: 'auth',
        details: `User ${user?.name || 'anonymous'} (${user?.role || 'none'}) tidak memiliki izin ${key}`,
        user: user || 'anonymous'
      });
      throw new Error('Permission denied');
    }
  }

  // USERS
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  saveUser(user: User, actor?: User): void {
    // If actor is provided and actor is not the same user, require manage users permission
    if (actor && actor.id !== user.id) {
      try { this.ensurePermission(actor, 'canManageUsers'); } catch (e) { throw e; }
    }

    // Hash plaintext password if present and not already hashed
    try {
      // Lazy import to avoid circular issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { hashPassword } = require('../utils/password');
      if (user.password && typeof user.password === 'string' && !user.password.startsWith('bcryptsim$')) {
        user.password = hashPassword(user.password);
      }
    } catch (err) {
      // ignore hashing errors in demo environment
    }

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);
  }

  deleteUser(id: string, actor?: User): void {
    if (actor) {
      try { this.ensurePermission(actor, 'canManageUsers'); } catch (e) { throw e; }
    }
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  authenticate(identifier: string, password?: string): User | null {
    const users = this.getUsers();
    const clean = (identifier || '').trim().toLowerCase();
    const passClean = (password || '').trim();

    if (!clean) return null;

    const found = users.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const matchesId = uName === clean || uEmail === clean;
      if (!matchesId) return false;
      // If password stored in hashed form, verify using verifyPassword, otherwise fallback to plain comparison
      if (u.password && passClean) {
        try {
          // lazy require
          const { verifyPassword, hashPassword } = require('../utils/password');
          if (typeof u.password === 'string' && u.password.startsWith('bcryptsim$')) {
            return verifyPassword(passClean, u.password);
          }
          // legacy plaintext match (case-insensitive)
          const plainMatch = u.password.toLowerCase() === passClean.toLowerCase();
          if (plainMatch) {
            // migrate to hashed password
            try {
              const newHash = hashPassword(passClean);
              const migrated = { ...u, password: newHash } as User;
              this.saveUser(migrated);
            } catch {}
          }
          return plainMatch;
        } catch (err) {
          return (u.password || '').toLowerCase() === passClean.toLowerCase();
        }
      }
      return true;
    });

    if (found) {
      const updated = { ...found, lastLogin: new Date().toISOString() };
      this.saveUser(updated);
      this.setCurrentUser(updated);
      return updated;
    }
    return null;
  }

  // INVENTORY / PRODUCTS
  getItems(): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      return INITIAL_INVENTORY;
    }
    try {
      const parsed: InventoryItem[] = JSON.parse(raw);
      // migrate legacy items to per-warehouse stocks
      const settings = this.getSettings();
      const defaultWarehouse = settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
      const migrated = parsed.map(it => {
        const copy = { ...it } as InventoryItem;
        if (!copy.warehouseStocks || Object.keys(copy.warehouseStocks).length === 0) {
          // try to infer warehouse from explicit field or from location string
          const warehouseKey = copy.warehouseName || (copy.location ? copy.location.split(' - ')[0] : undefined) || defaultWarehouse;
          copy.warehouseStocks = { [warehouseKey]: (typeof copy.quantity === 'number' ? copy.quantity : 0) };
        }
        // ensure total quantity is consistent with warehouseStocks
        try {
          const total = Object.values(copy.warehouseStocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
          copy.quantity = total;
        } catch {
          copy.quantity = copy.quantity || 0;
        }
        return copy;
      });
      // persist migration silently if needed
      try { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(migrated)); } catch {}
      return migrated;
    } catch {
      return INITIAL_INVENTORY;
    }
  }

  saveItems(items: InventoryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }

  saveItem(item: InventoryItem, user?: User): void {
    try { this.ensurePermission(user, 'canEditProducts'); } catch (e) { throw e; }
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === item.id);
    const previousItem = idx >= 0 ? items[idx] : null;
    const updatedBy = user?.name || item.updatedBy || 'Admin';

    // ensure warehouseStocks exists and quantity is derived
    const settings = this.getSettings();
    const defaultWarehouse = settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
    const itemCopy = { ...item } as InventoryItem;
    if (!itemCopy.warehouseStocks || Object.keys(itemCopy.warehouseStocks).length === 0) {
      const wk = itemCopy.warehouseName || (itemCopy.location ? itemCopy.location.split(' - ')[0] : undefined) || defaultWarehouse;
      itemCopy.warehouseStocks = { [wk]: (typeof itemCopy.quantity === 'number' ? itemCopy.quantity : 0) };
    }
    // recalc total quantity
    itemCopy.quantity = Object.values(itemCopy.warehouseStocks).reduce((s, v) => s + (Number(v) || 0), 0);

    if (idx >= 0) {
      items[idx] = { 
        ...itemCopy, 
        lastUpdated: new Date().toISOString(),
        updatedBy
      };
    } else {
      items.unshift({ 
        ...itemCopy, 
        lastUpdated: new Date().toISOString(),
        updatedBy
      });
    }
    this.saveItems(items);

    if (previousItem && previousItem.quantity !== item.quantity) {
      this.recordStockMutationAudit({
        itemId: item.id,
        itemSku: item.sku,
        itemName: item.name,
        type: 'Pembelian',
        delta: item.quantity - previousItem.quantity,
        previousQty: previousItem.quantity,
        newQty: item.quantity,
        user,
        reason: 'Update data master stok / perubahan kuantitas.'
      });
    }
  }

  addItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>, user?: User): InventoryItem {
    try { this.ensurePermission(user, 'canEditProducts'); } catch (e) { throw e; }
    const items = this.getItems();
    const settings = this.getSettings();
    const defaultWarehouse = settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
    const warehouseStocks = (item as any).warehouseStocks && Object.keys((item as any).warehouseStocks).length > 0
      ? (item as any).warehouseStocks
      : { [(item as any).warehouseName || defaultWarehouse]: (item as any).quantity || 0 };

    const newItem: InventoryItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      warehouseStocks,
      quantity: Object.values(warehouseStocks).reduce((s: number, v: any) => s + (Number(v) || 0), 0),
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || 'Admin'
    };
    items.unshift(newItem);
    this.saveItems(items);

    // Log transaction
    this.addTransaction({
      transactionNumber: `NEW-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      type: 'Masuk',
      itemId: newItem.id,
      itemSku: newItem.sku,
      serialNumber: newItem.serialNumber,
      itemName: newItem.name,
      fromLocation: 'Pendaftaran Master Baru',
      toLocation: newItem.location,
      quantity: newItem.quantity,
      pic: user?.name || 'Admin',
      status: 'Selesai',
      notes: `Registrasi master produk baru: ${newItem.name}`
    });

    try { warehouseAudio.playSuccess(); } catch {}
    return newItem;
  }

  updateItem(id: string, updates: Partial<InventoryItem>, user?: User): InventoryItem | null {
    try { this.ensurePermission(user, 'canEditProducts'); } catch (e) { throw e; }
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const oldItem = items[idx];
    const merged = { ...oldItem, ...updates } as InventoryItem;
    // ensure warehouseStocks exists
    const settings = this.getSettings();
    const defaultWarehouse = settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
    if (!merged.warehouseStocks || Object.keys(merged.warehouseStocks).length === 0) {
      const wk = merged.warehouseName || (merged.location ? merged.location.split(' - ')[0] : undefined) || defaultWarehouse;
      merged.warehouseStocks = { [wk]: (typeof merged.quantity === 'number' ? merged.quantity : 0) };
    }
    merged.quantity = Object.values(merged.warehouseStocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);

    const updated: InventoryItem = {
      ...merged,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || oldItem.updatedBy
    };
    items[idx] = updated;
    this.saveItems(items);
    return updated;
  }

  deleteItem(id: string, user?: User): boolean {
    try { this.ensurePermission(user, 'canEditProducts'); } catch (e) { throw e; }
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length !== items.length) {
      this.saveItems(filtered);
      return true;
    }
    return false;
  }

  adjustItemStock(id: string, delta: number, type: 'Penjualan' | 'Pembelian' | 'Masuk' | 'Keluar' | 'Opname Adjustment', reason: string, user?: User, warehouse?: string): boolean {
    try { this.ensurePermission(user, 'canEditProducts'); } catch (e) { throw e; }
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return false;

    const item = items[idx];
    // determine warehouse to apply change
    const settings = this.getSettings();
    const targetWarehouse = warehouse || item.warehouseName || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
    if (!item.warehouseStocks) item.warehouseStocks = {};
    const prevWarehouseQty = Number(item.warehouseStocks[targetWarehouse] || 0);
    const newWarehouseQty = Math.max(0, prevWarehouseQty + delta);
    item.warehouseStocks[targetWarehouse] = newWarehouseQty;
    // recalc total quantity
    const newQty = Object.values(item.warehouseStocks).reduce((s, v) => s + (Number(v) || 0), 0);
    const prevQty = item.quantity || 0;
    item.quantity = newQty;
    item.lastUpdated = new Date().toISOString();
    item.updatedBy = user?.name || 'Operator';
    items[idx] = item;
    this.saveItems(items);

    this.recordStockMutationAudit({
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type,
      delta,
      previousQty: prevQty,
      newQty,
      user,
      reason
    });

    this.addTransaction({
      transactionNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      type: type as any,
      itemId: item.id,
      itemSku: item.sku,
      serialNumber: item.serialNumber,
      itemName: item.name,
      fromLocation: delta < 0 ? `${targetWarehouse}` : 'Penyesuaian / Restock',
      toLocation: delta < 0 ? 'Keluar / Terjual' : `${targetWarehouse}`,
      quantity: Math.abs(delta),
      previousQuantity: prevQty,
      newQuantity: newQty,
      pic: user?.name || 'Operator',
      status: 'Selesai',
      notes: reason || `Penyesuaian stok (${delta > 0 ? '+' : ''}${delta})`
    });

    try { warehouseAudio.playSuccess(); } catch {}
    return true;
  }

  // TRANSACTIONS
  getTransactions(): StockTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  saveTransactions(transactions: StockTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  addTransaction(trx: Omit<StockTransaction, 'id'>): StockTransaction {
    const transactions = this.getTransactions();
    const newTrx: StockTransaction = {
      ...trx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    transactions.unshift(newTrx);
    this.saveTransactions(transactions);
    return newTrx;
  }

  // SALES ORDERS (PENJUALAN & DO KELUAR)
  getSalesOrders(): SalesOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES_ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(INITIAL_SALES_ORDERS));
      return INITIAL_SALES_ORDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SALES_ORDERS;
    }
  }

  saveSalesOrders(orders: SalesOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(orders));
  }

  updateSalesOrder(id: string, updates: Partial<SalesOrder>): SalesOrder | null {
    const orders = this.getSalesOrders();
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) return null;

    const updated = {
      ...orders[index],
      ...updates
    };

    orders[index] = updated;
    this.saveSalesOrders(orders);
    return updated;
  }

  createSalesOrder(order: Omit<SalesOrder, 'id'>, user?: User): SalesOrder {
    try { this.ensurePermission(user, 'canCreateSales'); } catch (e) { throw e; }
    const orders = this.getSalesOrders();
    const newOrder: SalesOrder = {
      ...order,
      id: `so-rec-${Date.now()}`
    };
    orders.unshift(newOrder);
    this.saveSalesOrders(orders);

    // Automatically deduct stock for each sold item and record transaction
    const items = this.getItems();
    order.items.forEach(soldItem => {
      const idx = items.findIndex(i => i.id === soldItem.itemId);
      if (idx >= 0) {
        const item = items[idx];
        // deduct from item-provided source warehouse or default/source warehouse
        const settings = this.getSettings();
        const sourceWarehouse = (soldItem as any).sourceWarehouse || item.warehouseName || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
        if (!item.warehouseStocks) item.warehouseStocks = {};
        const prevWarehouseQty = Number(item.warehouseStocks[sourceWarehouse] || 0);
        const nextWarehouseQty = Math.max(0, prevWarehouseQty - soldItem.quantity);
        item.warehouseStocks[sourceWarehouse] = nextWarehouseQty;
        // update totals and metadata
        const prevQty = item.quantity || 0;
        item.quantity = Object.values(item.warehouseStocks).reduce((s, v) => s + (Number(v) || 0), 0);
        item.lastUpdated = new Date().toISOString();
        item.updatedBy = user?.name || order.salesPic;
        items[idx] = item;

        this.recordStockMutationAudit({
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          type: 'Penjualan',
          delta: -(soldItem.quantity),
          previousQty: prevQty,
          newQty: item.quantity,
          user,
          reason: `Penjualan ${order.orderNumber} (from ${sourceWarehouse})`
        });

        this.addTransaction({
          transactionNumber: order.orderNumber,
          timestamp: order.orderDate,
          type: 'Penjualan',
          itemId: item.id,
          itemSku: item.sku,
          serialNumber: item.serialNumber,
          itemName: item.name,
          fromLocation: sourceWarehouse,
          toLocation: `Customer: ${order.customerName}`,
          quantity: soldItem.quantity,
          previousQuantity: prevQty,
          newQuantity: item.quantity,
          pic: user?.name || order.salesPic,
          status: 'Selesai',
          customer: order.customerName,
          totalPrice: soldItem.totalPrice,
          notes: `Penjualan ${soldItem.quantity} ${item.unit} via ${order.orderNumber}`
        });
      }
    });
    this.saveItems(items);

    try { warehouseAudio.playSuccess(); } catch {}
    return newOrder;
  }

  // GOODS RECEIPTS (PENERIMAAN BARANG SUPPLIER)
  getGoodsReceipts(): GoodsReceipt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GOODS_RECEIPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GOODS_RECEIPTS, JSON.stringify(INITIAL_GOODS_RECEIPTS));
      return INITIAL_GOODS_RECEIPTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GOODS_RECEIPTS;
    }
  }

  saveGoodsReceipts(receipts: GoodsReceipt[]): void {
    localStorage.setItem(STORAGE_KEYS.GOODS_RECEIPTS, JSON.stringify(receipts));
  }

  createGoodsReceipt(receipt: Omit<GoodsReceipt, 'id'>, user?: User): GoodsReceipt {
    try { this.ensurePermission(user, 'canReceiveGoods'); } catch (e) { throw e; }
    const receipts = this.getGoodsReceipts();
    const newReceipt: GoodsReceipt = {
      ...receipt,
      id: `gr-rec-${Date.now()}`
    };
    receipts.unshift(newReceipt);
    this.saveGoodsReceipts(receipts);

    // Automatically increase stock in warehouse and record transaction
    const items = this.getItems();
    receipt.items.forEach(rcvItem => {
      const idx = items.findIndex(i => i.id === rcvItem.itemId);
      if (idx >= 0) {
        const item = items[idx];
        const settings = this.getSettings();
        const destWarehouse = receipt.warehouseLocation || item.warehouseName || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
        if (!item.warehouseStocks) item.warehouseStocks = {};
        const prevWarehouseQty = Number(item.warehouseStocks[destWarehouse] || 0);
        const nextWarehouseQty = prevWarehouseQty + rcvItem.quantityReceived;
        item.warehouseStocks[destWarehouse] = nextWarehouseQty;
        const prevQty = item.quantity || 0;
        item.quantity = Object.values(item.warehouseStocks).reduce((s, v) => s + (Number(v) || 0), 0);
        item.lastUpdated = new Date().toISOString();
        item.updatedBy = user?.name || receipt.receiverPic;
        items[idx] = item;

        this.recordStockMutationAudit({
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          type: 'Pembelian',
          delta: rcvItem.quantityReceived,
          previousQty: prevQty,
          newQty: item.quantity,
          user,
          reason: `Goods Receipt ${receipt.receiptNumber}`
        });

        this.addTransaction({
          transactionNumber: receipt.receiptNumber,
          timestamp: receipt.receivedDate,
          type: 'Goods Receipt',
          itemId: item.id,
          itemSku: item.sku,
          serialNumber: item.serialNumber,
          itemName: item.name,
          fromLocation: `Supplier: ${receipt.supplierName}`,
          toLocation: destWarehouse,
          quantity: rcvItem.quantityReceived,
          previousQuantity: prevQty,
          newQuantity: item.quantity,
          pic: user?.name || receipt.receiverPic,
          status: 'Selesai',
          supplier: receipt.supplierName,
          totalPrice: rcvItem.totalCost,
          notes: `Penerimaan barang masuk PO: ${receipt.poNumber || '-'}`
        });
      }
    });
    this.saveItems(items);

    try { warehouseAudio.playSuccess(); } catch {}
    return newReceipt;
  }

  // SERVICE TICKETS
  getServiceTickets(): ServiceTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICE_TICKETS, JSON.stringify(INITIAL_SERVICE_TICKETS));
      return INITIAL_SERVICE_TICKETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SERVICE_TICKETS;
    }
  }

  saveServiceTickets(tickets: ServiceTicket[]): void {
    localStorage.setItem(STORAGE_KEYS.SERVICE_TICKETS, JSON.stringify(tickets));
  }

  createServiceTicket(ticket: Omit<ServiceTicket, 'id'>, user?: User): ServiceTicket {
    try { this.ensurePermission(user, 'canManageService'); } catch (e) { throw e; }
    const tickets = this.getServiceTickets();
    const newTicket: ServiceTicket = {
      ...ticket,
      id: `st-${Date.now()}`
    };
    tickets.unshift(newTicket);
    this.saveServiceTickets(tickets);

    // Update item status in inventory to service
    if (ticket.itemId) {
      this.updateItem(ticket.itemId, {
        status: 'service',
        location: 'Workshop Service Lab',
        condition: 'perlu_servis',
        pic: ticket.technician
      }, user);
    }

    try { warehouseAudio.playSuccess(); } catch {}
    return newTicket;
  }

  updateServiceTicket(id: string, updates: Partial<ServiceTicket>, user?: User): void {
    try { this.ensurePermission(user, 'canManageService'); } catch (e) { throw e; }
    const tickets = this.getServiceTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx >= 0) {
      const ticket = { ...tickets[idx], ...updates };
      tickets[idx] = ticket;
      this.saveServiceTickets(tickets);

      // If status completed, update inventory item status back to tersedia
      if (updates.status === 'Selesai' && ticket.itemId) {
        this.updateItem(ticket.itemId, {
          status: 'tersedia',
          location: 'Gudang Utama Jakarta - Rak A01',
          condition: 'bagus',
          notes: `Servis selesai (${ticket.ticketNumber}) oleh ${ticket.technician}`
        }, user);
      }
    }
  }

  // STOCK OPNAME
  getStockOpnames(): StockOpnameSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(INITIAL_STOCK_OPNAME));
      return INITIAL_STOCK_OPNAME;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STOCK_OPNAME;
    }
  }

  saveStockOpnames(sessions: StockOpnameSession[]): void {
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(sessions));
  }

  saveStockOpname(session: StockOpnameSession): void {
    const sessions = this.getStockOpnames();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    this.saveStockOpnames(sessions);
  }

  approveAndApplyStockOpname(sessionId: string, user?: User): boolean {
    try { this.ensurePermission(user, 'canPerformOpname'); } catch (e) { throw e; }
    const sessions = this.getStockOpnames();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;

    const session = sessions[idx];
    const items = this.getItems();

    session.items.forEach(soItem => {
      const itemIdx = items.findIndex(i => i.id === soItem.itemId);
      if (itemIdx >= 0 && soItem.difference !== 0) {
        const item = items[itemIdx];
        // apply opname per session.warehouse
        const settings = this.getSettings();
        const opnameWarehouse = session.warehouse || settings.warehouseName || (settings.warehouses && settings.warehouses[0]) || 'Gudang Utama Jakarta';
        if (!item.warehouseStocks) item.warehouseStocks = {};
        const prevWarehouseQty = Number(item.warehouseStocks[opnameWarehouse] || 0);
        item.warehouseStocks[opnameWarehouse] = soItem.physicalQty;
        const prevQty = item.quantity || 0;
        const nextQty = Object.values(item.warehouseStocks).reduce((s, v) => s + (Number(v) || 0), 0);
        item.quantity = nextQty;
        item.lastUpdated = new Date().toISOString();
        item.updatedBy = user?.name || session.pic;
        items[itemIdx] = item;

        this.recordStockMutationAudit({
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          type: 'Opname Adjustment',
          delta: nextQty - prevQty,
          previousQty: prevQty,
          newQty: nextQty,
          user,
          reason: `Stock opname ${session.soNumber}: ${soItem.notes || 'penyesuaian fisik'}`
        });

        this.addTransaction({
          transactionNumber: session.soNumber,
          timestamp: new Date().toISOString(),
          type: 'Opname Adjustment',
          itemId: item.id,
          itemSku: item.sku,
          serialNumber: item.serialNumber,
          itemName: item.name,
          fromLocation: opnameWarehouse,
          toLocation: opnameWarehouse,
          quantity: Math.abs(soItem.difference),
          previousQuantity: prevQty,
          newQuantity: item.quantity,
          pic: user?.name || session.pic,
          status: 'Selesai',
          notes: `Penyesuaian hasil audit fisik Stock Opname (${soItem.difference > 0 ? '+' : ''}${soItem.difference})`
        });
      }
    });

    session.status = 'Selesai';
    sessions[idx] = session;
    this.saveStockOpnames(sessions);
    this.saveItems(items);

    try { warehouseAudio.playSuccess(); } catch {}
    return true;
  }

  // SETTINGS
  getSettings(): WarehouseSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        warehouses: parsed.warehouses || INITIAL_SETTINGS.warehouses,
        categories: parsed.categories || INITIAL_SETTINGS.categories,
        rackLocations: parsed.rackLocations || INITIAL_SETTINGS.rackLocations,
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  saveSettings(settings: WarehouseSettings, user?: User): void {
    try { this.ensurePermission(user, 'canAccessSettings'); } catch (e) { throw e; }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // BACKUPS & SNAPSHOTS
  getBackups(): BackupSnapshot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  createBackupSnapshot(user?: User): BackupSnapshot {
    try { this.ensurePermission(user, 'canAccessSettings'); } catch (e) { throw e; }
    const backups = this.getBackups();
    const dataStr = this.exportFullBackupJSON();
    const snap: BackupSnapshot = {
      id: `bkp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemCount: this.getItems().length,
      transactionCount: this.getTransactions().length,
      sizeBytes: new Blob([dataStr]).size,
      dataJson: dataStr
    };
    backups.unshift(snap);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
    return snap;
  }

  exportFullBackupJSON(): string {
    return JSON.stringify({
      version: '3.0',
      exportedAt: new Date().toISOString(),
      items: this.getItems(),
      transactions: this.getTransactions(),
      salesOrders: this.getSalesOrders(),
      goodsReceipts: this.getGoodsReceipts(),
      tickets: this.getServiceTickets(),
      opname: this.getStockOpnames(),
      settings: this.getSettings(),
      users: this.getUsers()
    }, null, 2);
  }

  importBackupJSON(jsonStr: string, user?: User): boolean {
    try {
      try { this.ensurePermission(user, 'canAccessSettings'); } catch (e) { throw e; }
      const data = JSON.parse(jsonStr);
      if (data.items) this.saveItems(data.items);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.salesOrders) this.saveSalesOrders(data.salesOrders);
      if (data.goodsReceipts) this.saveGoodsReceipts(data.goodsReceipts);
      if (data.tickets) this.saveServiceTickets(data.tickets);
      if (data.opname) this.saveStockOpnames(data.opname);
      if (data.settings) this.saveSettings(data.settings);
      if (data.users) this.saveUsers(data.users);
      return true;
    } catch {
      return false;
    }
  }

  restoreFromSnapshot(id: string, user?: User): boolean {
    try { this.ensurePermission(user, 'canAccessSettings'); } catch (e) { throw e; }
    const snap = this.getBackups().find(b => b.id === id);
    if (!snap) return false;
    return this.importBackupJSON(snap.dataJson, user);
  }

  resetToDefaultData(): void {
    // destructive: caller must ensure permission before calling
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SALES_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.GOODS_RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_TICKETS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_OPNAME);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.getItems();
    this.getTransactions();
    this.getSalesOrders();
    this.getGoodsReceipts();
    this.getServiceTickets();
    this.getStockOpnames();
    this.getSettings();
  }

  getItemByBarcodeOrSku(code: string): InventoryItem | undefined {
    const clean = code.trim().toLowerCase();
    return this.getItems().find(i => 
      i.serialNumber?.toLowerCase() === clean || 
      i.barcode?.toLowerCase() === clean || 
      i.sku?.toLowerCase() === clean ||
      i.id.toLowerCase() === clean
    );
  }

  // Compatibility aliases and helpers
  getInventory(): InventoryItem[] {
    return this.getItems();
  }

  getBackupSnapshots(): BackupSnapshot[] {
    return this.getBackups();
  }

  createBackup(user?: User): BackupSnapshot {
    return this.createBackupSnapshot(user || { id: 'admin', username: 'admin', name: 'Admin', role: 'admin' });
  }

  registerNewUser(user: any): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    if (users.find(u => u.username.toLowerCase() === (user.username || user.email || '').toLowerCase())) {
      return { success: false, message: 'Username atau email sudah terdaftar' };
    }
    const fullUser: User = {
      id: user.id || `u-${Date.now()}`,
      username: user.username || user.email?.split('@')[0] || `user_${Date.now()}`,
      name: user.name || 'Pengguna Baru',
      email: user.email,
      phone: user.phone,
      department: user.department || 'Operasional',
      role: user.role || 'staff',
      password: user.password
    };
    // Hash password if provided
    try {
      const { hashPassword } = require('../utils/password');
      if (fullUser.password && typeof fullUser.password === 'string' && !fullUser.password.startsWith('bcryptsim$')) {
        fullUser.password = hashPassword(fullUser.password);
      }
    } catch {}

    users.push(fullUser);
    this.saveUsers(users);
    return { success: true, user: fullUser, message: 'Registrasi berhasil' };
  }

  loanDemoUnit(itemId: string, param2: any, param3?: any, param4?: any, param5?: any, param6?: any): { success: boolean; item?: InventoryItem; message?: string } {
    const it = this.getItems().find(i => i.id === itemId);
    if (!it) return { success: false, message: 'Barang tidak ditemukan' };

    let customer = '';
    let borrower = '';
    let returnDate = '';
    let notes = '';
    let user: User | undefined;

    if (typeof param2 === 'object' && param2 !== null) {
      customer = param2.customerName || param2.customer || '';
      borrower = param2.borrowerName || param2.pic || '';
      returnDate = param2.expectedReturnDate || param2.returnDate || '';
      notes = param2.notes || param2.purpose || '';
      user = param3;
    } else {
      customer = param2 || '';
      borrower = param3 || '';
      returnDate = param4 || '';
      notes = param5 || '';
      user = param6;
    }

    const updatedItem: InventoryItem = {
      ...it,
      status: 'on_demo',
      location: `Customer: ${customer}`,
      pic: borrower,
      demoLoanInfo: {
        customerName: customer,
        borrowerName: borrower,
        borrowerContact: (param2 as any)?.borrowerContact || '',
        borrowerDepartment: (param2 as any)?.borrowerDepartment,
        loanDate: new Date().toISOString(),
        expectedReturnDate: returnDate,
        purpose: notes || 'POC Demo',
        active: true,
        notes,
        loanedBy: user?.name || borrower
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || borrower
    };

    this.saveItem(updatedItem);

    this.addTransaction({
      transactionNumber: `DO-DEMO-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      type: 'Demo Out',
      itemId: it.id,
      itemSku: it.sku,
      serialNumber: it.serialNumber,
      itemName: it.name,
      fromLocation: it.location,
      toLocation: `Customer: ${customer}`,
      quantity: 1,
      pic: borrower,
      status: 'On Demo',
      notes: notes || 'Demo peminjaman printer'
    });
    return { success: true, item: updatedItem, message: 'Peminjaman demo berhasil dicatat' };
  }

  returnDemoUnitToWarehouse(itemId: string, param2?: any, param3?: any, param4?: any): { success: boolean; item?: InventoryItem; message?: string } {
    const it = this.getItems().find(i => i.id === itemId);
    if (!it) return { success: false, message: 'Barang tidak ditemukan' };
    const prevLoc = it.location;

    let returnNotes = '';
    let condition = 'bagus';
    let user: User | undefined;

    if (typeof param2 === 'object' && param2 !== null) {
      returnNotes = param2.damageNotes || param2.notes || '';
      condition = param2.condition || 'bagus';
      user = param3;
    } else {
      returnNotes = param2 || '';
      condition = param3 || 'bagus';
      user = param4;
    }

    const updatedItem: InventoryItem = {
      ...it,
      status: 'tersedia',
      condition: condition as any,
      location: 'Gudang Utama Jakarta - Rak A01',
      pic: user?.name || 'Admin',
      demoLoanInfo: undefined,
      notes: returnNotes || it.notes,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || 'Admin'
    };

    this.saveItem(updatedItem);

    this.addTransaction({
      transactionNumber: `DI-DEMO-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      type: 'Demo In',
      itemId: it.id,
      itemSku: it.sku,
      serialNumber: it.serialNumber,
      itemName: it.name,
      fromLocation: prevLoc,
      toLocation: 'Gudang Utama Jakarta - Rak A01',
      quantity: 1,
      pic: user?.name || 'Admin',
      status: 'Selesai',
      notes: returnNotes || 'Unit demo kembali ke gudang'
    });
    return { success: true, item: updatedItem, message: 'Pengembalian unit berhasil' };
  }

  updateItemStatusAndNotes(itemId: string, status: string, notes?: string, condition?: any, user?: User): boolean {
    const it = this.getItems().find(i => i.id === itemId);
    if (!it) return false;
    this.saveItem({
      ...it,
      status: status as any,
      condition: (typeof condition === 'string' ? condition : it.condition) as any,
      notes: notes !== undefined ? notes : it.notes,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || 'Admin'
    });
    return true;
  }

  recordInbound(itemOrId: InventoryItem | string, qty: number, locOrRef?: string, picOrPartner?: string, notes?: string, user?: User, ...args: any[]): { success: boolean; item?: InventoryItem; message?: string } {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const actor = user || { id: 'u1', username: 'pic', name: picOrPartner || 'Staff', role: 'staff' };
    const warehouse = typeof locOrRef === 'string' && locOrRef ? locOrRef : undefined;
    this.adjustItemStock(id, qty, 'Masuk', notes || 'Penerimaan Inbound', actor, warehouse);
    const updated = this.getItems().find(i => i.id === id);
    return { success: true, item: updated, message: `Berhasil menambah +${qty} unit stok` };
  }

  recordOutbound(itemOrId: InventoryItem | string, qty: number, locOrRef?: string, picOrPartner?: string, notes?: string, user?: User, ...args: any[]): { success: boolean; item?: InventoryItem; message?: string } {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const actor = user || { id: 'u1', username: 'pic', name: picOrPartner || 'Staff', role: 'staff' };
    const warehouse = typeof locOrRef === 'string' && locOrRef ? locOrRef : undefined;
    this.adjustItemStock(id, -qty, 'Keluar', notes || 'Pengeluaran Outbound', actor, warehouse);
    const updated = this.getItems().find(i => i.id === id);
    return { success: true, item: updated, message: `Berhasil mengeluarkan ${qty} unit stok` };
  }

  recordStockMutationAudit({
    itemId,
    itemName,
    itemSku,
    type,
    delta,
    previousQty,
    newQty,
    user,
    reason,
    source = 'inventory'
  }: {
    itemId: string;
    itemName: string;
    itemSku?: string;
    type: string;
    delta: number;
    previousQty: number;
    newQty: number;
    user?: User | string;
    reason?: string;
    source?: string;
  }): void {
    const normalizedUser = typeof user === 'string' ? { id: user, name: user, role: 'staff' as const } : user;
    const userName = normalizedUser?.name || 'System';
    const userId = normalizedUser?.id || 'system';
    const userRole = normalizedUser?.role || 'system';
    const detail = `${itemName}${itemSku ? ` (${itemSku})` : ''} berubah ${delta > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(delta)} unit, dari ${previousQty} menjadi ${newQty}${reason ? `. ${reason}` : ''}`;

    this.addAuditLog({
      action: type,
      module: source,
      category: 'inventory',
      details: detail,
      user: normalizedUser || 'system',
      itemId,
      itemName,
      itemSku
    });
  }

  addAuditLog(args: {
    action: string;
    module?: string;
    details: string;
    user?: User | string;
    category?: AuditLog['category'];
    itemId?: string;
    itemName?: string;
    itemSku?: string;
  } | string, module?: string, details?: string, user?: User | string): void {
    let payload: {
      action: string;
      module?: string;
      details: string;
      user?: User | string;
      category?: AuditLog['category'];
    };

    if (typeof args === 'string') {
      payload = {
        action: args,
        module,
        details: details || '',
        user,
        category: 'system'
      };
    } else {
      payload = args;
    }

    const logs = this.getAuditLogs();
    const normalizedUser = typeof payload.user === 'string' ? { id: payload.user, name: payload.user, role: 'staff' as const } : payload.user;
    const userName = normalizedUser?.name || 'System';
    const userId = normalizedUser?.id || 'system';
    const userRole = normalizedUser?.role || 'system';
    const safeModule = payload.module || 'system';
    const safeCategory = payload.category || (safeModule === 'inventory' ? 'inventory' : 'system');

    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action: payload.action,
      module: safeModule,
      category: safeCategory,
      details: payload.details,
      ipAddress: '192.168.1.10'
    });

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
  }

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}

export const storageService = new StorageService();
