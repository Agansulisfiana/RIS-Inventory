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

describe('permission checks in storageService', () => {
  beforeEach(() => {
    const mockStorage = makeLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true
    });
    storageService.resetToDefaultData();
  });

  it('denies edit product without permission', () => {
    const user = { id: 'u-guest', name: 'Guest', role: 'sales' } as any;
    let threw = false;
    try {
      storageService.addItem({ sku: 'x', serialNumber: 's', barcode: 'b', name: 'X', category: 'Lainnya', brand: 'X', quantity: 1, minStock: 0, unit: 'Unit', price: 0, location: 'Gudang', status: 'tersedia', condition: 'baru', notes: '', updatedBy: 'Guest' }, user);
    } catch (e: any) {
      threw = true;
    }
    assert.ok(threw, 'sales user should not be allowed to add product');
  });
});
