import { Product } from './db';

const ADDED_KEY = 'the_real_shoes_added_products';
const DELETED_KEY = 'the_real_shoes_deleted_product_ids';

// Clear legacy localStorage cache keys so browser storage never overrides DB
export function purgeLegacyClientCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADDED_KEY);
    localStorage.removeItem(DELETED_KEY);
  } catch (e) {
    // Ignore storage errors
  }
}

export function getLocalAddedProducts(): Product[] {
  return [];
}

export function getLocalDeletedProductIds(): string[] {
  return [];
}

export function addLocalAddedProduct(product: Product): void {
  // Database is single source of truth; no-op for local storage overrides
}

export function removeLocalAddedProduct(productIdOrName: string): void {
  // Database is single source of truth; no-op for local storage overrides
}

export function getMergedClientProducts(fetchedProducts: Product[] = [], initialProducts: Product[] = []): Product[] {
  // Purge any lingering stale localStorage cache on client execution
  purgeLegacyClientCache();

  const mergedMap = new Map<string, Product>();

  // Database is single source of truth: prefer fresh API fetched products, fallback to initial server products
  const sourceList = (fetchedProducts && fetchedProducts.length > 0) ? fetchedProducts : (initialProducts || []);

  (sourceList || []).forEach((p) => {
    if (p && p.id && p.status !== 'ARCHIVED') {
      mergedMap.set(p.id, p);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });
}
