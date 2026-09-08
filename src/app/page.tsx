import { getProductsList } from '@/lib/db';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const products = await getProductsList();
  return <HomeClient initialProducts={products} />;
}
