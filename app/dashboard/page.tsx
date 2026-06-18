'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/navbar';
import { getStoredUser, getToken } from '@/app/lib/auth';
import {
  createProjectRequest,
  deleteProjectRequest,
  listProjectsRequest,
} from '@/app/lib/projects';
import { Project } from '@/app/types/project';
import { AuthUser } from '@/app/types/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser?.role === 'SUPERADMIN') {
      router.replace('/admin');
      return;
    }
    setUser(storedUser);
    loadProjects();
  }, [router]);

  async function loadProjects() {
    setError('');
    setLoadingProjects(true);

    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const data = await listProjectsRequest(token);
      setProjects(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error al cargar los proyectos',
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCreating(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error('No existe una sesión activa');
      }

      const createdProject = await createProjectRequest(token, {
        name,
        description,
      });

      setProjects((currentProjects) => [createdProject, ...currentProjects]);
      setName('');
      setDescription('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Error al crear el proyecto',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const confirmDelete = window.confirm(
      '¿Seguro que quieres eliminar este proyecto?',
    );

    if (!confirmDelete) return;

    setError('');
    setDeletingId(projectId);

    try {
      const token = getToken();

      if (!token) {
        throw new Error('No existe una sesión activa');
      }

      await deleteProjectRequest(token, projectId);

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error al eliminar el proyecto',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10">
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Bienvenido</p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {user?.name ?? 'Usuario'}
            </h2>

            <p className="mt-4 max-w-2xl text-slate-600">
              Desde aquí puedes crear proyectos de generación de datos
              sintéticos. Luego, dentro de cada proyecto, agregaremos tablas,
              campos, relaciones y generación de datos.
            </p>
          </section>

          {error && (
            <div className="mt-6 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {(error.toLowerCase().includes("plan") || error.toLowerCase().includes("límite")) && (
                <Link href="/plans" className="font-semibold underline hover:text-red-900 w-fit">
                  Ver planes y suscripciones
                </Link>
              )}
            </div>
          )}

          <section className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Nuevo proyecto
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Crea un espacio para modelar una base de datos sintética.
              </p>

              <form onSubmit={handleCreateProject} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nombre del proyecto
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                    placeholder="Ej: Sistema académico"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Descripción
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-28 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                    placeholder="Ej: Datos sintéticos para probar estudiantes, materias y notas."
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creando...' : 'Crear proyecto'}
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Mis proyectos
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Lista de proyectos creados por tu usuario.
                  </p>
                </div>

                <button
                  onClick={loadProjects}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Actualizar
                </button>
              </div>

              <div className="mt-6">
                {loadingProjects ? (
                  <p className="text-sm text-slate-500">
                    Cargando proyectos...
                  </p>
                ) : projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-medium text-slate-800">
                      Todavía no tienes proyectos
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Crea tu primer proyecto para comenzar con SynData.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <article
                        key={project.id}
                        className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-400"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {project.name}
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              {project.description || 'Sin descripción'}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              Creado:{' '}
                              {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/projects/${project.id}`}
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                              Abrir
                            </Link>

                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              disabled={deletingId === project.id}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === project.id
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}