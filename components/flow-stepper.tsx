"use client";

import Link from "next/link";

export type FlowStep = 1 | 2 | 3 | 4 | 5;

const STEPS: {
  step: FlowStep;
  label: string;
  caption: string;
  page: "sql-imports" | "generations";
}[] = [
  {
    step: 1,
    label: "Importar",
    caption: "Pega o sube tu SQL",
    page: "sql-imports",
  },
  {
    step: 2,
    label: "Revisar estructura",
    caption: "Tablas, columnas y relaciones",
    page: "sql-imports",
  },
  {
    step: 3,
    label: "Configurar reglas",
    caption: "Revisa las advertencias de la IA",
    page: "sql-imports",
  },
  {
    step: 4,
    label: "Generar",
    caption: "SynData crea los datos",
    page: "generations",
  },
  {
    step: 5,
    label: "Exportar",
    caption: "Descarga en tu formato",
    page: "generations",
  },
];

/**
 * Guía visual del flujo importar → revisar → configurar reglas → generar →
 * exportar. Cada paso es clickeable (lleva a la página donde ese paso vive)
 * para que un usuario nuevo entienda en todo momento dónde está y qué sigue,
 * sin depender de documentación externa.
 */
export function FlowStepper({
  projectId,
  currentStep,
}: {
  projectId: string;
  currentStep: FlowStep;
}) {
  return (
    <section
      aria-label="Progreso del flujo de generación de datos"
      className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <ol className="flex min-w-max items-start">
        {STEPS.map(({ step, label, caption, page }, index) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step} className="flex items-start">
              <Link
                href={`/projects/${projectId}/${page}`}
                aria-current={isCurrent ? "step" : undefined}
                className="group flex w-32 flex-col items-center text-center sm:w-36"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-slate-300 bg-white text-slate-400 group-hover:border-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </span>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    isCurrent
                      ? "text-violet-700"
                      : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-500 group-hover:text-slate-700"
                  }`}
                >
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{caption}</p>
              </Link>

              {!isLast && (
                <div
                  className={`mt-[18px] h-0.5 w-8 sm:w-12 ${
                    isCompleted ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
