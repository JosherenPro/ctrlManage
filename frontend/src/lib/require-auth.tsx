'use client';

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="spinner-lg" />
      </div>
    );
  if (!user) redirect('/login');
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="spinner-lg" />
      </div>
    );
  if (!user) redirect('/login');
  if (!roles.includes(user.role?.name || '')) redirect('/dashboard');
  return <>{children}</>;
}
