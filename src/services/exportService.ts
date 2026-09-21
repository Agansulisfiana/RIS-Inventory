import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, StockTransaction, AuditLog, WarehouseSettings, ServiceTicket, StockOpnameSession } from '../types';
import { getInventoryStockState } from '../utils/inventoryStock';
import { risLogoBase64 } from '../assets/risLogoBase64';

const risLogoAssetUrl = new URL('../image/logo-ris.png', import.meta.url).href;

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
      'Satuan': trx.unit || 'Unit',
      'Qty Unit': `${trx.quantity} ${trx.unit || 'Unit'}`,
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

  exportDemoLoanReceiptPDF(item: InventoryItem, loanInfo: any, settings?: WarehouseSettings, options: { autoSave?: boolean; autoPrint?: boolean } = {}) {
    const { autoSave = false, autoPrint = false } = options;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const companyName = settings?.companyName || 'PT. Reycom Integrated Solusi';
    const documentNumber = loanInfo?.outgoingDocumentNumber || loanInfo?.documentNumber || `SK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const loanDate = loanInfo?.loanDate ? new Date(loanInfo.loanDate) : new Date();
    const returnDate = loanInfo?.expectedReturnDate ? new Date(loanInfo.expectedReturnDate) : null;

    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const formatIndoDate = (d: Date | null) => {
      if (!d || isNaN(d.getTime())) return '................................';
      return `${d.getDate()} ${indonesianMonths[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatShortDate = (d: Date | null) => {
      if (!d || isNaN(d.getTime())) return '-';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const startX = 16;
    const pageWidth = 210;
    const contentWidth = 178; // 194 - 16
    const col1Width = 52;
    const col2X = startX + col1Width; // 68
    const col2Width = contentWidth - col1Width; // 126

    // --- 1. HEADER (Logo & Company Title) ---
    const logoWidth = 23;
    const logoHeight = 13;
    const logoY = 11.5;

    try {
      doc.addImage(risLogoBase64, 'PNG', startX, logoY, logoWidth, logoHeight);
    } catch {
      try {
        doc.addImage(risLogoAssetUrl, 'PNG', startX, logoY, logoWidth, logoHeight);
      } catch {
        // fallback if image cannot be rendered
        doc.setFillColor(37, 99, 235);
        doc.rect(startX, logoY, 10, 10, 'F');
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('RIS', startX + 13, logoY + 7);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(75, 85, 99);
    doc.text(companyName.toUpperCase(), startX + logoWidth + 4, logoY + 8);

    // --- 2. DOCUMENT TITLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('SURAT PEMINJAMAN UNIT DEMO', pageWidth / 2, 36, { align: 'center' });

    // --- 3. METADATA (Left) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`No Surat : ${documentNumber}`, startX, 45);
    doc.text(`Jakarta, ${formatIndoDate(loanDate)}`, startX, 50.5);

    // --- 4. SECTION TITLE: TANDA TERIMA (Underlined) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const tandaTerimaText = 'TANDA TERIMA';
    doc.text(tandaTerimaText, pageWidth / 2, 57.5, { align: 'center' });
    const ttWidth = doc.getTextWidth(tandaTerimaText);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line((pageWidth / 2) - (ttWidth / 2), 58.5, (pageWidth / 2) + (ttWidth / 2), 58.5);

    // --- 5. MAIN FORM TABLE ---
    let currentY = 62;
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);

    const drawRow = (label: string | string[], value: string, rowHeight: number, isHighlighted: boolean = false, customRenderer?: (x: number, y: number, w: number, h: number) => void) => {
      if (isHighlighted) {
        doc.setFillColor(254, 243, 214); // #FEF3C7 soft warm beige/gold
        doc.rect(startX, currentY, contentWidth, rowHeight, 'FD');
      } else {
        doc.rect(startX, currentY, contentWidth, rowHeight);
      }

      // Vertical divider
      doc.line(col2X, currentY, col2X, currentY + rowHeight);

      // Label column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      if (Array.isArray(label)) {
        if (label.length === 2) {
          doc.text(label[0], startX + 2.5, currentY + 4.2);
          doc.text(label[1], startX + 2.5, currentY + 8.2);
        } else {
          label.forEach((l, i) => doc.text(l, startX + 2.5, currentY + 4.2 + (i * 4)));
        }
      } else {
        doc.text(label, startX + 2.5, currentY + (rowHeight / 2) + 1.2);
      }

      // Value column
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (customRenderer) {
        customRenderer(col2X, currentY, col2Width, rowHeight);
      } else {
        doc.text(String(value || '-'), col2X + 2.5, currentY + (rowHeight / 2) + 1.2, { maxWidth: col2Width - 5 });
      }

      currentY += rowHeight;
    };

    // Row 1: Nama Barang
    drawRow('Nama Barang', item.name || loanInfo?.productName || '-', 7.5);

    // Row 2: Kode Barang
    drawRow('Kode Barang', item.sku || loanInfo?.productCode || '-', 7.5);

    // Row 3: Serial Number
    const rawSnList: string[] = Array.isArray(loanInfo?.serialNumbers) && loanInfo.serialNumbers.length > 0
      ? loanInfo.serialNumbers.map((s: any) => String(s).trim()).filter(Boolean)
      : (loanInfo?.serialNumber || item.serialNumber || '-').split(',').map((s: string) => s.trim()).filter(Boolean);

    const snText = rawSnList.length > 1
      ? rawSnList.map((sn, idx) => `Unit ${idx + 1}: ${sn}`).join(', ')
      : (rawSnList[0] || '-');
    const snRowHeight = rawSnList.length > 2 ? Math.max(7.5, 5.5 + Math.ceil(rawSnList.length / 2) * 3.2) : 7.5;
    drawRow('Serial Number', snText, snRowHeight);

    // Row 4: Kelengkapan / Accessories
    const accNotes = (loanInfo?.accessoriesNotes || '').toLowerCase();
    const hasBox = accNotes.includes('box') || accNotes.includes('kardus') || accNotes.includes('dus');
    const hasCable = accNotes.includes('kabel') || accNotes.includes('power') || accNotes.includes('cable');
    const hasAdaptor = accNotes.includes('adaptor') || accNotes.includes('adapter') || accNotes.includes('charger');

    drawRow(['Kelengkapan /', 'Accessories'], '', 26, false, (x, y, w, h) => {
      // Checkbox row
      const boxY = y + 2.5;
      const boxSize = 3.2;

      // 1. Box / Kardus
      doc.rect(x + 3, boxY, boxSize, boxSize);
      if (hasBox) {
        doc.setFont('helvetica', 'bold');
        doc.text('✓', x + 3.6, boxY + 2.6);
        doc.setFont('helvetica', 'normal');
      }
      doc.text('Box / Kardus', x + 8, boxY + 2.6);

      // 2. Kabel Power
      const kbX = x + 44;
      doc.rect(kbX, boxY, boxSize, boxSize);
      if (hasCable) {
        doc.setFont('helvetica', 'bold');
        doc.text('✓', kbX + 0.6, boxY + 2.6);
        doc.setFont('helvetica', 'normal');
      }
      doc.text('Kabel Power', kbX + 5, boxY + 2.6);

      // 3. Adaptor
      const adX = x + 85;
      doc.rect(adX, boxY, boxSize, boxSize);
      if (hasAdaptor) {
        doc.setFont('helvetica', 'bold');
        doc.text('✓', adX + 0.6, boxY + 2.6);
        doc.setFont('helvetica', 'normal');
      }
      doc.text('Adaptor', adX + 5, boxY + 2.6);

      // Additional accessories notes text below checkboxes
      const noteText = loanInfo?.accessoriesNotes || '';
      if (noteText) {
        doc.setFontSize(8.5);
        doc.text(noteText, x + 3, boxY + 8, { maxWidth: w - 6 });
        doc.setFontSize(9);
      }
    });

    // Row 5: Periode / Lama Waktu Peminjaman
    let periodStr = loanInfo?.loanPeriod ? `${loanInfo.loanPeriod} ` : '';
    if (loanDate && returnDate) {
      periodStr += `(${formatShortDate(loanDate)} s/d ${formatShortDate(returnDate)})`;
    } else if (returnDate) {
      periodStr += `(s/d ${formatShortDate(returnDate)})`;
    }
    drawRow(['Periode / Lama Waktu', 'Peminjaman'], periodStr || '-', 9);

    // Row 6: Tujuan / Keperluan
    drawRow('Tujuan / Keperluan', loanInfo?.purpose || 'POC Demo', 7.5);

    // Row 7: Nama Peminjam
    drawRow('Nama Peminjam', loanInfo?.borrowerName || '-', 7.5);

    // Row 8: Nama Perusahaan (Highlighted)
    drawRow('Nama Perusahaan', loanInfo?.companyName || loanInfo?.customerName || '-', 7.5, true);

    // Row 9: PIC Perusahaan (Highlighted)
    drawRow('PIC Perusahaan', loanInfo?.picReceiver || loanInfo?.borrowerName || '-', 7.5, true);

    // Row 10: No Telp & Email (Highlighted)
    const contactParts = [loanInfo?.borrowerContact, loanInfo?.contactEmail].filter(Boolean);
    drawRow('No Telp & Email', contactParts.join('  /  ') || '-', 7.5, true);

    // Row 11: Keterangan (Large Box)
    const notesHeight = 36;
    doc.rect(startX, currentY, contentWidth, notesHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Keterangan :', startX + 2.5, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const generalNotes = loanInfo?.notes || item.notes || '';
    if (generalNotes) {
      doc.text(generalNotes, startX + 2.5, currentY + 10, { maxWidth: contentWidth - 5 });
    }
    currentY += notesHeight;

    // --- 6. SIGNATURE SECTION ---
    currentY += 4;
    const sigBoxWidth = (contentWidth - 4) / 2; // 87mm each
    const sigBoxHeight = 36;
    const rightSigBoxX = startX + sigBoxWidth + 4;

    // Left Signature: Yang Menerima
    doc.rect(startX, currentY, sigBoxWidth, sigBoxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Yang Menerima,', startX + (sigBoxWidth / 2), currentY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    const receiverName = loanInfo?.borrowerName ? `(  ${loanInfo.borrowerName}  )` : '(                                                )';
    doc.text(receiverName, startX + (sigBoxWidth / 2), currentY + sigBoxHeight - 4, { align: 'center' });

    // Right Signature: Yang Menyerahkan
    doc.rect(rightSigBoxX, currentY, sigBoxWidth, sigBoxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Yang Menyerahkan,', rightSigBoxX + (sigBoxWidth / 2), currentY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    const handedByName = (loanInfo?.handedOverBy || loanInfo?.loanedBy) ? `(  ${loanInfo?.handedOverBy || loanInfo?.loanedBy}  )` : '(                                                )';
    doc.text(handedByName, rightSigBoxX + (sigBoxWidth / 2), currentY + sigBoxHeight - 4, { align: 'center' });

    const fileName = `Surat_Peminjaman_Demo_${documentNumber.replace(/[\s/\\:]+/g, '_')}.pdf`;

    if (autoSave) {
      doc.save(fileName);
    }

    if (autoPrint && typeof window !== 'undefined') {
      const pdfUrl = doc.output('bloburl');
      const previewWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      if (previewWindow) {
        previewWindow.focus();
        try {
          previewWindow.print();
        } catch {
          // no-op
        }
      }
    }

    return {
      fileName,
      autoSave,
      autoPrint,
      output: doc.output('blob')
    };
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
