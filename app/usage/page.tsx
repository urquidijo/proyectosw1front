"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState } from "react";
import { CreditCard, Zap, FolderGit2, Users, Key, Copy, Trash2, RefreshCw } from "lucide-react";
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
    rowsGenerated: number;
  };
  apiKey: string | null;
  subscriptionStart: string;
}

export default function UsageDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      if (res.ok) setUsageData(await res.json());
    } catch (e) {
      console.error("Error fetching usage data", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateApiKey() {
    const hasKey = usageData?.apiKey;
    if (hasKey && !confirm("Esto revocará tu clave actual. Las integraciones que la usen dejarán de funcionar. ¿Continuar?")) return;
    setApiKeyLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/me/api-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsageData((prev) => prev ? { ...prev, apiKey: data.apiKey } : prev);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApiKeyLoading(false);
    }
  }

  async function handleRevokeApiKey() {
    if (!confirm("¿Revocar tu API Key? Tus integraciones actuales dejarán de funcionar.")) return;
    setApiKeyLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/me/api-key`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsageData((prev) => prev ? { ...prev, apiKey: null } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setApiKeyLoading(false);
    }
  }

  function handleCopy() {
    if (!usageData?.apiKey) return;
    navigator.clipboard.writeText(usageData.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function maskApiKey(key: string) {
    return key.substring(0, 12) + "•".repeat(20) + key.slice(-4);
  }

  const calculateCycleEnd = (startDateStr: string) => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const now = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), start.getDate());
    if (now > end) end.setMonth(end.getMonth() + 1);
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
              {[0,1,2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200" />)}
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const { plan, usage, subscriptionStart, apiKey } = usageData || {};
  const cycleEnd = calculateCycleEnd(subscriptionStart || "");
  const daysRemaining = cycleEnd
    ? Math.ceil((cycleEnd.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0;

  const maxProjects = plan?.maxProjects ?? 3;
  const maxWorkspaces = plan?.maxWorkspaces ?? 1;
  const maxGenerations = plan?.maxGenerationsPerMonth ?? 10;
  const planName = plan?.name || "Plan Gratuito";
  const planPrice = plan?.price ? Number(plan.price) : 0;

  const generationsUsed = usage?.generations || 0;
  const generationsPct = getPercentage(generationsUsed, maxGenerations);
  
  const rowsUsed = usage?.rowsGenerated || 0;
  const maxRowsNominal = plan?.name.toLowerCase().includes('free') ? 5000 : 50000;

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
              <Link href="/pricing" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition">
                Actualizar Plan &rarr;
              </Link>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-4">Límites de Uso Mensual</h3>

          {/* Usage Metrics */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Generaciones</h4>
              </div>
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-slate-900">{generationsUsed}</span>
                  <span className="text-sm font-medium text-slate-500">de {maxGenerations} / mes</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(generationsPct)}`}
                    style={{ width: `${generationsPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{generationsPct}% consumido este mes</p>
                {generationsPct >= 90 && (
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    Límite casi alcanzado. Las nuevas generaciones serán bloqueadas al 100%.
                  </p>
                )}
              </div>
            </div>

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
                  />
                </div>
                <p className="text-xs text-slate-500">Proyectos creados en tu cuenta</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Grupos</h4>
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
                  />
                </div>
                <p className="text-xs text-slate-500">Grupos de colaboración creados</p>
              </div>
            </div>
          </div>

          {/* Rows Generated Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 mb-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-slate-900">Filas Generadas</h4>
              </div>
              <div className="mt-auto">
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-3xl font-bold text-slate-900">{rowsUsed.toLocaleString()}</span>
                  <span className="text-sm font-medium text-slate-500">/ {maxRowsNominal.toLocaleString()} filas</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getPercentage(rowsUsed, maxRowsNominal))}`}
                    style={{ width: `${getPercentage(rowsUsed, maxRowsNominal)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">Volumen de datos total mensual</p>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <h3 className="text-lg font-bold text-slate-900 mb-4">Acceso por API</h3>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl mt-0.5">
                  <Key className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-slate-900">API Key</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Usa tu clave en el header <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code> para acceder a la API externa.
                  </p>

                  {apiKey ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <code className="flex-1 text-sm font-mono text-slate-700 truncate">{maskApiKey(apiKey)}</code>
                        <button
                          onClick={handleCopy}
                          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-violet-700 transition"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Ejemplo de uso (cURL):</p>
                        <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
{`curl -X POST https://tu-dominio.com/api/v1/projects/{projectId}/generate \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"sqlImportId": "{importId}", "rowConfig": {"users": 100}}'`}
                        </pre>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleGenerateApiKey}
                          disabled={apiKeyLoading}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerar
                        </button>
                        <button
                          onClick={handleRevokeApiKey}
                          disabled={apiKeyLoading}
                          className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Revocar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 mb-3">
                        No tienes una API Key activa. Genera una para empezar a integrar SynData en tus aplicaciones.
                      </p>
                      <button
                        onClick={handleGenerateApiKey}
                        disabled={apiKeyLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition disabled:opacity-50"
                      >
                        <Key className="h-4 w-4" />
                        {apiKeyLoading ? "Generando..." : "Generar API Key"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 sm:px-8">
              <p className="text-xs text-slate-500">
                El endpoint respeta los límites de tu plan. Si alcanzas tu cuota mensual, las peticiones serán rechazadas con un error <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">403</code>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
