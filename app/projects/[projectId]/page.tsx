'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/navbar';
import { getToken } from '@/app/lib/auth';
import { getProjectRequest } from '@/app/lib/projects';
import { Project } from '@/app/types/project';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProjectDetailPage() {
  const params = useParams();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProject() {
      setError('');
      setLoading(true);

      try {
        const token = getToken();

        if (!token) {
          throw new Error('No existe una sesión activa');
        }

        if (!projectId) {
          throw new Error('Proyecto no válido');
        }

        const data = await getProjectRequest(token, projectId);
        setProject(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Error al cargar el proyecto',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Volver al dashboard
          </Link>

          {loading ? (
            <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">Cargando proyecto...</p>
            </section>
          ) : error ? (
            <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8">
              <p className="text-sm text-red-700">{error}</p>
            </section>
          ) : project ? (
            <>
              <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Proyecto SynData
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {project.name}
                </h1>

                <p className="mt-4 max-w-3xl text-slate-600">
                  {project.description || 'Este proyecto no tiene descripción.'}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Fecha de creación
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {new Date(project.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Última actualización
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900">
                    Constructor de esquema
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Aquí agregaremos tablas, campos y relaciones.
                  </p>

                  <button
                    disabled
                    className="mt-5 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
                  >
                    Próximamente
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900">
                    Generación de datos
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Aquí generaremos datos sintéticos según el esquema.
                  </p>

                  <button
                    disabled
                    className="mt-5 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
                  >
                    Próximamente
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900">
                    Exportaciones
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Aquí exportaremos datos en JSON y CSV.
                  </p>

                  <button
                    disabled
                    className="mt-5 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
                  >
                    Próximamente
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </AuthGuard>
  );
}