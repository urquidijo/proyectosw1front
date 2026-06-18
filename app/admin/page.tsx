"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState, FormEvent } from "react";
import { SubscriptionPlan } from "@/app/lib/plans";
import { useRouter } from "next/navigation";

type Tab = "PLANS" | "USERS" | "LOGS";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("PLANS");

  // Plans State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Logs State
  const [logsList, setLogsList] = useState<{activities: any[], payments: any[]}>({ activities: [], payments: [] });
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planType, setPlanType] = useState<"INDIVIDUAL" | "GROUP">("GROUP");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    maxWorkspaces: 1,
    maxProjects: 1,
    maxUsersPerWorkspace: 3,
    maxGenerationsPerMonth: 100,
    apiCostPer1kRows: 0,
  });
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && storedUser.role !== "SUPERADMIN") {
      router.replace("/dashboard");
      return;
    }
    setUser(storedUser);
    loadPlans();
  }, [router]);

  useEffect(() => {
    if (activeTab === "USERS" && usersList.length === 0) loadUsers();
    if (activeTab === "LOGS" && logsList.activities.length === 0) loadLogs();
  }, [activeTab]);

  async function loadPlans() {
    setLoadingPlans(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/plans/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Error fetching plans");
      setPlans(await response.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlans(false);
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Error fetching users");
      setUsersList(await response.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/logs/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Error fetching logs");
      setLogsList(await response.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleCreatePlan(e: FormEvent) {
    e.preventDefault();
    setCreatingPlan(true);
    try {
      const token = getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      
      const payload = {
        name: newPlan.name,
        type: planType,
        price: Number(newPlan.price),
        maxProjects: Number(newPlan.maxProjects),
        maxWorkspaces: Number(newPlan.maxWorkspaces),
        maxUsersPerWorkspace: Number(newPlan.maxUsersPerWorkspace),
        maxGenerationsPerMonth: Number(newPlan.maxGenerationsPerMonth),
        apiCostPer1kRows: Number(newPlan.apiCostPer1kRows),
      };

      const url = editingPlanId ? `${API_URL}/plans/${editingPlanId}` : `${API_URL}/plans`;
      const method = editingPlanId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Error saving plan");
      await loadPlans();
      setIsModalOpen(false);
      setEditingPlanId(null);
    } catch (error) {
      alert("Error al guardar el plan");
    } finally {
      setCreatingPlan(false);
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;
    try {
      const token = getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/plans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error deleting plan");
      await loadPlans();
    } catch (e) {
      alert("Error al eliminar el plan");
    }
  }

  function openCreateModal() {
    setEditingPlanId(null);
    setPlanType("GROUP");
    setNewPlan({
      name: "", price: 0, maxWorkspaces: 1, maxProjects: 1, maxUsersPerWorkspace: 3, maxGenerationsPerMonth: 100, apiCostPer1kRows: 0
    });
    setIsModalOpen(true);
  }

  function openEditModal(plan: SubscriptionPlan) {
    setEditingPlanId(plan.id);
    setPlanType(plan.type as "INDIVIDUAL" | "GROUP");
    setNewPlan({
      name: plan.name,
      price: plan.price,
      maxWorkspaces: plan.maxWorkspaces || 1,
      maxProjects: plan.maxProjects || 1,
      maxUsersPerWorkspace: plan.maxUsersPerWorkspace || 3,
      maxGenerationsPerMonth: plan.maxGenerationsPerMonth || 100,
      apiCostPer1kRows: plan.apiCostPer1kRows || 0,
    });
    setIsModalOpen(true);
  }

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Administración</h2>
            <p className="mt-2 text-slate-600">
              Gestiona los planes, usuarios y revisa los logs del sistema.
            </p>
          </div>

          <div className="flex space-x-4 border-b border-slate-200 mb-6">
            <button onClick={() => setActiveTab("PLANS")} className={`pb-4 px-2 text-sm font-semibold transition ${activeTab === "PLANS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Planes de Suscripción</button>
            <button onClick={() => setActiveTab("USERS")} className={`pb-4 px-2 text-sm font-semibold transition ${activeTab === "USERS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Usuarios Registrados</button>
            <button onClick={() => setActiveTab("LOGS")} className={`pb-4 px-2 text-sm font-semibold transition ${activeTab === "LOGS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Logs del Sistema</button>
          </div>

          {activeTab === "PLANS" && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Planes Activos</h3>
                  <p className="text-sm text-slate-500">Configura los límites de los usuarios y costos de API.</p>
                </div>
                <button onClick={openCreateModal} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition">+ Crear Plan</button>
              </div>

              {loadingPlans ? (
                <p className="text-sm text-slate-500">Cargando planes...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-500">Nombre</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Tipo</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Precio</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Límites (Proy. / Grupos / Usuarios)</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Costo API</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{plan.name}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className={`px-2 py-1 text-xs rounded-lg font-semibold bg-blue-100 text-blue-700`}>{plan.type}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">${plan.price}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {`${plan.maxProjects || '∞'} / ${plan.maxWorkspaces || '∞'} / ${plan.maxUsersPerWorkspace || '∞'}`}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {plan.apiCostPer1kRows ? `$${plan.apiCostPer1kRows}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEditModal(plan)} className="text-violet-600 hover:text-violet-800 text-sm font-semibold mr-3">Editar</button>
                            <button onClick={() => handleDeletePlan(plan.id)} className="text-rose-600 hover:text-rose-800 text-sm font-semibold">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "USERS" && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Usuarios del Sistema</h3>
              {loadingUsers ? <p className="text-sm text-slate-500">Cargando usuarios...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-500">Nombre</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Email</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Rol</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Plan Actual</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(u => (
                        <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{u.role}</span></td>
                          <td className="px-4 py-3 text-slate-600">{u.plan ? u.plan.name : 'Ninguno'}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "LOGS" && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Registro de Actividad (Últimas 100)</h3>
              {loadingLogs ? <p className="text-sm text-slate-500">Cargando logs...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-500">Fecha</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Usuario</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Acción</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Contexto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsList.activities.map(log => (
                        <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{log.user?.email || 'Sistema'}</td>
                          <td className="px-4 py-3 text-slate-600">{log.action}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-mono">{log.workspace?.name || '-'}</td>
                        </tr>
                      ))}
                      {logsList.activities.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-slate-500">No hay logs de actividad.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{editingPlanId ? "Editar Plan" : "Crear Nuevo Plan"}</h3>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setPlanType("INDIVIDUAL")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${planType === "INDIVIDUAL" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Individual</button>
              <button onClick={() => setPlanType("GROUP")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${planType === "GROUP" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Grupo</button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Nombre del Plan</label><input required type="text" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Precio Mensual ($)</label><input required type="number" step="0.01" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Límite Proyectos</label><input required type="number" value={newPlan.maxProjects} onChange={e => setNewPlan({...newPlan, maxProjects: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Límite Grupos</label><input required type="number" value={newPlan.maxWorkspaces} onChange={e => setNewPlan({...newPlan, maxWorkspaces: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Usr. por Grupo</label><input required type="number" value={newPlan.maxUsersPerWorkspace} onChange={e => setNewPlan({...newPlan, maxUsersPerWorkspace: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Gens. por Mes</label><input required type="number" value={newPlan.maxGenerationsPerMonth} onChange={e => setNewPlan({...newPlan, maxGenerationsPerMonth: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
              </div>
              
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Costo / 1000 filas API ($)</label><input type="number" step="0.001" value={newPlan.apiCostPer1kRows} onChange={e => setNewPlan({...newPlan, apiCostPer1kRows: Number(e.target.value)})} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-600" /></div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" disabled={creatingPlan} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60`}>{creatingPlan ? "Creando..." : "Guardar Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
