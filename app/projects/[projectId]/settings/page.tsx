"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken } from "@/app/lib/auth";
import { getProjectRequest, assignProjectToWorkspaceRequest } from "@/app/lib/projects";
import { Project } from "@/app/types/project";
import { Workspace, listMyGroupsRequest } from "@/app/lib/groups";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (Array.isArray(params.projectId) ? params.projectId[0] : params.projectId) as string;

  const [project, setProject] = useState<Project | null>(null);
  const [groups, setGroups] = useState<Workspace[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();
        if (!token) return;

        const [projData, groupsData] = await Promise.all([
          getProjectRequest(token, projectId),
          listMyGroupsRequest(token)
        ]);

        setProject(projData);
        setGroups(groupsData);
        setSelectedGroupId(projData.workspaceId || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const token = getToken();
      if (!token) return;

      await assignProjectToWorkspaceRequest(token, projectId, selectedGroupId || null);
      setSuccess(true);
      setTimeout(() => router.push(`/projects/${projectId}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 py-10">
          <Link href={`/projects/${projectId}`} className="text-sm font-semibold text-violet-600 hover:underline mb-6 inline-block">
            &larr; Volver al Proyecto
          </Link>

          {loading ? (
            <p>Cargando configuración...</p>
          ) : !project ? (
            <p className="text-red-500">{error || "Proyecto no encontrado"}</p>
          ) : (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Configuración del Proyecto</h2>
              <p className="mt-2 text-sm text-slate-500">
                Gestiona los permisos y la colaboración de <strong>{project.name}</strong>.
              </p>

              {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Guardado exitosamente. Redirigiendo...</div>}

              <form onSubmit={handleSave} className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Grupo de Trabajo (Workspace)</label>
                  <p className="text-xs text-slate-500 mb-4">
                    Al asignar este proyecto a un grupo, todos los miembros del grupo podrán verlo y generar datos.
                  </p>
                  
                  {groups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 bg-slate-50">
                      <p className="text-sm text-slate-600">No perteneces a ningún grupo de trabajo.</p>
                      <Link href="/groups" className="text-xs text-violet-600 hover:underline mt-1 block">Ir a crear un grupo</Link>
                    </div>
                  ) : (
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="">-- Proyecto Personal (Sin grupo) --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.members.length} miembros)</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <Link href={`/projects/${projectId}`} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
