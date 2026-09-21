import { InventoryItem, SnTrackingType } from '../types';

/**
 * Resolves the Serial Number Tracking Type for an inventory item.
 * - 'unique_per_unit': Each unit has a unique individual Serial Number (e.g. Card Printers, Scanners, Hardware).
 * - 'shared_batch': 1 Serial Number or Lot/Batch number is shared across all units (e.g. Consumables, Ribbons, Cleaning Kits).
 * - 'no_sn': Product does not use Serial Numbers.
 */
export function resolveSnTrackingType(item: Partial<InventoryItem>): SnTrackingType {
  if (item.snTrackingType) {
    return item.snTrackingType;
  }

  const cat = (item.category || '').toLowerCase();
  const unit = (item.unit || '').toLowerCase();
  const sn = (item.serialNumber || '').trim().toUpperCase();

  if (sn === '-' || sn === 'NON-SN' || sn === 'NO-SN' || sn === 'N/A' || cat.includes('jasa') || cat.includes('service')) {
    return 'no_sn';
  }

  if (
    cat.includes('ribbon') || 
    cat.includes('consumable') || 
    cat.includes('cleaning') || 
    cat.includes('card') || 
    cat.includes('film') ||
    cat.includes('bahan') ||
    unit === 'roll' ||
    unit === 'box' ||
    unit === 'pack' ||
    unit === 'rim' ||
    unit === 'set'
  ) {
    return 'shared_batch';
  }

  return 'unique_per_unit';
}

/**
 * Splits comma, newline, semicolon separated string into a trimmed, non-empty array of serial numbers.
 */
export function normalizeSerialNumberList(input: string | string[] | undefined | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(s => String(s).trim()).filter(Boolean);
  }
  return String(input)
    .split(/[\r\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Generates an array of sequential serial numbers based on a base template or SKU.
 */
export function generateSequentialSerialNumbers(baseSn: string, count: number, skuFallback = 'SN'): string[] {
  const result: string[] = [];
  const cleanBase = (baseSn || '').trim() || `${skuFallback}-001`;
  const match = cleanBase.match(/^(.*?)(\d+)$/);

  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const startNum = parseInt(numStr, 10);
    const padLen = numStr.length;

    for (let i = 0; i < count; i++) {
      const curNum = startNum + i;
      result.push(`${prefix}${String(curNum).padStart(padLen, '0')}`);
    }
  } else {
    for (let i = 1; i <= count; i++) {
      result.push(`${cleanBase}-${String(i).padStart(3, '0')}`);
    }
  }
  return result;
}

/**
 * Retrieves all registered serial numbers for an item.
 * If the item has unique_per_unit tracking but its serialNumbers array is missing or shorter than quantity,
 * it deterministically generates the expected unique serial numbers from its serialNumber/SKU.
 */
export function getRegisteredSerialNumbers(item: InventoryItem): string[] {
  const tracking = resolveSnTrackingType(item);

  if (tracking === 'no_sn') {
    return [];
  }

  if (tracking === 'shared_batch') {
    const shared = item.batchNumber || item.serialNumber || 'LOT-DEFAULT';
    return [shared];
  }

  // unique_per_unit
  const existing = Array.isArray(item.serialNumbers)
    ? item.serialNumbers.map(s => String(s).trim()).filter(Boolean)
    : [];

  const targetQty = Math.max(0, item.quantity || 0);

  if (existing.length >= targetQty && existing.length > 0) {
    return existing;
  }

  // If fewer or none, generate starting from item.serialNumber or SKU
  const base = existing[0] || item.serialNumber || `SN-${item.sku || 'ITEM'}-001`;
  const generated = generateSequentialSerialNumbers(base, targetQty, item.sku);

  // Combine existing with newly generated ones for the remainder
  const combined: string[] = [];
  for (let i = 0; i < targetQty; i++) {
    if (i < existing.length && existing[i]) {
      combined.push(existing[i]);
    } else {
      combined.push(generated[i] || `${base}-${i + 1}`);
    }
  }

  return combined;
}

/**
 * Retrieves the available (in-stock, not currently on active demo loan) serial numbers for an item.
 */
export function getAvailableItemSerialNumbers(
  item: InventoryItem, 
  allItems?: InventoryItem[]
): string[] {
  const tracking = resolveSnTrackingType(item);

  if (tracking === 'no_sn') {
    return [];
  }

  if (tracking === 'shared_batch') {
    const shared = item.batchNumber || item.serialNumber || 'LOT-DEFAULT';
    return [shared];
  }

  // unique_per_unit: get all registered serial numbers
  const allSns = getRegisteredSerialNumbers(item);

  // Collect busy SNs on demo loans
  const busySns = new Set<string>();

  // Check this item's demoLoanInfo
  if (item.demoLoanInfo?.active) {
    const loaned = normalizeSerialNumberList(item.demoLoanInfo.serialNumbers || item.demoLoanInfo.serialNumber);
    loaned.forEach(sn => busySns.add(sn.toLowerCase()));
  }

  // If allItems provided, also check if any other item with same SKU or ID is on demo
  if (allItems && Array.isArray(allItems)) {
    allItems.forEach(other => {
      if (other.sku === item.sku && other.demoLoanInfo?.active) {
        const loaned = normalizeSerialNumberList(other.demoLoanInfo.serialNumbers || other.demoLoanInfo.serialNumber);
        loaned.forEach(sn => busySns.add(sn.toLowerCase()));
      }
    });
  }

  const available = allSns.filter(sn => !busySns.has(sn.toLowerCase()));
  return available;
}

/**
 * Formats a list of serial numbers into a human-readable string.
 */
export function formatSnDisplay(sns: string | string[] | undefined | null, maxPreview = 3): string {
  const list = normalizeSerialNumberList(sns);
  if (list.length === 0) return '-';
  if (list.length <= maxPreview) {
    return list.join(', ');
  }
  const shown = list.slice(0, maxPreview).join(', ');
  const remaining = list.length - maxPreview;
  return `${shown} (+${remaining} lainnya)`;
}
