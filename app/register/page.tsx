'use client';

import { registerRequest, saveAuthSession } from '@/app/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = await registerRequest({
        name,
        email,
        password,
      });

      saveAuthSession(auth);
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-start">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Volver al inicio
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-500">
            Regístrate para comenzar a usar SynData.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="usuario@correo.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-slate-900">
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}