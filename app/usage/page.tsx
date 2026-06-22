"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState } from "react";
import { CreditCard, Zap, FolderGit2, Users } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface UsageData {
  plan: {
    name: string;
    maxWorkspaces: number;
    maxProjects: number;
    maxGenerationsPerMonth: number;
    price: string | number;
  } | null;
  usage: {
    projects: number;
    workspaces: number;
    generations: number;
  };
  subscriptionStart: string;
}

export default function UsageDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    fetchUsage();
  }, []);

  async function fetchUsage() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/me/usage`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setUsageData(await res.json());
      }
    } catch (e) {
      console.error("Error fetching usage data", e);
    } finally {
      setLoading(false);
    }
  }

  // Helper calculations
  const calculateCycleEnd = (startDateStr: string) => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const now = new Date();
    // Assuming monthly billing cycle based on start date
    let end = new Date(now.getFullYear(), now.getMonth(), start.getDate());
    if (now > end) {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  };

  const getPercentage = (used: number, max: number | null) => {
    if (!max || max === 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-rose-500";
    if (percent >= 75) return "bg-amber-500";
    return "bg-violet-600";
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200 mb-8" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const { plan, usage, subscriptionStart } = usageData || {};
  const cycleEnd = calculateCycleEnd(subscriptionStart || "");
  const daysRemaining = cycleEnd ? Math.ceil((cycleEnd.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  // Fallback limits if no plan is found (e.g., Free Plan limits)
  const maxProjects = plan?.maxProjects ?? 3;
  const maxWorkspaces = plan?.maxWorkspaces ?? 1;
  const maxGenerations = plan?.maxGenerationsPerMonth ?? 10;
  const planName = plan?.name || "Plan Gratuito";
  const planPrice = plan?.price ? Number(plan.price) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Uso y Suscripción</h1>
            <p className="mt-2 text-sm text-slate-600">
              Supervisa el consumo de tu cuenta, los límites de tu plan y tu ciclo de facturación actual.
            </p>
          </div>

          {/* Plan Summary Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 mb-8">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {planName}
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Activo
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {planPrice > 0 ? `$${planPrice} USD / mes` : "Plan gratuito sin costo mensual"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ciclo de Facturación</span>
                  <p className="text-sm font-medium text-slate-900">
                    Renovación en <span className="font-bold text-violet-600">{daysRemaining} días</span>
                  </p>
                  {cycleEnd && (
                    <p className="text-xs text-slate-500 mt-1">
                      {cycleEnd.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 sm:px-8 border-t border-slate-200 flex justify-between items-center">
              <p className="text-sm text-slate-600">¿Necesitas más capacidad o mayores límites?</p>
              <Link 
                href="/pricing" 
                className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition"
              >
                Actualizar Plan &rarr;
              </Link>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-4">Límites de Uso Mensual</h3>

          {/* Usage Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            
            {/* Generations Metric */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Generaciones</h4>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-slate-900">{usage?.generations || 0}</span>
                  <span className="text-sm font-medium text-slate-500">de {maxGenerations} / mes</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getPercentage(usage?.generations || 0, maxGenerations))}`} 
                    style={{ width: `${getPercentage(usage?.generations || 0, maxGenerations)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  {getPercentage(usage?.generations || 0, maxGenerations)}% consumido este mes
                </p>
              </div>
            </div>

            {/* Projects Metric */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Proyectos</h4>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-slate-900">{usage?.projects || 0}</span>
                  <span className="text-sm font-medium text-slate-500">de {maxProjects} totales</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getPercentage(usage?.projects || 0, maxProjects))}`} 
                    style={{ width: `${getPercentage(usage?.projects || 0, maxProjects)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">Espacios de trabajo dedicados</p>
              </div>
            </div>

            {/* Workspaces Metric */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Grupos (Workspaces)</h4>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-slate-900">{usage?.workspaces || 0}</span>
                  <span className="text-sm font-medium text-slate-500">de {maxWorkspaces} totales</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getPercentage(usage?.workspaces || 0, maxWorkspaces))}`} 
                    style={{ width: `${getPercentage(usage?.workspaces || 0, maxWorkspaces)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">Grupos de colaboración creados</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
