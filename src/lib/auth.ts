import { cookies } from 'next/headers';

export async function loginAdmin(username: string, password: string): Promise<boolean> {
  const envUser = process.env.ADMIN_USERNAME || 'Aryan';
  const envPass = process.env.ADMIN_PASSWORD || '1234';

  if (username.trim() === envUser && password === envPass) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });
    return true;
  }
  return false;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'true';
  } catch {
    return true;
  }
}
