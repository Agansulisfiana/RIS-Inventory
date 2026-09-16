import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, StockTransaction, AuditLog, WarehouseSettings, ServiceTicket, StockOpnameSession } from '../types';
import { getInventoryStockState } from '../utils/inventoryStock';

export const exportService = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  },

  formatDate(isoString: string): string {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  },

  exportInventoryToExcel(items: InventoryItem[], settings?: WarehouseSettings) {
    const data = items.map((item, idx) => {
      const st = getInventoryStockState(item);
      return ({
      'No': idx + 1,
      'SKU': item.sku,
      'Serial Number': item.serialNumber,
      'Nama Barang': item.name,
      'Kategori': item.category,
      'Brand': item.brand,
      'Stok Sistem': item.quantity,
      'Stok Ready': st.readyQuantity,
      'Stok Demo': st.demoQuantity,
      'Min Stock': item.minStock,
      'Harga Satuan (IDR)': item.price,
      'Total Nilai (IDR)': item.quantity * item.price,
      'Lokasi Rak': item.location,
      'Status': item.status,
      'Kondisi': item.condition?.toUpperCase() || 'BAGUS',
      'Keterangan': item.notes || '-',
      'Customer Demo': item.demoLoanInfo?.active ? item.demoLoanInfo.customerName : '-',
      'Tgl Batas Kembali': item.demoLoanInfo?.active ? this.formatDate(item.demoLoanInfo.expectedReturnDate) : '-',
      'Terakhir Diperbarui': this.formatDate(item.lastUpdated),
      'Diperbarui Oleh': item.updatedBy
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok_Gudang');

    const fileName = `Laporan_Stok_Gudang_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportTransactionsToExcel(transactions: StockTransaction[], settings?: WarehouseSettings) {
    const data = transactions.map((trx, idx) => ({
      'No': idx + 1,
      'Waktu': this.formatDate(trx.timestamp),
      'No. Transaksi': trx.transactionNumber || '-',
      'Tipe Mutasi': trx.type,
      'SKU / SN': trx.serialNumber || trx.itemSku || '-',
      'Nama Barang': trx.itemName,
      'Jumlah': trx.quantity,
      'Dari Lokasi': trx.fromLocation,
      'Ke Lokasi': trx.toLocation,
      'PIC': trx.pic,
      'Status': trx.status,
      'Keterangan': trx.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mutasi_Stok');

    const fileName = `Laporan_Mutasi_Stok_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportDemoUnitsToExcel(items: InventoryItem[], settings?: WarehouseSettings) {
    const demoItems = items.filter(i => i.status === 'on_demo' || (i.demoLoanInfo && i.demoLoanInfo.active));
    const data = demoItems.map((item, idx) => ({
      'No': idx + 1,
      'Nama Unit Demo': item.name,
      'Serial Number': item.serialNumber,
      'Customer / Instansi': item.demoLoanInfo?.customerName || item.location,
      'Sales PIC': item.demoLoanInfo?.borrowerName || item.pic,
      'Tgl Pinjam': item.demoLoanInfo?.loanDate ? this.formatDate(item.demoLoanInfo.loanDate) : '-',
      'Tgl Estimasi Kembali': item.demoLoanInfo?.expectedReturnDate ? this.formatDate(item.demoLoanInfo.expectedReturnDate) : '-',
      'Tujuan': item.demoLoanInfo?.purpose || 'POC Demo',
      'Catatan': item.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peminjaman_Demo');

    const fileName = `Laporan_Unit_Demo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportServiceTicketsToExcel(tickets: ServiceTicket[], settings?: WarehouseSettings) {
    const data = tickets.map((ticket, idx) => ({
      'No': idx + 1,
      'No. Tiket': ticket.ticketNumber,
      'Nama Item': ticket.itemName,
      'Serial Number': ticket.serialNumber,
      'Customer': ticket.customerName || '-',
      'Masalah': ticket.problem,
      'Teknisi': ticket.technician,
      'Tanggal Masuk': this.formatDate(ticket.entryDate),
      'Estimasi Selesai': this.formatDate(ticket.estimatedCompletion),
      'Status': ticket.status,
      'Biaya': ticket.costTotal || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service');

    const fileName = `Laporan_Service_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportStockOpnameToExcel(sessions: StockOpnameSession[], settings?: WarehouseSettings) {
    const data = sessions.flatMap((session) => session.items.map((row, idx) => ({
      'No. SO': session.soNumber,
      'Gudang': session.warehouse,
      'Lokasi': session.location,
      'Tanggal': this.formatDate(session.date),
      'PIC': session.pic,
      'Produk': row.productName,
      'System Qty': row.systemQty,
      'Fisik Qty': row.physicalQty,
      'Selisih': row.difference,
      'Kondisi': row.condition,
      'Catatan': row.notes || '-'
    }))); 

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Opname');

    const fileName = `Laporan_Stock_Opname_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportDemoUnitsToPDF(items: InventoryItem[], settings?: WarehouseSettings) {
    const doc = new jsPDF('landscape');
    const demoItems = items.filter(i => i.status === 'on_demo' || (i.demoLoanInfo && i.demoLoanInfo.active));

    doc.setFontSize(14);
    doc.text(`LAPORAN PINJAMAN UNIT DEMO (POC) - ${settings?.companyName || 'PT. Reycom Integrated Solusi'}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak: ${this.formatDate(new Date().toISOString())}`, 14, 22);

    const tableData = demoItems.map((item, idx) => [
      idx + 1,
      item.name || '-',
      item.serialNumber || '-',
      item.demoLoanInfo?.customerName || item.location || '-',
      item.demoLoanInfo?.borrowerName || item.pic || '-',
      item.demoLoanInfo?.loanDate ? new Date(item.demoLoanInfo.loanDate).toLocaleDateString('id-ID') : '-',
      item.demoLoanInfo?.expectedReturnDate ? new Date(item.demoLoanInfo.expectedReturnDate).toLocaleDateString('id-ID') : '-'
    ]);

    const safeDemoTableData = tableData.map(row => row.map(cell => (cell === undefined || cell === null) ? '' : cell));

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Unit Printer', 'SN', 'Customer', 'PIC Sales', 'Tgl Pinjam', 'Tenggat Kembali']],
      body: safeDemoTableData as any,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`Laporan_Unit_Demo_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  exportMonthlyReportToExcel(
    monthOrItems: string | InventoryItem[],
    itemsOrTransactions?: InventoryItem[] | StockTransaction[],
    transactionsOrSettings?: StockTransaction[] | WarehouseSettings,
    maybeSettings?: WarehouseSettings
  ) {
    let month = new Date().toISOString().substring(0, 7);
    let items: InventoryItem[] = [];
    let transactions: StockTransaction[] = [];
    let settings: WarehouseSettings | undefined = maybeSettings ?? (transactionsOrSettings && typeof transactionsOrSettings === 'object' && 'companyName' in transactionsOrSettings ? transactionsOrSettings : undefined);

    if (typeof monthOrItems === 'string') {
      month = monthOrItems;
      items = Array.isArray(itemsOrTransactions) && itemsOrTransactions.every((item) => typeof item === 'object' && item !== null && ('sku' in item || 'name' in item || 'category' in item))
        ? (itemsOrTransactions as InventoryItem[]) : [];
      transactions = Array.isArray(transactionsOrSettings) && transactionsOrSettings.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? (transactionsOrSettings as StockTransaction[]) : [];
    } else {
      items = monthOrItems;
      transactions = Array.isArray(itemsOrTransactions) && itemsOrTransactions.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? (itemsOrTransactions as StockTransaction[]) : [];
      settings = Array.isArray(transactionsOrSettings) && transactionsOrSettings.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? undefined
        : (transactionsOrSettings as WarehouseSettings | undefined);
    }

    const monthItems = items.filter(item => {
      const itemTransactions = transactions.filter(trx => trx.itemId === item.id && trx.timestamp.startsWith(month));
      return itemTransactions.length > 0 || item.quantity > 0;
    });

    this.exportInventoryToExcel(monthItems.length ? monthItems : items, settings);
  },

  exportMonthlyReportToPDF(
    monthOrItems: string | InventoryItem[],
    itemsOrTransactions?: InventoryItem[] | StockTransaction[],
    transactionsOrSettings?: StockTransaction[] | WarehouseSettings,
    maybeSettings?: WarehouseSettings
  ) {
    let month = new Date().toISOString().substring(0, 7);
    let items: InventoryItem[] = [];
    let transactions: StockTransaction[] = [];
    let settings: WarehouseSettings | undefined = maybeSettings ?? (transactionsOrSettings && typeof transactionsOrSettings === 'object' && 'companyName' in transactionsOrSettings ? transactionsOrSettings : undefined);

    if (typeof monthOrItems === 'string') {
      month = monthOrItems;
      items = Array.isArray(itemsOrTransactions) && itemsOrTransactions.every((item) => typeof item === 'object' && item !== null && ('sku' in item || 'name' in item || 'category' in item))
        ? (itemsOrTransactions as InventoryItem[]) : [];
      transactions = Array.isArray(transactionsOrSettings) && transactionsOrSettings.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? (transactionsOrSettings as StockTransaction[]) : [];
    } else {
      items = monthOrItems;
      transactions = Array.isArray(itemsOrTransactions) && itemsOrTransactions.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? (itemsOrTransactions as StockTransaction[]) : [];
      settings = Array.isArray(transactionsOrSettings) && transactionsOrSettings.every((item) => typeof item === 'object' && item !== null && 'type' in item && 'timestamp' in item)
        ? undefined
        : (transactionsOrSettings as WarehouseSettings | undefined);
    }

    const monthItems = items.filter(item => {
      const itemTransactions = transactions.filter(trx => trx.itemId === item.id && trx.timestamp.startsWith(month));
      return itemTransactions.length > 0 || item.quantity > 0;
    });

    this.exportInventoryToPDF(monthItems.length ? monthItems : items, settings);
  },

  exportAuditLogsToExcel(logs: any[], settings?: WarehouseSettings) {
    const data = logs.map((log, idx) => ({
      'No': idx + 1,
      'Waktu': this.formatDate(log.timestamp),
      'User': log.userName,
      'Aksi': log.action,
      'Modul': log.module,
      'Detail': log.details,
      'IP': log.ipAddress || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Log');

    const fileName = `Audit_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportInventoryToPDF(items: InventoryItem[], settings?: WarehouseSettings) {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text(`LAPORAN STOK & ASSET - ${settings?.companyName || 'PT. Reycom Integrated Solusi'}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Lokasi: ${settings?.warehouseName || 'Gudang Jakarta'} | Dicetak: ${this.formatDate(new Date().toISOString())}`, 14, 22);

    const tableData = items.map((item, idx) => {
      const st = getInventoryStockState(item);
      return [
        idx + 1,
        item.serialNumber || item.sku || '-',
        item.name || '-',
        item.category || '-',
        `${st.readyQuantity} ready • ${st.demoQuantity} demo ${item.unit || 'Unit'}`,
        this.formatCurrency(item.price || 0),
        this.formatCurrency((item.quantity || 0) * (item.price || 0)),
        item.location || '-',
        (item.status || '-').toString().toUpperCase()
      ];
    });

    const safeTableData = tableData.map(row => row.map(cell => (cell === undefined || cell === null) ? '' : cell));

    autoTable(doc, {
      startY: 28,
      head: [['No', 'SN / SKU', 'Nama Produk', 'Kategori', 'Stok', 'Harga (IDR)', 'Total Nilai (IDR)', 'Lokasi Rak', 'Status']],
      body: safeTableData as any,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const totalVal = items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total Valuasi Aset Stok: ${this.formatCurrency(totalVal)}`, 14, finalY);

    doc.save(`Laporan_Stok_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  generateReportByType(reportType: string, items: InventoryItem[], transactions: StockTransaction[] = [], serviceTickets: ServiceTicket[] = [], settings?: WarehouseSettings) {
    switch (reportType) {
      case 'stock':
        return this.exportInventoryToExcel(items, settings);
      case 'movement':
        return this.exportTransactionsToExcel(transactions, settings);
      case 'demo':
        return this.exportDemoUnitsToExcel(items, settings);
      case 'service':
        return this.exportServiceTicketsToExcel(serviceTickets, settings);
      case 'asset':
        return this.exportInventoryToPDF(items, settings);
      default:
        return this.exportInventoryToExcel(items, settings);
    }
  }
};
