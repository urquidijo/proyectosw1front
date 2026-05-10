"use client";

import { getToken } from "@/app/lib/auth";
import { getProjectRequest } from "@/app/lib/projects";
import { Project } from "@/app/types/project";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      setError("");
      setLoading(true);

      try {
        const token = getToken();

        if (!token) {
          throw new Error("No existe una sesión activa");
        }

        if (!projectId) {
          throw new Error("Proyecto no válido");
        }

        const data = await getProjectRequest(token, projectId);
        setProject(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar el proyecto",
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

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver al dashboard
          </Link>

          {loading ? (
            <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-8 w-64 rounded bg-slate-200" />
                <div className="h-4 w-full max-w-xl rounded bg-slate-200" />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="h-20 rounded-2xl bg-slate-100" />
                  <div className="h-20 rounded-2xl bg-slate-100" />
                </div>
              </div>
            </section>
          ) : error ? (
            <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-8">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </section>
          ) : project ? (
            <>
              <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-100 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-sky-100 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-7 w-7"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-violet-600">
                          Proyecto SynData
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                          {project.name}
                        </h1>

                        <p className="mt-3 max-w-3xl text-slate-600">
                          {project.description ||
                            "Este proyecto no tiene descripción."}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Activo
                    </span>
                  </div>

                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fecha de creación
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {new Date(project.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Última actualización
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Módulos del proyecto
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Accede a las principales funciones de SynData.
                  </p>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <article className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 16V4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="m7 9 5-5 5 5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 20h14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                      Importar estructura SQL
                    </h3>

                    <p className="mt-2 min-h-12 text-sm text-slate-500">
                      Pega o sube un script PostgreSQL para detectar el esquema
                      completo de tu base de datos.
                    </p>

                    <Link
                      href={`/projects/${project.id}/sql-imports`}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Abrir importador
                    </Link>
                  </article>

                  <article className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 3v18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 8h14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 16h14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 5v14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 5v14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                      Generación de datos
                    </h3>

                    <p className="mt-2 min-h-12 text-sm text-slate-500">
                      Genera registros sintéticos coherentes a partir de una
                      estructura SQL válida y un plan semántico.
                    </p>

                    <Link
                      href={`/projects/${project.id}/generations`}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                    >
                      Abrir generador
                    </Link>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 3v12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="m7 10 5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 20h14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Exportaciones
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                        Próximamente
                      </span>
                    </div>

                    <p className="mt-2 min-h-12 text-sm text-slate-500">
                      Próximamente podrás exportar resultados en formatos JSON y
                      CSV además de SQL.
                    </p>

                    <button
                      disabled
                      className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
                    >
                      No disponible aún
                    </button>
                  </article>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </AuthGuard>
  );
}
