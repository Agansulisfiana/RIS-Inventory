import { InventoryItem } from '../types';

export interface ParsedSerialNumber {
  raw: string;
  prefix: string;
  num: number;
  pad: number;
}

export interface LatestSnDetection {
  lastSn: string;
  sourceItemName?: string;
  prefix: string;
  nextNum: number;
  pad: number;
  suggestedNextList: string[];
}

/**
 * Parse a serial number into prefix and numeric suffix.
 * Handles patterns like "SN-2026-0042", "IDP-001", "PRT9999", etc.
 */
export function parseSerialNumber(sn: string): ParsedSerialNumber | null {
  if (!sn) return null;
  const clean = sn.trim();
  if (!clean || clean === '-' || clean === 'NON-SN') return null;

  // Match ending digits: prefix + digits
  const match = clean.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const digitsStr = match[2];
    const num = parseInt(digitsStr, 10);
    return {
      raw: clean,
      prefix,
      num,
      pad: digitsStr.length
    };
  }

  // If no trailing digits, treat entire string as prefix
  const pfx = clean.endsWith('-') ? clean : `${clean}-`;
  return {
    raw: clean,
    prefix: pfx,
    num: 0,
    pad: 3
  };
}

/**
 * Suggest a standard prefix based on product name, category, and brand
 */
export function suggestSerialNumberPrefix(
  name?: string,
  category?: string,
  brand?: string
): string {
  const currentYear = new Date().getFullYear();
  const cleanBrand = (brand || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanCat = (category || '').trim().toUpperCase();

  if (cleanBrand.length >= 2) {
    const bCode = cleanBrand.length > 5 ? cleanBrand.substring(0, 4) : cleanBrand;
    return `${bCode}-${currentYear}-`;
  }

  if (cleanCat.includes('PRINTER')) {
    return `PRT-${currentYear}-`;
  }
  if (cleanCat.includes('SCANNER') || cleanCat.includes('BARCODE')) {
    return `SCN-${currentYear}-`;
  }
  if (cleanCat.includes('PART') || cleanCat.includes('HEAD')) {
    return `SPT-${currentYear}-`;
  }

  return `SN-${currentYear}-`;
}

/**
 * Scans existing inventory items to find the latest/highest serial number
 * matching the product, brand, category, or global database.
 */
export function findLatestSerialNumber(
  items: InventoryItem[],
  criteria?: {
    itemId?: string;
    sku?: string;
    name?: string;
    brand?: string;
    category?: string;
  },
  countNeeded: number = 1
): LatestSnDetection | null {
  if (!items || items.length === 0) return null;

  // Collect candidate SN strings with provenance
  const candidates: { sn: string; itemName: string; priority: number }[] = [];

  const targetId = criteria?.itemId?.toLowerCase();
  const targetSku = criteria?.sku?.toLowerCase().trim();
  const targetBrand = criteria?.brand?.toLowerCase().trim();
  const targetCat = criteria?.category?.toLowerCase().trim();

  items.forEach(item => {
    const itemSns: string[] = [];
    if (Array.isArray(item.serialNumbers)) {
      item.serialNumbers.forEach(s => {
        if (s && typeof s === 'string' && s.trim() && s !== '-' && s !== 'NON-SN') {
          itemSns.push(s.trim());
        }
      });
    }
    if (item.serialNumber && typeof item.serialNumber === 'string' && item.serialNumber.trim() && item.serialNumber !== '-' && item.serialNumber !== 'NON-SN') {
      if (!itemSns.includes(item.serialNumber.trim())) {
        itemSns.push(item.serialNumber.trim());
      }
    }

    if (itemSns.length === 0) return;

    let priority = 0;
    if (targetId && item.id.toLowerCase() === targetId) {
      priority = 4; // exact same item
    } else if (targetSku && item.sku && item.sku.toLowerCase().trim() === targetSku) {
      priority = 3; // exact same SKU
    } else if (targetBrand && item.brand && item.brand.toLowerCase().trim() === targetBrand) {
      priority = 2; // same brand
    } else if (targetCat && item.category && item.category.toLowerCase().trim() === targetCat) {
      priority = 1; // same category
    }

    itemSns.forEach(sn => {
      candidates.push({ sn, itemName: item.name, priority });
    });
  });

  if (candidates.length === 0) return null;

  // Sort candidates: first by priority descending, then by numeric value descending
  const parsedCandidates = candidates
    .map(c => {
      const parsed = parseSerialNumber(c.sn);
      return parsed ? { ...c, parsed } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (parsedCandidates.length === 0) return null;

  // Group by highest priority available
  const maxPriority = Math.max(...parsedCandidates.map(c => c.priority));
  const topCandidates = parsedCandidates.filter(c => c.priority === maxPriority);

  // Find candidate with highest number among top priority candidates
  topCandidates.sort((a, b) => {
    if (a.parsed.num !== b.parsed.num) {
      return b.parsed.num - a.parsed.num;
    }
    return b.sn.localeCompare(a.sn);
  });

  const best = topCandidates[0];
  const nextStart = best.parsed.num + 1;
  const pad = Math.max(best.parsed.pad, String(nextStart + countNeeded).length);

  const suggestedNextList = Array.from({ length: Math.max(1, countNeeded) }, (_, i) => {
    const n = nextStart + i;
    return `${best.parsed.prefix}${String(n).padStart(pad, '0')}`;
  });

  return {
    lastSn: best.sn,
    sourceItemName: best.itemName,
    prefix: best.parsed.prefix,
    nextNum: nextStart,
    pad,
    suggestedNextList
  };
}

/**
 * Generate serial numbers continuing from a known last SN
 */
export function generateContinuedSerialNumbers(
  lastSn: string,
  count: number
): string[] {
  const parsed = parseSerialNumber(lastSn);
  if (!parsed) {
    const pfx = lastSn.endsWith('-') ? lastSn : `${lastSn}-`;
    return Array.from({ length: count }, (_, i) => `${pfx}${String(i + 1).padStart(3, '0')}`);
  }

  const startNum = parsed.num + 1;
  const pad = Math.max(parsed.pad, String(startNum + count).length);

  return Array.from({ length: count }, (_, i) => {
    return `${parsed.prefix}${String(startNum + i).padStart(pad, '0')}`;
  });
}

/**
 * Generate brand new sequential serial numbers
 */
export function generateNewSerialNumbers(
  prefix: string,
  startNumber: number = 1,
  padLength: number = 3,
  count: number = 1
): string[] {
  const safePrefix = prefix.trim();
  const safeStart = Math.max(1, startNumber);
  const minPad = Math.max(padLength, String(safeStart + count).length);

  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const num = safeStart + i;
    return `${safePrefix}${String(num).padStart(minPad, '0')}`;
  });
}
