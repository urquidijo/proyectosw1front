'use client';

import {
  clearAuthSession,
  getStoredUser,
  getToken,
  logoutRequest,
} from '@/app/lib/auth';
import { AuthUser } from '@/app/types/auth';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const token = getToken();

    try {
      if (token) {
        await logoutRequest(token);
      }
    } catch {
      // Ignorar si falla la red, cerramos localmente
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

  const NavLinks = () => (
    <>
      {user?.role !== 'SUPERADMIN' && (
        <>
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              pathname === '/dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Proyectos
          </Link>
          <Link
            href="/groups"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              pathname === '/groups' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Mis Grupos
          </Link>
          <Link
            href="/community"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              pathname.startsWith('/community') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Comunidad
          </Link>
          <Link
            href="/usage"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              pathname === '/usage' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Mi Plan
          </Link>
        </>
      )}
      {user?.role === 'SUPERADMIN' && (
        <>
          <Link
            href="/admin"
            className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
              pathname.startsWith('/admin') ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Administración
          </Link>
          <Link
            href="/community"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              pathname.startsWith('/community') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Comunidad
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <Link href={user ? '/dashboard' : '/'} className="group flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition group-hover:bg-slate-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 4C7.58 4 4 5.79 4 8s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 8v4c0 2.21 3.58 4 8 4s8-1.79 8-4V8" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 12v4c0 2.21 3.58 4 8 4s8-1.79 8-4v-4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">SynData</h1>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6 ml-2">
              <NavLinks />
            </nav>
          )}
        </div>

        {/* Right Section (User & Actions) */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  {user.role !== 'SUPERADMIN' && (
                    <Link href="/plans" className="mt-0.5 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors">
                      {user.plan?.name || "Plan Gratuito"}
                    </Link>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {getInitials(user.name)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/plans" className="text-sm font-medium text-slate-600 hover:text-slate-900">Planes</Link>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Iniciar sesión</Link>
              <Link href="/register" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Comenzar gratis</Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Abrir menú principal</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 shadow-lg">
          {user ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  {user.role !== 'SUPERADMIN' && (
                    <Link href="/plans" className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors">
                      {user.plan?.name || "Plan Gratuito"}
                    </Link>
                  )}
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                <NavLinks />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </nav>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/plans" className="block px-3 py-2 rounded-lg text-base font-medium text-slate-900 hover:bg-slate-50">Planes</Link>
              <Link href="/login" className="block px-3 py-2 rounded-lg text-base font-medium text-slate-900 hover:bg-slate-50">Iniciar sesión</Link>
              <Link href="/register" className="block px-3 py-2 rounded-lg text-base font-medium text-violet-700 hover:bg-violet-50">Comenzar gratis</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}