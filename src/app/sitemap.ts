import type { MetadataRoute } from 'next';
import { getProductsList } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://the-real-shoes.vercel.app';

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProductsList();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error loading products for sitemap:', error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/shop',
    '/policies/privacy',
    '/policies/terms',
    '/policies/shipping',
    '/policies/refunds',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
