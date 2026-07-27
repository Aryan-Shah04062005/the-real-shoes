import React from 'react';
import { isAdminAuthenticated } from '@/lib/auth';
import { getFullDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const revalidate = 0; // Fresh DB state is critical for dashboard admin actions

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    redirect('/admin/login');
  }

  const db = await getFullDb();

  return <DashboardClient initialDb={db} />;
}
