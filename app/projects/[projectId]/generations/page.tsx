'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/navbar';
import { getToken } from '@/app/lib/auth';
import {
  createGenerationRequest,
  downloadGenerationSqlRequest,
  getGenerationRequest,
  listGenerationsRequest,
} from '@/app/lib/generations';
import { listSqlImportsRequest } from '@/app/lib/sql-imports';
import {
  CreatedGenerationResponse,
  Generation,
  GeneratedRow,
} from '@/app/types/generation';
import { SqlImport } from '@/app/types/sql-import';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

export default function GenerationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const sqlImportIdFromUrl = searchParams.get('sqlImportId');

  const [validImports, setValidImports] = useState<SqlImport[]>([]);
  const [selectedImportId, setSelectedImportId] = useState('');
  const [rowConfig, setRowConfig] = useState<Record<string, string>>({});

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<
    Generation | CreatedGenerationResponse | null
  >(null);

  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [error, setError] = useState('');

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
      defaultConfig[table.name] = '10';
    });

    setRowConfig(defaultConfig);
  }, [selectedImport]);

  async function loadInitialData() {
    setError('');
    setLoadingData(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error('No existe una sesión activa');
      }

      if (!projectId) {
        throw new Error('Proyecto no válido');
      }

      const [importsData, generationsData] = await Promise.all([
        listSqlImportsRequest(token, projectId),
        listGenerationsRequest(token, projectId),
      ]);

      const onlyValidImports = importsData.filter(
        (item) => item.status === 'VALID',
      );

      setValidImports(onlyValidImports);
      setGenerations(generationsData);

      if (onlyValidImports.length > 0) {
        const importFromUrl = onlyValidImports.find(
          (item) => item.id === sqlImportIdFromUrl,
        );

        setSelectedImportId(
          importFromUrl?.id ?? onlyValidImports[0].id,
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error al cargar los datos de generación',
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
    setError('');

    if (!selectedImport) {
      setError('Debes seleccionar una importación SQL válida');
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
        throw new Error('No existe una sesión activa');
      }

      if (!projectId) {
        throw new Error('Proyecto no válido');
      }

      const createdGeneration = await createGenerationRequest(
        token,
        projectId,
        {
          sqlImportId: selectedImport.id,
          rowConfig: normalizedRowConfig,
        },
      );

      setSelectedGeneration(createdGeneration);
      setGenerations((currentGenerations) => [
        createdGeneration,
        ...currentGenerations,
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error al generar los datos',
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectGeneration(generationId: string) {
    setError('');
    setLoadingGeneration(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error('No existe una sesión activa');
      }

      if (!projectId) {
        throw new Error('Proyecto no válido');
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
          : 'Error al cargar la generación',
      );
    } finally {
      setLoadingGeneration(false);
    }
  }

  async function handleDownload(generationId: string) {
    setError('');
    setDownloadingId(generationId);

    try {
      const token = getToken();

      if (!token) {
        throw new Error('No existe una sesión activa');
      }

      if (!projectId) {
        throw new Error('Proyecto no válido');
      }

      const blob = await downloadGenerationSqlRequest(
        token,
        projectId,
        generationId,
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

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
          : 'Error al descargar el archivo SQL',
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function renderPreviewTable(tableName: string, rows: GeneratedRow[]) {
    if (rows.length === 0) {
      return (
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          No hay filas para mostrar.
        </div>
      );
    }

    const columns = Object.keys(rows[0]);

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500"
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
                className="border-b border-slate-100 last:border-b-0"
              >
                {columns.map((column) => (
                  <td
                    key={`${tableName}-${rowIndex}-${column}`}
                    className="whitespace-nowrap px-4 py-3 text-slate-700"
                  >
                    {row[column] === null ? 'NULL' : String(row[column])}
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
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Volver al proyecto
          </Link>

          <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Generación sintética
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Generar datos desde una estructura SQL
            </h1>

            <p className="mt-4 max-w-3xl text-slate-600">
              Selecciona una importación SQL válida, define cuántos registros
              necesitas por tabla y SynData generará datos coherentes respetando
              las relaciones detectadas.
            </p>
          </section>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingData ? (
            <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                Cargando módulo de generación...
              </p>
            </section>
          ) : validImports.length === 0 ? (
            <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                No hay importaciones SQL válidas
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Primero debes analizar al menos un script SQL válido para poder
                generar datos.
              </p>

              <Link
                href={`/projects/${projectId}/sql-imports`}
                className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Ir al importador SQL
              </Link>
            </section>
          ) : (
            <>
              <section className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">
                    Configurar generación
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Elige el esquema base y la cantidad de filas por tabla.
                  </p>

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
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-slate-900"
                      >
                        {validImports.map((item) => (
                          <option key={item.id} value={item.id}>
                            {new Date(item.createdAt).toLocaleString()} -{' '}
                            {item.schemaJson?.tables.length ?? 0} tablas
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedImport?.schemaJson?.tables.map((table) => (
                      <div key={table.name}>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Filas para {table.name}
                        </label>

                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={rowConfig[table.name] ?? ''}
                          onChange={(event) =>
                            handleRowConfigChange(
                              table.name,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                          required
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generating ? 'Generando...' : 'Generar datos'}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Vista previa
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Se muestran hasta 5 filas por tabla.
                      </p>
                    </div>

                    {selectedGeneration && (
                      <button
                        type="button"
                        onClick={() => handleDownload(selectedGeneration.id)}
                        disabled={downloadingId === selectedGeneration.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingId === selectedGeneration.id
                          ? 'Descargando...'
                          : 'Descargar inserts.sql'}
                      </button>
                    )}
                  </div>

                  {!selectedGeneration ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                      <p className="font-medium text-slate-800">
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
                  ) : (
                    <div className="mt-6 space-y-6">
                      {'orderedTables' in selectedGeneration && (
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Orden de generación
                          </p>

                          <p className="mt-2 text-sm text-slate-700">
                            {selectedGeneration.orderedTables.join(' → ')}
                          </p>
                        </div>
                      )}

                      {Object.entries(selectedGeneration.previewJson).map(
                        ([tableName, rows]) => (
                          <article key={tableName}>
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="font-semibold text-slate-900">
                                {tableName}
                              </h3>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {rows.length} filas en vista previa
                              </span>
                            </div>

                            {renderPreviewTable(tableName, rows)}
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Historial de generaciones
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Archivos SQL generados anteriormente en este proyecto.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {generations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                      <p className="text-sm text-slate-500">
                        Aún no hay generaciones registradas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {generations.map((generation) => (
                        <article
                          key={generation.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                Generación del{' '}
                                {new Date(generation.createdAt).toLocaleString()}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {Object.entries(generation.rowConfig)
                                  .map(([table, count]) => `${table}: ${count}`)
                                  .join(' · ')}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectGeneration(generation.id)
                                }
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                              >
                                Ver
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDownload(generation.id)
                                }
                                disabled={downloadingId === generation.id}
                                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {downloadingId === generation.id
                                  ? 'Descargando...'
                                  : 'Descargar'}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}