import { getProductsList } from '@/lib/db';
import ShopClient from './ShopClient';

export const revalidate = 0; // Bypass page caching to ensure active inventory changes reflect immediately

export default async function ShopPage() {
  const products = await getProductsList();
  return <ShopClient initialProducts={products} />;
}
