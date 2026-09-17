import test from 'node:test';
import assert from 'node:assert/strict';
import { canSelectForDemo, getInventoryStockState, getProductStockSummary } from '../src/utils/inventoryStock';

test('a demo checkout reduces ready stock by one unit', () => {
  const state = getInventoryStockState({
    quantity: 15,
    status: 'on_demo',
    demoLoanInfo: { active: true }
  } as any);

  assert.equal(state.catalogStatus, 'tersedia');
  assert.equal(state.readyQuantity, 14);
  assert.equal(state.demoQuantity, 1);
});

test('SKU balance shows 13 ready when two of 15 units are in demo', () => {
  const items = [
    { id: 'master', sku: 'PRINTER-01', quantity: 15, status: 'tersedia', demoLoanInfo: undefined },
    { id: 'demo-1', sku: 'PRINTER-01', quantity: 1, status: 'on_demo', demoLoanInfo: { active: true } },
    { id: 'demo-2', sku: 'PRINTER-01', quantity: 1, status: 'on_demo', demoLoanInfo: { active: true } }
  ] as any;

  const state = getProductStockSummary(items, items[0]);
  assert.equal(state.totalQuantity, 15);
  assert.equal(state.demoQuantity, 2);
  assert.equal(state.readyQuantity, 13);
});

test('checkout quantity of two reduces a 15-unit product to 13 ready', () => {
  const item = {
    id: 'master',
    sku: 'PRINTER-01',
    quantity: 15,
    status: 'tersedia',
    demoLoanInfo: { active: true, quantity: 2 }
  } as any;

  const state = getProductStockSummary([item], item);
  assert.equal(state.demoQuantity, 2);
  assert.equal(state.readyQuantity, 13);
});

test('partially loaned demo stock remains selectable until quantity is exhausted', () => {
  const item = {
    quantity: 3,
    status: 'on_demo',
    demoLoanInfo: { active: true, quantity: 2 }
  } as any;

  assert.equal(getInventoryStockState(item).readyQuantity, 1);
  assert.equal(canSelectForDemo(item), true);
});

test('fully loaned out product is no longer selectable', () => {
  const item = {
    quantity: 2,
    status: 'demo_loaned',
    demoLoanInfo: { active: true, quantity: 2 }
  } as any;

  assert.equal(getInventoryStockState(item).readyQuantity, 0);
  assert.equal(canSelectForDemo(item), false);
});

test('catalog status changes only when stock is empty', () => {
  const state = getInventoryStockState({
    quantity: 0,
    status: 'tersedia',
    demoLoanInfo: undefined
  } as any);

  assert.equal(state.catalogStatus, 'kosong');
  assert.equal(state.readyQuantity, 0);
  assert.equal(state.demoQuantity, 0);
});
