import { InventoryItem } from '../types';

export type InventoryStockState = {
  isDemo: boolean;
  demoQuantity: number;
  readyQuantity: number;
  catalogStatus: 'tersedia' | 'kosong' | 'service' | 'rusak' | 'hilang' | 'lainnya';
};

export type ProductStockSummary = InventoryStockState & {
  totalQuantity: number;
};

export const getInventoryStockState = (item: Pick<InventoryItem, 'quantity' | 'status' | 'demoLoanInfo'>): InventoryStockState => {
  const demoActive = item.status === 'on_demo' || item.status === 'demo_loaned' || Boolean(item.demoLoanInfo?.active);
  // The master quantity remains the physical total; only the checkout quantity
  // is deducted from stock ready for sale/use.
  const requestedDemoQuantity = item.demoLoanInfo?.quantity ?? 1;
  const demoQuantity = demoActive ? Math.min(Math.max(0, requestedDemoQuantity), Math.max(0, item.quantity)) : 0;
  const readyQuantity = Math.max(0, item.quantity - demoQuantity);

  let catalogStatus: InventoryStockState['catalogStatus'] = 'tersedia';
  if (item.quantity <= 0) {
    catalogStatus = 'kosong';
  } else if (item.status === 'service') {
    catalogStatus = 'service';
  } else if (item.status === 'rusak' || item.status === 'hilang') {
    catalogStatus = item.status;
  } else if (item.status === 'tersedia' || item.status === 'in_warehouse' || item.status === 'lainnya') {
    catalogStatus = item.status === 'in_warehouse' ? 'tersedia' : item.status;
  }

  return {
    isDemo: demoActive,
    demoQuantity,
    readyQuantity,
    catalogStatus
  };
};

/** 
 * Returns true if an item can be selected for demo unit checkout.
 * Products can ONLY be selected for demo if they have ready stock available (readyQuantity > 0)
 * and are not blocked by service/repair/damaged statuses.
 */
export const canSelectForDemo = (item: Pick<InventoryItem, 'quantity' | 'status' | 'demoLoanInfo'>): boolean => {
  if (!item) return false;
  const stock = getInventoryStockState(item);
  if (stock.readyQuantity <= 0) return false;

  const blockedStatuses = ['service', 'rusak', 'hilang', 'maintenance', 'broken', 'repair'];
  if (blockedStatuses.includes(item.status)) return false;

  return true;
};

export const getProductStockSummary = (items: InventoryItem[], item: InventoryItem): ProductStockSummary => {
  const skuItems = items.filter(candidate => candidate.sku === item.sku);
  const relatedItems = skuItems.length > 0 ? skuItems : [item];
  const isDemo = (candidate: InventoryItem) =>
    candidate.status === 'on_demo' || candidate.status === 'demo_loaned' || Boolean(candidate.demoLoanInfo?.active);
  const demoItems = relatedItems.filter(isDemo);
  const totalQuantity = Math.max(...relatedItems.map(candidate => Math.max(0, candidate.quantity)));
  const demoQuantity = demoItems.reduce((total, candidate) => total + getInventoryStockState(candidate).demoQuantity, 0);

  return {
    ...getInventoryStockState(item),
    totalQuantity,
    demoQuantity,
    readyQuantity: Math.max(0, totalQuantity - demoQuantity)
  };
};
