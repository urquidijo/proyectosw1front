"use client";

import { Navbar } from "@/components/navbar";
import { SubscriptionPlan, listActivePlansRequest } from "@/app/lib/plans";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUser } from "@/app/lib/auth";

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlanId, setUserPlanId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.plan) {
      setUserPlanId(user.plan.id);
    }
    
    listActivePlansRequest()
      .then(data => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const groupPlans = plans.filter(p => p.type === 'GROUP' || p.type === 'INDIVIDUAL' || p.type === 'PERSONAL');
  const apiPlans = plans.filter(p => p.type === 'API_USAGE');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Planes y Suscripciones</h1>
          <p className="mt-4 text-lg text-slate-600">Escala tu generación de datos con el plan que mejor se adapte a tu equipo.</p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Cargando planes...</p>
        ) : (
          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Planes de Sistema</h2>
              {groupPlans.length === 0 ? (
                <p className="text-center text-slate-500">No hay planes disponibles por el momento.</p>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {groupPlans.map(plan => (
                    <div key={plan.id} className={`rounded-3xl border p-8 flex flex-col bg-white shadow-sm hover:shadow-md transition ${userPlanId === plan.id ? 'border-violet-500 ring-1 ring-violet-500' : 'border-slate-200'}`}>
                      <div className="mb-6">
                        {userPlanId === plan.id && <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 mb-4">Tu plan actual</span>}
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                          ${Number(plan.price).toFixed(2)}
                          <span className="ml-1 text-lg font-medium text-slate-500">/mes</span>
                        </div>
                      </div>
                      
                      <ul className="mb-8 space-y-4 flex-1 text-sm text-slate-600">
                        <li className="flex gap-3">
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span>Hasta <strong>{plan.maxProjects || 'ilimitados'}</strong> proyectos</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span>Crea hasta <strong>{plan.maxWorkspaces || 'ilimitados'}</strong> grupos</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span><strong>{plan.maxUsersPerWorkspace || 'Ilimitados'}</strong> usuarios por grupo</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span><strong>{plan.maxGenerationsPerMonth || 'Ilimitadas'}</strong> generaciones/mes</span>
                        </li>
                      </ul>
                      
                      <button className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${userPlanId === plan.id ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`} disabled={userPlanId === plan.id}>
                        {userPlanId === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {apiPlans.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Complementos de API</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {apiPlans.map(plan => (
                    <div key={plan.id} className="rounded-3xl border border-slate-200 p-8 flex flex-col bg-white shadow-sm hover:shadow-md transition">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                          ${Number(plan.apiCostPer1kRows).toFixed(2)}
                          <span className="ml-1 text-lg font-medium text-slate-500">/ 1k filas</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-8 flex-1">
                        Ideal para integraciones externas y generación bajo demanda automatizada.
                      </p>
                      <button className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition">
                        Contratar API
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
