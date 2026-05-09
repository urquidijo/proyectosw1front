'use client';

import { getMeRequest, getToken, clearAuthSession } from '@/app/lib/auth';
import { AuthUser } from '@/app/types/auth';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = getToken();

        if (!token) {
          router.replace('/login');
          return;
        }

        const currentUser = await getMeRequest(token);
        setUser(currentUser);
      } catch {
        clearAuthSession();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}