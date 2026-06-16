"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { listActivePlansRequest, SubscriptionPlan } from "@/app/lib/plans";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listActivePlansRequest()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100 font-sans">
        <Navbar />
        
        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Actualiza tu cuenta
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades. Más grupos, más miembros y mayor capacidad de generación.
            </p>
          </div>

          {loading ? (
            <p className="text-center mt-12 text-slate-500">Cargando planes...</p>
          ) : (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md flex flex-col">
                  <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-4 flex items-baseline gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-slate-900">${plan.price}</span>
                    <span className="text-base text-slate-500">/mes</span>
                  </p>
                  
                  <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-600 flex-1">
                    <li className="flex gap-x-3">
                      <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {plan.maxWorkspaces ? `Hasta ${plan.maxWorkspaces} grupos` : 'Grupos ilimitados'}
                    </li>
                    <li className="flex gap-x-3">
                      <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {plan.maxUsersPerWorkspace ? `Hasta ${plan.maxUsersPerWorkspace} miembros por grupo` : 'Miembros ilimitados'}
                    </li>
                    <li className="flex gap-x-3">
                      <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {plan.maxGenerationsPerMonth ? `Hasta ${plan.maxGenerationsPerMonth} generaciones/mes` : 'Generaciones ilimitadas'}
                    </li>
                    <li className="flex gap-x-3">
                      <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      Costo API: ${plan.apiCostPer1kRows} por 1k filas
                    </li>
                  </ul>
                  
                  <button
                    className="mt-8 block w-full rounded-xl bg-slate-900 px-3 py-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-700 transition"
                  >
                    Actualizar a {plan.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
