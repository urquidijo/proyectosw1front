"use client";

import { Navbar } from "@/components/navbar";
import { SubscriptionPlan, listActivePlansRequest } from "@/app/lib/plans";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUser, getToken } from "@/app/lib/auth";
import { createCheckoutSessionRequest } from "@/app/lib/payments";
import { useRouter, useSearchParams } from "next/navigation";

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansPageContent />
    </Suspense>
  );
}

function PlansPageContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlanId, setUserPlanId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    const initUser = async () => {
      const user = getStoredUser();
      if (user?.plan) {
        setUserPlanId(user.plan.id);
      }
      
      const sessionId = searchParams.get("session_id");
      
      if (success) {
        const token = getToken();
        if (token) {
          try {
            if (sessionId) {
              const { verifyCheckoutSessionRequest } = await import("@/app/lib/payments");
              await verifyCheckoutSessionRequest(token, sessionId);
            }
            const { getMeRequest } = await import("@/app/lib/auth");
            const refreshedUser = await getMeRequest(token);
            // We need to save the refreshed user to localStorage
            const USER_KEY = 'syndata_user';
            localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
            if (refreshedUser.plan) {
              setUserPlanId(refreshedUser.plan.id);
            }
          } catch (e) {
            console.error("Error refreshing user", e);
          }
        }
      }
    };
    initUser();
    
    listActivePlansRequest()
      .then(data => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    const token = getToken();
    if (!token) {
      router.push("/login?redirect=/plans");
      return;
    }

    try {
      setProcessingId(planId);
      const data = await createCheckoutSessionRequest(token, planId);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error al procesar el pago", error);
      alert("Hubo un error al procesar el pago. Inténtalo de nuevo.");
      setProcessingId(null);
    }
  };

  const groupPlans = plans.filter(p => p.type === 'GROUP' || p.type === 'INDIVIDUAL');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Planes y Suscripciones</h1>
          <p className="mt-4 text-lg text-slate-600">Escala tu generación de datos con el plan que mejor se adapte a tu equipo.</p>
        </div>

        {success && (
          <div className="mb-8 rounded-xl bg-emerald-50 p-4 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-800 text-center">¡Suscripción actualizada con éxito! Tu nuevo plan ya está activo.</p>
          </div>
        )}

        {canceled && (
          <div className="mb-8 rounded-xl bg-amber-50 p-4 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 text-center">El proceso de pago fue cancelado. No se han realizado cargos.</p>
          </div>
        )}

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
                        {plan.type !== 'INDIVIDUAL' && (
                          <>
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
                          </>
                        )}
                        <li className="flex gap-3">
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span><strong>{plan.maxGenerationsPerMonth || 'Ilimitadas'}</strong> generaciones/mes</span>
                        </li>
                      </ul>
                      
                      <button 
                        onClick={() => handleSubscribe(plan.id)}
                        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition flex items-center justify-center ${userPlanId === plan.id ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`} 
                        disabled={userPlanId === plan.id || processingId === plan.id}
                      >
                        {processingId === plan.id ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : userPlanId === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
