'use client';

import {
  clearAuthSession,
  getStoredUser,
  getToken,
  logoutRequest,
} from '@/app/lib/auth';
import { AuthUser } from '@/app/types/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  function getInitials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="group flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition group-hover:bg-slate-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M12 4C7.58 4 4 5.79 4 8s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M4 8v4c0 2.21 3.58 4 8 4s8-1.79 8-4V8"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M4 12v4c0 2.21 3.58 4 8 4s8-1.79 8-4v-4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
              SynData
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              Generador de datos sintéticos
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                {getInitials(user.name)}
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user.name}
                </p>

                <p className="max-w-45 truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M10 17l5-5-5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 12H3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}