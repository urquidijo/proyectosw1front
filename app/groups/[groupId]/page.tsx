"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { Workspace, getGroupRequest, addMemberToGroupRequest } from "@/app/lib/groups";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId) as string;

  const [group, setGroup] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const currentUser = getStoredUser();
  const isAdmin = group?.members.find(m => m.userId === currentUser?.id)?.role === "ADMIN";

  useEffect(() => {
    if (groupId) loadGroup();
  }, [groupId]);

  async function loadGroup() {
    try {
      const token = getToken();
      if (!token) return;
      const data = await getGroupRequest(token, groupId);
      setGroup(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar grupo");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const token = getToken();
      if (!token) return;
      await addMemberToGroupRequest(token, groupId, email);
      setEmail("");
      loadGroup(); // Recargar para ver el nuevo miembro
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al invitar");
    } finally {
      setAdding(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10">
          <Link href="/groups" className="text-sm font-semibold text-violet-600 hover:underline mb-6 inline-block">
            &larr; Volver a Mis Grupos
          </Link>

          {loading ? (
            <p>Cargando grupo...</p>
          ) : !group ? (
            <p className="text-red-500">{error || "Grupo no encontrado"}</p>
          ) : (
            <>
              <section className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{group.name}</h2>
                    <p className="mt-2 text-sm text-slate-500">Plan del Owner: {group.owner?.plan?.name || "Sin Plan"}</p>
                  </div>
                  {isAdmin && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                      Admin
                    </span>
                  )}
                </div>
              </section>

              {error && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* Miembros */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Miembros del Grupo</h3>
                  <div className="space-y-4">
                    {group.members.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{member.user.name}</p>
                          <p className="text-xs text-slate-500">{member.user.email}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{member.role}</span>
                      </div>
                    ))}
                  </div>

                  {isAdmin && (
                    <form onSubmit={handleAddMember} className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 mb-3">Añadir Nuevo Miembro</h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          required
                          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900"
                        />
                        <button
                          type="submit"
                          disabled={adding}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {adding ? "Añadiendo..." : "Añadir"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                {/* Proyectos */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Proyectos Compartidos</h3>
                  {group.projects.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No hay proyectos compartidos en este grupo.</p>
                  ) : (
                    <div className="space-y-3">
                      {group.projects.map(proj => (
                        <div key={proj.id} className="p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-900">{proj.name}</p>
                            <p className="text-xs text-slate-500">De: {proj.owner?.name}</p>
                          </div>
                          <Link href={`/projects/${proj.id}`} className="text-xs font-semibold text-violet-600 hover:underline">
                            Abrir
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
