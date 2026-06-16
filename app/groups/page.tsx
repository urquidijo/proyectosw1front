"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken } from "@/app/lib/auth";
import { Workspace, listMyGroupsRequest, createGroupRequest } from "@/app/lib/groups";
import { listActivePlansRequest, SubscriptionPlan } from "@/app/lib/plans";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Workspace[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = getToken();
      if (!token) return;
      
      const [groupsData, plansData] = await Promise.all([
        listMyGroupsRequest(token),
        listActivePlansRequest().catch(() => [])
      ]);
      
      setGroups(groupsData);
      
      const groupPlans = plansData.filter((p) => p.type === "GROUP");
      setPlans(groupPlans);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const token = getToken();
      if (!token) throw new Error("No hay sesión activa");

      const newGroup = await createGroupRequest(token, { name });
      setGroups((curr) => [newGroup, ...curr]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear grupo");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10">
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900">Mis Grupos de Trabajo</h2>
            <p className="mt-4 max-w-2xl text-slate-600">
              Colabora con otros usuarios compartiendo proyectos de generación de datos.
            </p>
          </section>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900">Crear Grupo</h3>
              <form onSubmit={handleCreate} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del grupo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-900"
                    placeholder="Ej: Equipo de QA"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {creating ? "Creando..." : "Crear Grupo"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Listado de Grupos</h3>
              {loading ? (
                <p className="text-sm text-slate-500">Cargando grupos...</p>
              ) : groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="font-medium text-slate-800">No perteneces a ningún grupo</p>
                  <p className="mt-1 text-sm text-slate-500">Crea uno o pide a un compañero que te invite.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <article key={group.id} className="rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-400 transition">
                      <div>
                        <h4 className="font-semibold text-slate-900">{group.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Plan del Owner: {group.owner?.plan?.name || "Sin Plan"} • {group.members?.length || 0} Miembros • {group.projects?.length || 0} Proyectos
                        </p>
                      </div>
                      <Link
                        href={`/groups/${group.id}`}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                      >
                        Administrar
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
