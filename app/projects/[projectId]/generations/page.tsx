"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken } from "@/app/lib/auth";
import {
  createGenerationRequest,
  downloadGenerationSqlRequest,
  getGenerationRequest,
  listGenerationsRequest,
  getGenerationStatusRequest,
  suggestVolumesRequest,
} from "@/app/lib/generations";
import { listSqlImportsRequest } from "@/app/lib/sql-imports";
import {
  CreatedGenerationResponse,
  Generation,
  GeneratedRow,
} from "@/app/types/generation";
import { SqlImport } from "@/app/types/sql-import";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function GenerationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const sqlImportIdFromUrl = searchParams.get("sqlImportId");

  const [validImports, setValidImports] = useState<SqlImport[]>([]);
  const [selectedImportId, setSelectedImportId] = useState("");

  const [rowConfig, setRowConfig] = useState<Record<string, string>>({});

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<
    Generation | CreatedGenerationResponse | null
  >(null);

  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [region, setRegion] = useState("BOLIVIA");
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!selectedGeneration || !projectId) return;
    if (
      selectedGeneration.status !== "PENDING" &&
      selectedGeneration.status !== "PROCESSING"
    )
      return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const token = getToken();
        if (!token) return;

        const statusData = await getGenerationStatusRequest(
          token,
          projectId,
          selectedGeneration.id,
        );

        if (!active) return;

        setSelectedGeneration((current) => {
          if (!current || current.id !== selectedGeneration.id) return current;
          return {
            ...current,
            status: statusData.status as any,
            progress: statusData.progress,
            error: statusData.error,
          };
        });

        if (
          statusData.status === "COMPLETED" ||
          statusData.status === "FAILED"
        ) {
          clearInterval(interval);
          // Refresh list
          const latestGenerations = await listGenerationsRequest(
            token,
            projectId,
          );
          setGenerations(latestGenerations);

          // If completed, fetch full details to render preview
          if (statusData.status === "COMPLETED") {
            const fullGen = await getGenerationRequest(
              token,
              projectId,
              selectedGeneration.id,
            );
            setSelectedGeneration(fullGen);
          }
        }
      } catch (err) {
        console.error("Error polling generation status:", err);
      }
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedGeneration?.id, selectedGeneration?.status, projectId]);

  async function handleSuggestVolumes() {
    if (!selectedImportId) return;
    setError("");
    setSuggesting(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const suggestions = await suggestVolumesRequest(
        token,
        projectId,
        selectedImportId,
      );

      const newConfig: Record<string, string> = {};
      Object.entries(suggestions).forEach(([table, val]) => {
        newConfig[table] = String(val);
      });

      setRowConfig(newConfig);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al obtener sugerencias de volumen",
      );
    } finally {
      setSuggesting(false);
    }
  }

  const selectedImport = useMemo(
    () => validImports.find((item) => item.id === selectedImportId) ?? null,
    [validImports, selectedImportId],
  );

  useEffect(() => {
    if (projectId) {
      loadInitialData();
    }
  }, [projectId]);

  useEffect(() => {
    if (!selectedImport?.schemaJson?.tables) return;

    const defaultConfig: Record<string, string> = {};

    selectedImport.schemaJson.tables.forEach((table) => {
      defaultConfig[table.name] = "10";
    });

    setRowConfig(defaultConfig);
  }, [selectedImport]);

  async function loadInitialData() {
    setError("");
    setLoadingData(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const [importsData, generationsData] = await Promise.all([
        listSqlImportsRequest(token, projectId),
        listGenerationsRequest(token, projectId),
      ]);

      const onlyValidImports = importsData.filter(
        (item) => item.status === "VALID",
      );

      setValidImports(onlyValidImports);
      setGenerations(generationsData);

      if (onlyValidImports.length > 0) {
        const importFromUrl = onlyValidImports.find(
          (item) => item.id === sqlImportIdFromUrl,
        );

        setSelectedImportId(importFromUrl?.id ?? onlyValidImports[0].id);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar los datos de generación",
      );
    } finally {
      setLoadingData(false);
    }
  }

  function handleRowConfigChange(tableName: string, value: string) {
    setRowConfig((currentConfig) => ({
      ...currentConfig,
      [tableName]: value,
    }));
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedImport) {
      setError("Debes seleccionar una importación SQL válida");
      return;
    }

    const normalizedRowConfig: Record<string, number> = {};

    for (const table of selectedImport.schemaJson?.tables ?? []) {
      const rawValue = rowConfig[table.name];
      const value = Number(rawValue);

      if (!Number.isInteger(value) || value < 1) {
        setError(
          `Debes indicar una cantidad entera mayor a 0 para la tabla "${table.name}"`,
        );
        return;
      }

      normalizedRowConfig[table.name] = value;
    }

    setGenerating(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const createdGeneration = await createGenerationRequest(
        token,
        projectId,
        {
          sqlImportId: selectedImport.id,
          rowConfig: normalizedRowConfig,
          region,
        },
      );

      setSelectedGeneration(createdGeneration);
      setGenerations((currentGenerations) => [
        createdGeneration,
        ...currentGenerations,
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al generar los datos",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectGeneration(generationId: string) {
    setError("");
    setLoadingGeneration(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const generation = await getGenerationRequest(
        token,
        projectId,
        generationId,
      );

      setSelectedGeneration(generation);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar la generación",
      );
    } finally {
      setLoadingGeneration(false);
    }
  }
  const selectedTables = useMemo(
    () => selectedImport?.schemaJson?.tables ?? [],
    [selectedImport],
  );

  const totalRequestedRows = useMemo(
    () =>
      Object.values(rowConfig).reduce((total, value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? total + parsed : total;
      }, 0),
    [rowConfig],
  );

  const generationTableCount = useMemo(
    () => Object.keys(selectedGeneration?.previewJson ?? {}).length,
    [selectedGeneration],
  );

  async function handleDownload(generationId: string) {
    setError("");
    setDownloadingId(generationId);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const blob = await downloadGenerationSqlRequest(
        token,
        projectId,
        generationId,
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `syndata-${generationId}.sql`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al descargar el archivo SQL",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function renderPreviewTable(tableName: string, rows: GeneratedRow[]) {
    if (rows.length === 0) {
      return (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No hay filas para mostrar.
        </div>
      );
    }

    const columns = Object.keys(rows[0]);

    return (
      <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${tableName}-${rowIndex}`}
                className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
              >
                {columns.map((column) => (
                  <td
                    key={`${tableName}-${rowIndex}-${column}`}
                    className="whitespace-nowrap px-4 py-3 text-slate-700"
                  >
                    {row[column] === null ? "NULL" : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100">
        <Navbar />

        <main className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver al proyecto
          </Link>

          <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-100 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-emerald-100 blur-3xl" />

            <div className="relative">
              <p className="text-sm font-semibold text-violet-600">
                Generación sintética
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Generar datos desde una estructura SQL
              </h1>

              <p className="mt-4 max-w-3xl text-slate-600">
                Selecciona una importación SQL válida, define cuántos registros
                necesitas por tabla y SynData generará datos coherentes
                respetando las relaciones y reglas detectadas.
              </p>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingData ? (
            <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-8 w-72 rounded bg-slate-200" />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="h-24 rounded-2xl bg-slate-100" />
                  <div className="h-24 rounded-2xl bg-slate-100" />
                  <div className="h-24 rounded-2xl bg-slate-100" />
                </div>
              </div>
            </section>
          ) : validImports.length === 0 ? (
            <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="m7 10 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 20h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                No hay importaciones SQL válidas
              </h2>

              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Primero debes analizar al menos un script SQL válido para poder
                generar datos sintéticos.
              </p>

              <Link
                href={`/projects/${projectId}/sql-imports`}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Ir al importador SQL
              </Link>
            </section>
          ) : (
            <>
              <section className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tablas del esquema
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {selectedTables.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Filas solicitadas
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {totalRequestedRows}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Generaciones registradas
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {generations.length}
                  </p>
                </div>
              </section>

              <section className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                <aside className="xl:sticky xl:top-24 xl:self-start">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Configurar generación
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Elige el esquema base, región e introduce filas.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSuggestVolumes}
                        disabled={suggesting || !selectedImportId}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 border border-violet-200 hover:border-violet-300 bg-violet-50 hover:bg-violet-100 rounded-xl px-3 py-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {suggesting ? "Sugiriendo..." : "Sugerir volúmenes"}
                      </button>
                    </div>

                    <form onSubmit={handleGenerate} className="mt-6 space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Importación SQL
                        </label>

                        <select
                          value={selectedImportId}
                          onChange={(event) =>
                            setSelectedImportId(event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                        >
                          {validImports.map((item) => (
                            <option key={item.id} value={item.id}>
                              {new Date(item.createdAt).toLocaleString()} -{" "}
                              {item.schemaJson?.tables.length ?? 0} tablas
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Región de Localización
                        </label>

                        <select
                          value={region}
                          onChange={(event) => setRegion(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                        >
                          <optgroup label="Español">
                            <option value="BOLIVIA">Bolivia (Auténtico: ciudades, nombres, etc.)</option>
                            <option value="ARGENTINA">Argentina</option>
                            <option value="CHILE">Chile</option>
                            <option value="COLOMBIA">Colombia</option>
                            <option value="MEXICO">México</option>
                            <option value="ESPAÑA">España</option>
                            <option value="GENERIC">Genérico (Español estándar)</option>
                          </optgroup>
                          <optgroup label="English">
                            <option value="USA">Estados Unidos (English data)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="max-h-110 space-y-4 overflow-y-auto pr-1">
                        {selectedTables.map((table) => (
                          <div
                            key={table.name}
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <label className="block text-sm font-semibold text-slate-800">
                              {table.name}
                            </label>

                            <p className="mt-1 text-xs text-slate-500">
                              Cantidad de filas a generar
                            </p>

                            <input
                              type="number"
                              min={1}
                              max={10000}
                              value={rowConfig[table.name] ?? ""}
                              onChange={(event) =>
                                handleRowConfigChange(
                                  table.name,
                                  event.target.value,
                                )
                              }
                              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={generating}
                        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {generating ? "Generando..." : "Generar datos"}
                      </button>
                    </form>
                  </div>
                </aside>

                <div className="min-w-0 space-y-6">
                  <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Vista previa
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Se muestran hasta 5 filas por tabla generada.
                        </p>
                      </div>

                      {selectedGeneration && (
                        <button
                          type="button"
                          onClick={() => handleDownload(selectedGeneration.id)}
                          disabled={downloadingId === selectedGeneration.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 3v12"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="m7 10 5 5 5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 20h14"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>

                          {downloadingId === selectedGeneration.id
                            ? "Descargando..."
                            : "Descargar inserts.sql"}
                        </button>
                      )}
                    </div>

                    {!selectedGeneration ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M7 4v6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M17 4v6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <rect
                              x="4"
                              y="7"
                              width="16"
                              height="13"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </div>

                        <p className="mt-4 font-medium text-slate-800">
                          Aún no generaste datos
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Configura las cantidades y presiona “Generar datos”.
                        </p>
                      </div>
                    ) : loadingGeneration ? (
                      <p className="mt-6 text-sm text-slate-500">
                        Cargando generación...
                      </p>
                    ) : selectedGeneration.status === "PENDING" ||
                      selectedGeneration.status === "PROCESSING" ? (
                      <div className="mt-6 rounded-2xl border border-slate-200 p-6 bg-slate-50 text-center">
                        <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                          <span>
                            {selectedGeneration.status === "PENDING"
                              ? "En cola de procesamiento..."
                              : "Generando datos sintéticos..."}
                          </span>
                          <span>{selectedGeneration.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3.5 mb-4">
                          <div
                            className="bg-violet-600 h-3.5 rounded-full transition-all duration-300"
                            style={{ width: `${selectedGeneration.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Esto puede tardar unos segundos según la cantidad de datos solicitada. Por favor, no cierres la ventana.
                        </p>
                      </div>
                    ) : selectedGeneration.status === "FAILED" ? (
                      <div className="mt-6 rounded-2xl border border-red-200 p-6 bg-red-50 text-center">
                        <p className="font-semibold text-red-800">
                          La generación falló
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                          {selectedGeneration.error || "Error desconocido"}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-5">
                        {"orderedTables" in selectedGeneration && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Orden de generación
                            </p>

                            <p className="mt-2 text-sm text-slate-700">
                              {selectedGeneration.orderedTables.join(" → ")}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {generationTableCount} tablas generadas
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            Vista previa de hasta 5 filas por tabla
                          </span>
                        </div>

                        {Object.entries(selectedGeneration.previewJson).map(
                          ([tableName, rows]) => (
                            <details
                              key={tableName}
                              className="group min-w-0 rounded-2xl border border-slate-200 p-4"
                              open
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-slate-900">
                                    {tableName}
                                  </h3>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {rows.length} filas en vista previa
                                  </p>
                                </div>

                                <span className="text-xs font-medium text-slate-500 group-open:hidden">
                                  Ver
                                </span>

                                <span className="hidden text-xs font-medium text-slate-500 group-open:inline">
                                  Ocultar
                                </span>
                              </summary>

                              <div className="mt-4">
                                {renderPreviewTable(tableName, rows)}
                              </div>
                            </details>
                          ),
                        )}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Historial de generaciones
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Archivos SQL generados anteriormente en este proyecto.
                      </p>
                    </div>

                    <div className="mt-6">
                      {generations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                          <p className="text-sm text-slate-500">
                            Aún no hay generaciones registradas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {generations.map((generation) => (
                            <article
                              key={generation.id}
                              className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">
                                    Generación del{" "}
                                    {new Date(
                                      generation.createdAt,
                                    ).toLocaleString()}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {Object.entries(generation.rowConfig).map(
                                      ([table, count]) => (
                                        <span
                                          key={`${generation.id}-${table}`}
                                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                                        >
                                          {table}: {String(count)}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>

                                <div className="flex shrink-0 gap-2 lg:justify-self-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectGeneration(generation.id)
                                    }
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                  >
                                    Ver
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownload(generation.id)
                                    }
                                    disabled={downloadingId === generation.id}
                                    className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {downloadingId === generation.id
                                      ? "Descargando..."
                                      : "Descargar"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
