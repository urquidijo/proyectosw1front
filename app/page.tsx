import Link from 'next/link';
import { listActivePlansRequest } from './lib/plans';

export const revalidate = 60; // SSR with revalidation

export default async function HomePage() {
  const plans = await listActivePlansRequest().catch(() => []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SynData</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-24 pb-32 text-center sm:pt-32">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] -translate-x-1/2  bg-gradient-to from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] "></div>
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Genera datos sintéticos con <span className="text-violet-600">precisión</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-600">
            Crea volúmenes masivos de datos coherentes para tus pruebas a partir de tus propios esquemas SQL. Respeta relaciones, reglas personalizadas y contextos regionales.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-violet-500 transition-all hover:-translate-y-0.5"
            >
              Crea tu primer proyecto
            </Link>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Planes diseñados para tu equipo</h2>
            <p className="mt-4 text-lg text-slate-600">Elige la suscripción que mejor se adapte a tus necesidades de generación de datos.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-4 flex items-baseline gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-slate-900">${plan.price}</span>
                  <span className="text-base text-slate-500">/mes</span>
                </p>
                
                <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-600">
                  <li className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    {plan.maxWorkspaces ? `Hasta ${plan.maxWorkspaces} grupos` : 'Grupos ilimitados'}
                  </li>
                  <li className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    {plan.maxUsersPerWorkspace ? `Hasta ${plan.maxUsersPerWorkspace} usuarios por grupo` : 'Usuarios ilimitados'}
                  </li>
                  <li className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    {plan.maxGenerationsPerMonth ? `Hasta ${plan.maxGenerationsPerMonth} generaciones/mes` : 'Generaciones ilimitadas'}
                  </li>
                  <li className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    Costo de API: ${plan.apiCostPer1kRows} por 1k filas
                  </li>
                </ul>
                
                <Link
                  href="/register"
                  className="mt-8 block rounded-xl bg-slate-900 px-3 py-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-700  focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                >
                  Comenzar con {plan.name}
                </Link>
              </div>
            ))}
            
            {plans.length === 0 && (
              <p className="text-slate-500 col-span-full text-center">No hay planes disponibles por el momento.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        <p className="text-sm text-slate-500">&copy; 2026 SynData. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}