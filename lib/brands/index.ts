/**
 * Brand Management
 *
 * Handles built-in and custom brand configurations.
 */

import type { BrandConfig } from '../types';
import { aigneBrand } from './aigne';
import { myvibeBrand } from './myvibe';
import { arcsphereBrand } from './arcsphere';
import { arcblockBrand } from './arcblock';
import { defaultBrand } from './default';

// Built-in brands (products)
const BUILT_IN_BRANDS: Record<string, BrandConfig> = {
  default: defaultBrand,
  'aigne-hub': aigneBrand,
  myvibe: myvibeBrand,
  arcsphere: arcsphereBrand,
  arcblock: arcblockBrand,
};

// Custom brands storage (in production, this would be persisted to database)
let customBrands: Record<string, BrandConfig> = {};

/**
 * Get a brand by ID
 */
export function getBrand(id: string): BrandConfig | undefined {
  // Check custom brands first (allows overriding built-in)
  if (customBrands[id]) {
    return customBrands[id];
  }
  return BUILT_IN_BRANDS[id];
}

/**
 * List all brands
 */
export function listBrands(): BrandConfig[] {
  const allBrands = { ...BUILT_IN_BRANDS, ...customBrands };
  return Object.values(allBrands);
}

/**
 * Save a custom brand
 */
export async function saveBrand(brand: BrandConfig): Promise<BrandConfig> {
  if (!brand.id) {
    throw new Error('Brand ID is required');
  }
  if (!brand.name) {
    throw new Error('Brand name is required');
  }

  // Mark as custom
  brand.isCustom = true;

  // Merge with defaults for any missing fields
  const merged: BrandConfig = {
    ...defaultBrand,
    ...brand,
    colors: { ...defaultBrand.colors, ...brand.colors },
    typography: { ...defaultBrand.typography, ...brand.typography },
    voice: { ...defaultBrand.voice, ...brand.voice },
    links: { ...defaultBrand.links, ...brand.links },
  };

  customBrands[brand.id] = merged;

  // TODO: Persist to database
  return merged;
}

/**
 * Delete a custom brand
 */
export async function deleteBrand(id: string): Promise<void> {
  if (BUILT_IN_BRANDS[id] && !customBrands[id]) {
    throw new Error('Cannot delete built-in brand');
  }
  delete customBrands[id];
  // TODO: Remove from database
}

// Re-export individual brands
export { aigneBrand } from './aigne';
export { myvibeBrand } from './myvibe';
export { arcsphereBrand } from './arcsphere';
export { arcblockBrand } from './arcblock';
export { defaultBrand } from './default';
