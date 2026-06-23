"use client";

import { getToken } from "@/app/lib/auth";
import {
  downloadGenerationExportRequest,
  triggerBlobDownload,
  getExportFormats,
  ExportEngine,
  ExportFormat,
} from "@/app/lib/exports";
import { useEffect, useRef, useState } from "react";

type ExportMenuProps = {
  projectId: string;
  generationId: string;
  /** Si se indica, exporta solo esa tabla (el dump nativo no admite este filtro). */
  table?: string;
  /** Motor de la generación: adapta la etiqueta del dump nativo (SQL vs MongoDB). */
  engine?: ExportEngine;
  label?: string;
  onError?: (message: string) => void;
  className?: string;
};

export function ExportMenu({
  projectId,
  generationId,
  table,
  engine,
  label = "Exportar",
  onError,
  className = "",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allFormats = getExportFormats(engine);
  const formats = table
    ? allFormats.filter((format) => format.value !== "sql")
    : allFormats;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleExport(format: ExportFormat) {
    setOpen(false);
    setLoadingFormat(format);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      const { blob, filename } = await downloadGenerationExportRequest(
        token,
        projectId,
        generationId,
        format,
        table,
      );

      triggerBlobDownload(blob, filename);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "No se pudo exportar la generación",
      );
    } finally {
      setLoadingFormat(null);
    }
  }

  const isBusy = loadingFormat !== null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>

        {isBusy
          ? `Exportando ${loadingFormat.toUpperCase()}...`
          : label}

        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {formats.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => handleExport(format.value)}
              className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <span className="text-sm font-semibold text-slate-900">
                {format.label}
              </span>
              <span className="text-xs text-slate-500">{format.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
