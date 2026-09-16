import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import { exportService } from '../src/services/exportService';

describe('demo receipt export', () => {
  let saveSpy: ReturnType<typeof mock.fn>;
  let openSpy: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    saveSpy = mock.fn();
    openSpy = mock.fn();

    Object.defineProperty(jsPDF.prototype, 'save', {
      get() {
        return saveSpy;
      },
      set(_val) {
        // intercept instance assignment
      },
      configurable: true
    });

    Object.defineProperty(globalThis, 'window', {
      value: { open: openSpy },
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  it('does not auto-save or auto-print when manual export is requested', () => {
    exportService.exportDemoLoanReceiptPDF(
      {
        id: 'u1',
        sku: 'SKU-01',
        serialNumber: 'SN-001',
        name: 'Demo Printer',
        category: 'Printer',
        brand: 'RIS',
        quantity: 1,
        minStock: 0,
        unit: 'Unit',
        price: 0,
        location: 'Gudang Demo',
        status: 'tersedia',
        condition: 'bagus',
        notes: '',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Admin'
      } as any,
      {
        customerName: 'PT. Mandiri',
        borrowerName: 'Budi',
        companyName: 'PT. Mandiri',
        borrowerContact: '0812',
        contactEmail: 'budi@mandiri.co',
        purpose: 'POC Demo',
        loanDate: new Date().toISOString(),
        expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
        quantity: 1,
        outgoingDocumentNumber: 'SK-001'
      },
      { companyName: 'PT. Reycom Integrated Solusi' } as any,
      { autoSave: false, autoPrint: false }
    );

    assert.equal(saveSpy.mock.calls.length, 0);
    assert.equal(openSpy.mock.calls.length, 0);
  });

  it('saves file when autoSave is true', () => {
    const result = exportService.exportDemoLoanReceiptPDF(
      {
        id: 'u1',
        sku: 'SKU-01',
        serialNumber: 'SN-001',
        name: 'Demo Printer',
        category: 'Printer',
        brand: 'RIS',
        quantity: 1,
        minStock: 0,
        unit: 'Unit',
        price: 0,
        location: 'Gudang Demo',
        status: 'tersedia',
        condition: 'bagus',
        notes: 'Unit dalam kondisi prima',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Admin'
      } as any,
      {
        customerName: 'PT. Bank Central Asia',
        borrowerName: 'Agus',
        companyName: 'PT. Bank Central Asia',
        borrowerContact: '0812345678',
        contactEmail: 'agus@bca.co.id',
        purpose: 'POC Demo',
        accessoriesNotes: 'Box, Kabel Power, Adaptor',
        loanDate: '2026-09-16T10:00:00.000Z',
        expectedReturnDate: '2026-09-30T10:00:00.000Z',
        quantity: 1,
        outgoingDocumentNumber: 'SK-2026-001'
      },
      { companyName: 'PT. Reycom Integrated Solusi' } as any,
      { autoSave: true, autoPrint: false }
    );

    assert.equal(result.fileName, 'Surat_Peminjaman_Demo_SK-2026-001.pdf');
    assert.equal(result.autoSave, true);
    assert.ok(result.output);
  });
});
