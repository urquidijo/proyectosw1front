import Link from 'next/link';


export const revalidate = 60; // SSR with revalidation

export default async function HomePage() {
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
              href="/plans"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Planes
            </Link>
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


      </main>

      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        <p className="text-sm text-slate-500">&copy; 2026 SynData. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}