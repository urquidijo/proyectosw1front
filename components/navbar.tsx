'use client';

import {
  clearAuthSession,
  getStoredUser,
  getToken,
  logoutRequest,
} from '@/app/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthUser } from '@/app/types/auth';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  async function handleLogout() {
    const token = getToken();

    try {
      if (token) {
        await logoutRequest(token);
      }
    } catch {
      // Aunque falle el backend, limpiamos la sesión local.
    } finally {
      clearAuthSession();
      router.replace('/login');
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">SynData</h1>
          <p className="text-xs text-slate-500">
            Generador de datos sintéticos
          </p>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}