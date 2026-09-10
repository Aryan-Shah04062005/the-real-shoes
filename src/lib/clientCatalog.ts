import { Product } from './db';

const ADDED_KEY = 'the_real_shoes_added_products';
const DELETED_KEY = 'the_real_shoes_deleted_product_ids';

export function getLocalAddedProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADDED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local added products:', e);
    return [];
  }
}

export function getLocalDeletedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local deleted product ids:', e);
    return [];
  }
}

export function addLocalAddedProduct(product: Product): void {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    const list = getLocalAddedProducts();
    const idx = list.findIndex((p) => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase());
    if (idx > -1) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    localStorage.setItem(ADDED_KEY, JSON.stringify(list));

    // Remove from deleted list if re-added
    const deleted = getLocalDeletedProductIds().filter((id) => id !== product.id && id.toLowerCase() !== product.name.toLowerCase());
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.error('Error adding local product:', e);
  }
}

export function removeLocalAddedProduct(productIdOrName: string): void {
  if (typeof window === 'undefined' || !productIdOrName) return;
  try {
    const target = productIdOrName.toLowerCase().trim();
    const list = getLocalAddedProducts().filter((p) => {
      if (!p) return false;
      const pId = (p.id || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      return pId !== target && pName !== target;
    });
    localStorage.setItem(ADDED_KEY, JSON.stringify(list));

    const deleted = getLocalDeletedProductIds();
    if (!deleted.includes(productIdOrName)) {
      deleted.push(productIdOrName);
    }
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.error('Error removing local product:', e);
  }
}

export function getMergedClientProducts(fetchedProducts: Product[] = [], initialProducts: Product[] = []): Product[] {
  const mergedMap = new Map<string, Product>();

  // Use fresh API fetched products if available, fallback to initial server products
  const baseList = (fetchedProducts && fetchedProducts.length > 0) ? fetchedProducts : initialProducts;

  (baseList || []).forEach((p) => {
    if (p && p.id && p.status !== 'ARCHIVED') mergedMap.set(p.id, p);
  });

  // Local added products (takes priority for freshly created items)
  const localAdded = getLocalAddedProducts();
  localAdded.forEach((p) => {
    if (p && p.id && p.status !== 'ARCHIVED') {
      const existing = mergedMap.get(p.id);
      if (!existing || (p.updatedAt && existing.updatedAt && new Date(p.updatedAt).getTime() >= new Date(existing.updatedAt).getTime())) {
        mergedMap.set(p.id, p);
      }
    }
  });

  // Remove local deleted product IDs & ARCHIVED products
  const deletedIds = getLocalDeletedProductIds().map((id) => id.toLowerCase().trim());
  Array.from(mergedMap.entries()).forEach(([id, p]) => {
    const pId = (p.id || '').toLowerCase().trim();
    const pName = (p.name || '').toLowerCase().trim();
    if (deletedIds.includes(pId) || deletedIds.includes(pName) || p.status === 'ARCHIVED') {
      mergedMap.delete(id);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });
}
