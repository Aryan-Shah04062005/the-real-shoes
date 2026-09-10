import React from 'react';
import { getProductById } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductDetailsClient from './ProductDetailsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Ensure inventory stock and custom updates reflect immediately

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (product && product.status === 'ARCHIVED') {
    notFound();
  }

  return <ProductDetailsClient id={id} initialProduct={product} />;
}
