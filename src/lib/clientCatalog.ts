import { Product } from './db';

const RECENTLY_ADDED_KEY = 'the_real_recent_added_prods_v2';

// Clear legacy localStorage cache keys so browser storage never overrides DB
export function purgeLegacyClientCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('the_real_shoes_added_products');
    localStorage.removeItem('the_real_shoes_deleted_product_ids');
  } catch (e) {
    // Ignore storage errors
  }
}

export function getLocalAddedProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_ADDED_KEY);
    if (!raw) return [];
    const list: Product[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function addLocalAddedProduct(product: Product): void {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    const list = getLocalAddedProducts();
    const existingIdx = list.findIndex(p => p.id === product.id);
    if (existingIdx > -1) {
      list[existingIdx] = product;
    } else {
      list.unshift(product);
    }
    // Keep max 20 recent additions
    localStorage.setItem(RECENTLY_ADDED_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}

export function removeLocalAddedProduct(productIdOrName: string): void {
  if (typeof window === 'undefined' || !productIdOrName) return;
  try {
    const list = getLocalAddedProducts();
    const cleanTarget = productIdOrName.trim().toLowerCase();
    const updated = list.filter(
      p => p.id !== productIdOrName && p.id.toLowerCase() !== cleanTarget && (p.name || '').toLowerCase().trim() !== cleanTarget
    );
    localStorage.setItem(RECENTLY_ADDED_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function getMergedClientProducts(
  fetchedProducts: Product[] = [],
  currentProducts: Product[] = [],
  initialProducts: Product[] = []
): Product[] {
  purgeLegacyClientCache();

  const mergedMap = new Map<string, Product>();

  // 1. Initial products from SSR/server
  (initialProducts || []).forEach((p) => {
    if (p && p.id && p.status !== 'ARCHIVED') {
      mergedMap.set(p.id, p);
    }
  });

  // 2. Fresh API fetched products (higher priority)
  (fetchedProducts || []).forEach((p) => {
    if (p && p.id && p.status !== 'ARCHIVED') {
      mergedMap.set(p.id, p);
    }
  });

  // 3. Current active products in React state (preserves newly created items across polling ticks)
  (currentProducts || []).forEach((p) => {
    if (p && p.id && !mergedMap.has(p.id) && (!p.status || p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK')) {
      mergedMap.set(p.id, p);
    }
  });

  // 4. Client recently added fallback (persists product across full browser refresh if serverless deployment is pending)
  const localRecent = getLocalAddedProducts();
  localRecent.forEach((p) => {
    if (p && p.id && !mergedMap.has(p.id) && (!p.status || p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK')) {
      mergedMap.set(p.id, p);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });
}
