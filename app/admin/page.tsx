"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState, FormEvent } from "react";
import { SubscriptionPlan } from "@/app/lib/plans";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { Users, FolderGit2, Cpu, DollarSign, TrendingUp } from 'lucide-react';

type Tab = "DASHBOARD" | "PLANS" | "USERS" | "PAYMENTS" | "LOGS" | "COMMUNITY";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");

  // Dashboard State
  const [kpis, setKpis] = useState<{
    totalUsers: number, 
    totalProjects: number, 
    totalGenerations: number, 
    totalRevenue: number,
    revenueData: any[],
    usersData: any[],
    generationsData: any[]
  } | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  // Community State
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

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

  // SuperAdmin Modal State
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [creatingSuperAdmin, setCreatingSuperAdmin] = useState(false);
  const [newSuperAdmin, setNewSuperAdmin] = useState({ name: "", email: "", password: "" });

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
    if (activeTab === "DASHBOARD" && !kpis) loadKpis();
    if (activeTab === "USERS" && usersList.length === 0) loadUsers();
    if (activeTab === "LOGS" && logsList.activities.length === 0) loadLogs();
    if (activeTab === "PAYMENTS" && logsList.payments.length === 0) loadLogs();
  }, [activeTab]);

  async function loadKpis() {
    setLoadingKpis(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/admin/kpis`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Error fetching kpis");
      setKpis(await response.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKpis(false);
    }
  }

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

  async function loadCommunityPosts() {
    setLoadingCommunity(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/community/admin/posts`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Error fetching community posts");
      setCommunityPosts(await response.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCommunity(false);
    }
  }

  async function handleAdminDeletePost(postId: string) {
    if (!confirm("¿Eliminar este post de la comunidad? Esta acción no se puede deshacer.")) return;
    try {
      const token = getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/community/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadCommunityPosts();
      else alert("Error al eliminar el post");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateSuperAdmin(e: FormEvent) {
    e.preventDefault();
    setCreatingSuperAdmin(true);
    try {
      const token = getToken();
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/users/superadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSuperAdmin),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Error al crear SuperAdmin");
        return;
      }

      setIsSuperAdminModalOpen(false);
      setNewSuperAdmin({ name: "", email: "", password: "" });
      loadUsers();
    } catch (e) {
      console.error(e);
      alert("Error de red");
    } finally {
      setCreatingSuperAdmin(false);
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

          <div className="flex space-x-4 border-b border-slate-200 mb-6 overflow-x-auto">
            <button onClick={() => setActiveTab("DASHBOARD")} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "DASHBOARD" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Dashboard</button>
            <button onClick={() => setActiveTab("PLANS")} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "PLANS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Planes de Suscripción</button>
            <button onClick={() => setActiveTab("USERS")} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "USERS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Usuarios Registrados</button>
            <button onClick={() => setActiveTab("PAYMENTS")} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "PAYMENTS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Pagos e Ingresos</button>
            <button onClick={() => setActiveTab("LOGS")} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "LOGS" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Logs de Actividad</button>
            <button onClick={() => { setActiveTab("COMMUNITY"); loadCommunityPosts(); }} className={`pb-4 px-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === "COMMUNITY" ? "border-b-2 border-violet-600 text-violet-700" : "text-slate-500 hover:text-slate-700"}`}>Comunidad</button>
          </div>

          {activeTab === "DASHBOARD" && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Visión General</h3>
              </div>
              
              {loadingKpis || !kpis ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm font-medium text-slate-500 animate-pulse">Analizando métricas del sistema...</p>
                </div>
              ) : (
                <>
                  {/* Tarjetas Principales (KPIs) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:border-violet-200 transition-colors">
                      <div className="absolute -right-6 -top-6 text-violet-50 opacity-50 group-hover:scale-110 transition-transform duration-500"><Users size={120} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Users size={20} /></div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuarios Totales</p>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{kpis.totalUsers}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:border-blue-200 transition-colors">
                      <div className="absolute -right-6 -top-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500"><FolderGit2 size={120} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FolderGit2 size={20} /></div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proyectos</p>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{kpis.totalProjects}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                      <div className="absolute -right-6 -top-6 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform duration-500"><Cpu size={120} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Cpu size={20} /></div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generaciones AI</p>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{kpis.totalGenerations}</p>
                      </div>
                    </div>

                    <div className="bg-linear-to-br from-violet-600 to-indigo-800 rounded-2xl p-6 shadow-lg shadow-violet-200 flex flex-col justify-center relative overflow-hidden group text-white">
                      <div className="absolute -right-6 -top-6 text-white opacity-10 group-hover:scale-110 transition-transform duration-500"><DollarSign size={120} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-white/20 backdrop-blur-md text-white rounded-xl"><TrendingUp size={20} /></div>
                          <p className="text-xs font-bold text-violet-200 uppercase tracking-wider">Ingresos Totales</p>
                        </div>
                        <p className="text-4xl lg:text-5xl font-black">${kpis.totalRevenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gráficas */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfica de Ingresos */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-500" /> Tendencia de Ingresos Mensuales
                      </h4>
                      <div className="h-72 w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <AreaChart data={kpis.revenueData}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dx={-10} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gráfica de Generaciones */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Cpu size={18} className="text-blue-500" /> Uso de Inteligencia Artificial (Días)
                      </h4>
                      <div className="h-72 w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <BarChart data={kpis.generationsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} 
                                   tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dx={-10} />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="generations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Generaciones" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gráfica de Usuarios (Ancho Completo) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                      <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users size={18} className="text-violet-500" /> Adquisición de Usuarios (Mensual)
                      </h4>
                      <div className="h-80 w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <LineChart data={kpis.usersData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dx={-10} />
                            <Tooltip 
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Line type="monotone" dataKey="users" name="Nuevos Usuarios" stroke="#8b5cf6" strokeWidth={3} dot={{r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Usuarios del Sistema</h3>
                <button onClick={() => setIsSuperAdminModalOpen(true)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition">+ Añadir SuperAdmin</button>
              </div>
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

          {activeTab === "PAYMENTS" && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Historial de Pagos</h3>
              {loadingLogs ? <p className="text-sm text-slate-500">Cargando pagos...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-500">Fecha</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Usuario</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Monto</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Estado</th>
                        <th className="px-4 py-3 font-semibold text-slate-500">Referencia (Stripe)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsList.payments.map(payment => (
                        <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">{new Date(payment.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{payment.user?.email || 'Desconocido'}</td>
                          <td className="px-4 py-3 text-emerald-600 font-bold">${payment.amount} {payment.currency}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded font-semibold ${payment.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">{payment.reference || '-'}</td>
                        </tr>
                      ))}
                      {logsList.payments.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No hay pagos registrados.</td></tr>
                      )}
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

          {activeTab === "COMMUNITY" && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Posts de la Comunidad</h3>
                  <p className="text-sm text-slate-500 mt-1">Gestiona y elimina publicaciones de todos los usuarios.</p>
                </div>
                <button onClick={loadCommunityPosts} className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Actualizar
                </button>
              </div>
              {loadingCommunity ? <p className="text-sm text-slate-500">Cargando posts...</p> : (
                communityPosts.length === 0 ? (
                  <p className="text-center text-slate-400 py-12">No hay publicaciones en la comunidad todavía.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-500">Título</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">Autor</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">Tags</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 text-center">Descargas</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 text-center">Votos</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 text-center">Comentarios</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">Fecha</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communityPosts.map(post => (
                          <tr key={post.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px]">
                              <span className="line-clamp-1" title={post.title}>{post.title}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{post.author?.email || post.author?.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {post.tags?.slice(0, 2).map((t: string) => (
                                  <span key={t} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{t}</span>
                                ))}
                                {post.tags?.length > 2 && <span className="text-[10px] text-slate-400">+{post.tags.length - 2}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">{post.downloads}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{post.upvoteCount}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{post.commentCount}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleAdminDeletePost(post.id)}
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold transition"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
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

      {/* SuperAdmin Creation Modal */}
      {isSuperAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-xl font-bold text-slate-900">Crear Nuevo SuperAdmin</h3>
            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input required type="text" value={newSuperAdmin.name} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input required type="email" value={newSuperAdmin.email} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="admin@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input required type="password" value={newSuperAdmin.password} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Contraseña segura" />
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsSuperAdminModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
                <button type="submit" disabled={creatingSuperAdmin} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50">
                  {creatingSuperAdmin ? "Creando..." : "Crear SuperAdmin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
