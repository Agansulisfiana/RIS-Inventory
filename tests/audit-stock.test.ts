import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../src/services/storage';

const makeLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

describe('stock audit trail', () => {
  beforeEach(() => {
    const mockStorage = makeLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true
    });
    storageService.resetToDefaultData();
  });

  it('records every stock mutation as a full audit log with category and change details', () => {
    storageService.recordStockMutationAudit({
      itemId: 'item-1',
      itemName: 'Printer A',
      itemSku: 'PR-001',
      type: 'Masuk',
      delta: 5,
      previousQty: 10,
      newQty: 15,
      user: { id: 'u-1', name: 'Admin', role: 'admin' }
    });

    const logs = storageService.getAuditLogs();
    assert.ok(logs.length > 0, 'audit log should be recorded');
    assert.equal(logs[0].category, 'inventory');
    assert.ok(logs[0].details.includes('Printer A'));
    assert.ok(logs[0].details.includes('5'));
    assert.equal(logs[0].action, 'Masuk');
  });
});
