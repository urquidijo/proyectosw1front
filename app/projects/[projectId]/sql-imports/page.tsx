"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken } from "@/app/lib/auth";
import {
  createSqlImportRequest,
  deleteSqlImportRequest,
  getSqlImportRequest,
  listSqlImportsRequest,
} from "@/app/lib/sql-imports";
import {
  SqlImport,
  SqlImportEngine,
  SqlImportDialect,
} from "@/app/types/sql-import";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  analyzeGenerationPlanRequest,
  getGenerationPlanRequest,
  PlanLanguage,
} from "@/app/lib/generation-plans";
import { GenerationPlan, PlanRule } from "@/app/types/generation-plan";
import { generateSqlSchemaRequest } from "@/app/lib/sql-schema-generator";
import { GeneratedSqlSchema } from "@/app/types/generated-sql-schema";

type DbTypeKey = "POSTGRESQL" | "MYSQL" | "MONGODB";

/**
 * Una sola elección visual (como el selector de conexión de TablePlus) que
 * resuelve dos decisiones a la vez: la sintaxis del DDL pegado (`dialect`) y
 * el motor sobre el que se generarán los datos (`engine`). MySQL es un motor
 * relacional sin un formato de dump propio en esta app, así que reutiliza el
 * dump SQL genérico (mismo INSERT INTO que PostgreSQL).
 */
const DB_TYPE_OPTIONS: {
  key: DbTypeKey;
  label: string;
  initials: string;
  badgeClassName: string;
  dialect: SqlImportDialect;
  engine: SqlImportEngine;
}[] = [
  {
    key: "POSTGRESQL",
    label: "PostgreSQL",
    initials: "Pg",
    badgeClassName: "bg-sky-600",
    dialect: "POSTGRESQL",
    engine: "POSTGRESQL",
  },
  {
    key: "MYSQL",
    label: "MySQL",
    initials: "My",
    badgeClassName: "bg-orange-500",
    dialect: "MYSQL",
    engine: "POSTGRESQL",
  },
  {
    key: "MONGODB",
    label: "MongoDB",
    initials: "Mo",
    badgeClassName: "bg-emerald-600",
    dialect: "POSTGRESQL",
    engine: "MONGODB",
  },
];

const EXAMPLE_SQL_BY_DIALECT: Record<SqlImportDialect, string> = {
  POSTGRESQL: `CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100),
  telefono VARCHAR(20)
);

CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  fecha DATE,
  total DECIMAL(10,2)
);`,
  MYSQL: `CREATE TABLE \`clientes\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nombre\` VARCHAR(100),
  \`email\` VARCHAR(100),
  \`telefono\` VARCHAR(20),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`pedidos\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`cliente_id\` INT NOT NULL,
  \`fecha\` DATE,
  \`total\` DECIMAL(10,2),
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`cliente_id\`) REFERENCES \`clientes\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
};

export default function SqlImportsPage() {
  const params = useParams();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [sql, setSql] = useState("");
  const [dbType, setDbType] = useState<DbTypeKey>("POSTGRESQL");
  const { dialect, engine } = useMemo(
    () => DB_TYPE_OPTIONS.find((option) => option.key === dbType)!,
    [dbType],
  );
  const [imports, setImports] = useState<SqlImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<SqlImport | null>(null);

  const [loadingImports, setLoadingImports] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(
    null,
  );

  const [analyzingPlan, setAnalyzingPlan] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planLanguage, setPlanLanguage] = useState<PlanLanguage>("es");
  type SqlInputMode = "manual" | "file" | "ai";

  const [sqlInputMode, setSqlInputMode] = useState<SqlInputMode>("manual");
  const [schemaDescription, setSchemaDescription] = useState("");
  const [generatingSqlSchema, setGeneratingSqlSchema] = useState(false);
  const [generatedSqlSchema, setGeneratedSqlSchema] =
    useState<GeneratedSqlSchema | null>(null);

  useEffect(() => {
    if (projectId) {
      loadImports();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedImport?.id && projectId) {
      loadGenerationPlan(selectedImport.id);
    } else {
      setGenerationPlan(null);
    }
  }, [selectedImport?.id, projectId]);

  async function loadImports() {
    setError("");
    setLoadingImports(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const data = await listSqlImportsRequest(token, projectId);
      setImports(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar las importaciones SQL",
      );
    } finally {
      setLoadingImports(false);
    }
  }

  async function handleGenerateSqlFromDescription() {
    setError("");

    if (!schemaDescription.trim()) {
      setError("Debes describir la base de datos que quieres crear");
      return;
    }

    setGeneratingSqlSchema(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const generated = await generateSqlSchemaRequest(
        token,
        projectId,
        schemaDescription,
        dialect,
      );

      setGeneratedSqlSchema(generated);
      setSql(generated.sql);
      setFileName("");
      setSelectedImport(null);
      setGenerationPlan(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al generar el esquema SQL con IA",
      );
    } finally {
      setGeneratingSqlSchema(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".sql")) {
      setError("Por ahora solo se permiten archivos .sql");
      return;
    }

    const content = await file.text();

    setSql(content);
    setFileName(file.name);
    setGeneratedSqlSchema(null);
    setSelectedImport(null);
    setGenerationPlan(null);
    setError("");
  }
  function loadExampleSql() {
    setSql(EXAMPLE_SQL_BY_DIALECT[dialect]);
    setSqlInputMode("manual");
    setFileName("");
    setGeneratedSqlSchema(null);
    setSelectedImport(null);
    setGenerationPlan(null);
  }
  function clearEditor() {
    setSql("");
    setFileName("");
    setSchemaDescription("");
    setGeneratedSqlSchema(null);
    setSelectedImport(null);
    setGenerationPlan(null);
    setError("");
  }

  async function loadGenerationPlan(importId: string) {
    setLoadingPlan(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const plan = await getGenerationPlanRequest(token, projectId, importId);
      setGenerationPlan(plan);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Plan de generación no encontrado")
      ) {
        setGenerationPlan(null);
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar el plan de generación",
      );
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleAnalyzeGenerationPlan() {
    if (!selectedImport) {
      setError("Debes seleccionar una importación SQL");
      return;
    }

    if (selectedImport.status !== "VALID") {
      setError("Solo puedes analizar con IA una importación SQL válida");
      return;
    }

    setError("");
    setAnalyzingPlan(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const plan = await analyzeGenerationPlanRequest(
        token,
        projectId,
        selectedImport.id,
        planLanguage,
      );

      setGenerationPlan(plan);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al analizar la coherencia con IA",
      );
    } finally {
      setAnalyzingPlan(false);
    }
  }

  function formatRule(rule: PlanRule): string {
    switch (rule.type) {
      case "COPY_FROM_REFERENCE":
        return `${rule.targetTable}.${rule.targetColumn} toma el valor de ${rule.sourceTable}.${rule.sourceColumn} mediante ${rule.viaForeignKey}`;

      case "BINARY_OPERATION":
        return `${rule.targetTable}.${rule.targetColumn} = ${rule.leftColumn} ${formatOperator(
          rule.operator,
        )} ${rule.rightColumn}`;

      case "AGGREGATE_CHILDREN":
        return `${rule.targetTable}.${rule.targetColumn} = ${rule.aggregate}(${rule.childTable}.${rule.childColumn})`;

      case "DATE_RELATION":
        return `${rule.targetTable}.${rule.targetColumn} debe ser ${formatDateRelation(
          rule.dateRelation,
        )} ${rule.referenceColumn}`;

      default:
        return rule.description;
    }
  }

  function formatOperator(
    operator: "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE" | null,
  ) {
    switch (operator) {
      case "ADD":
        return "+";
      case "SUBTRACT":
        return "-";
      case "MULTIPLY":
        return "×";
      case "DIVIDE":
        return "÷";
      default:
        return "?";
    }
  }

  function formatDateRelation(
    relation: "AFTER" | "BEFORE" | "ON_OR_AFTER" | "ON_OR_BEFORE" | null,
  ) {
    switch (relation) {
      case "AFTER":
        return "posterior a";
      case "BEFORE":
        return "anterior a";
      case "ON_OR_AFTER":
        return "igual o posterior a";
      case "ON_OR_BEFORE":
        return "igual o anterior a";
      default:
        return "relacionada con";
    }
  }

  function formatRole(role: string) {
    switch (role) {
      case "MASTER":
        return "Maestra";
      case "REFERENCE":
        return "Referencia";
      case "TRANSACTION_HEADER":
        return "Cabecera transaccional";
      case "TRANSACTION_DETAIL":
        return "Detalle transaccional";
      case "LEDGER":
        return "Libro / movimiento";
      case "BRIDGE":
        return "Tabla puente";
      case "EVENT":
        return "Evento";
      default:
        return "Desconocida";
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!sql.trim()) {
      setError("Debes pegar o subir un script SQL");
      return;
    }

    setAnalyzing(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const createdImport = await createSqlImportRequest(token, projectId, {
        sql,
        engine,
        dialect,
      });

      setImports((currentImports) => [createdImport, ...currentImports]);
      setSelectedImport(createdImport);
      setGenerationPlan(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al analizar el script SQL",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSelectImport(importId: string) {
    setError("");
    setLoadingSelected(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const data = await getSqlImportRequest(token, projectId, importId);
      setSelectedImport(data);
      setSql(data.originalSql ?? "");
      setFileName("");
      setGeneratedSqlSchema(null);
      setSqlInputMode("manual");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar la importación SQL",
      );
    } finally {
      setLoadingSelected(false);
    }
  }

  async function handleDeleteImport(importId: string) {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar esta importación SQL?",
    );

    if (!confirmDelete) return;

    setError("");
    setDeletingId(importId);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      await deleteSqlImportRequest(token, projectId, importId);

      setImports((currentImports) =>
        currentImports.filter((item) => item.id !== importId),
      );

      if (selectedImport?.id === importId) {
        setSelectedImport(null);
        setGenerationPlan(null);
        setSql("");
        setFileName("");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al eliminar la importación SQL",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const selectedTables = useMemo(
    () => selectedImport?.schemaJson?.tables ?? [],
    [selectedImport],
  );

  const totalColumns = useMemo(
    () =>
      selectedTables.reduce((total, table) => total + table.columns.length, 0),
    [selectedTables],
  );

  const totalRelations = useMemo(
    () =>
      selectedTables.reduce(
        (total, table) => total + table.foreignKeys.length,
        0,
      ),
    [selectedTables],
  );

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

          <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Importación {engine === "MONGODB" ? "MongoDB" : "PostgreSQL"}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Analizar estructura SQL
            </h1>

            <p className="mt-4 max-w-3xl text-slate-600">
              Pega un script SQL, sube un archivo <strong>.sql</strong> o
              describe tu base de datos en lenguaje natural. SynData analizará
              la estructura para detectar tablas, columnas, llaves primarias y
              relaciones.
            </p>
          </section>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Estructura de entrada
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Puedes pegar SQL, subir un archivo o crearlo desde lenguaje
                    natural.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadExampleSql}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cargar ejemplo
                  </button>

                  <button
                    type="button"
                    onClick={clearEditor}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Base de datos
                </label>

                <div className="flex gap-3">
                  {DB_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setDbType(option.key)}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-3 transition ${
                        dbType === option.key
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${option.badgeClassName}`}
                      >
                        {option.initials}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Detectamos automáticamente si el SQL no corresponde a la base
                  elegida (ej. sintaxis MySQL con PostgreSQL seleccionado) y lo
                  rechazamos antes de analizarlo.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSqlInputMode("manual")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    sqlInputMode === "manual"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {engine === "MONGODB" ? "Pegar estructura" : "Pegar SQL"}
                </button>

                <button
                  type="button"
                  onClick={() => setSqlInputMode("file")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    sqlInputMode === "file"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {engine === "MONGODB" ? "Subir archivo" : "Subir .sql"}
                </button>

                <button
                  type="button"
                  onClick={() => setSqlInputMode("ai")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    sqlInputMode === "ai"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Crear con IA
                </button>
              </div>

              <form onSubmit={handleAnalyze} className="mt-6 space-y-5">
                {sqlInputMode === "manual" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      Pega directamente un script DDL SQL (tablas, columnas y
                      relaciones). Luego podrás revisarlo y analizarlo
                      {engine === "MONGODB"
                        ? "; se traducirá a colecciones de MongoDB"
                        : ""}
                      .
                    </p>
                  </div>
                )}

                {sqlInputMode === "file" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Archivo SQL
                      {engine === "MONGODB"
                        ? " (define la estructura; se traducirá a colecciones)"
                        : ""}
                    </label>

                    <input
                      type="file"
                      accept=".sql"
                      onChange={handleFileChange}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                    />

                    {fileName && (
                      <p className="mt-2 text-xs text-slate-500">
                        Archivo cargado: {fileName}
                      </p>
                    )}
                  </div>
                )}

                {sqlInputMode === "ai" && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Describe la base de datos
                      </label>

                      <textarea
                        value={schemaDescription}
                        onChange={(event) =>
                          setSchemaDescription(event.target.value)
                        }
                        className="min-h-32 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500"
                        placeholder="Ejemplo: Quiero una base para una clínica con pacientes, médicos, citas, recetas y detalle de medicamentos."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateSqlFromDescription}
                      disabled={generatingSqlSchema}
                      className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generatingSqlSchema
                        ? "Generando estructura SQL..."
                        : "Generar SQL con IA"}
                    </button>

                    {generatedSqlSchema && (
                      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                          Esquema generado
                        </p>

                        <h3 className="mt-2 font-semibold text-violet-950">
                          {generatedSqlSchema.title}
                        </h3>

                        <p className="mt-2 text-sm text-violet-800">
                          {generatedSqlSchema.summary}
                        </p>

                        {generatedSqlSchema.assumptions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-violet-900">
                              Supuestos tomados
                            </p>

                            <ul className="mt-2 space-y-1 text-sm text-violet-800">
                              {generatedSqlSchema.assumptions.map(
                                (assumption, index) => (
                                  <li key={`${assumption}-${index}`}>
                                    • {assumption}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SQL editable
                    {dialect === "MYSQL"
                      ? " (sintaxis MySQL)"
                      : " (sintaxis PostgreSQL)"}
                    {engine === "MONGODB"
                      ? " — se traducirá a colecciones MongoDB"
                      : ""}
                  </label>

                  <textarea
                    value={sql}
                    onChange={(event) => setSql(event.target.value)}
                    className="min-h-90 w-full rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-900"
                    placeholder="CREATE TABLE clientes (...);"
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {analyzing ? "Analizando..." : "Analizar SQL"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm xl:sticky xl:top-6 xl:z-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Acciones rápidas
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Analiza la coherencia o continúa directo a la generación.
                    </p>
                  </div>

                  {selectedImport && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedImport.status === "VALID"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedImport.status === "VALID"
                        ? "Válido"
                        : "Inválido"}
                    </span>
                  )}
                </div>

                {!selectedImport ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4">
                    <p className="text-sm text-slate-500">
                      Primero analiza o selecciona una importación SQL.
                    </p>
                  </div>
                ) : selectedImport.status !== "VALID" ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">
                      La importación debe ser válida antes de continuar.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Idioma de los datos
                      </label>

                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setPlanLanguage("es")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                            planLanguage === "es"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Español
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlanLanguage("en")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                            planLanguage === "en"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          English
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Define el idioma de los valores de dominio (categorías,
                        tipos, productos). Recuerda elegir una región acorde al
                        generar.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleAnalyzeGenerationPlan}
                        disabled={analyzingPlan}
                        className="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {analyzingPlan
                          ? "Analizando con IA..."
                          : generationPlan
                            ? "Reanalizar coherencia"
                            : "Analizar coherencia con IA"}
                      </button>

                      <Link
                        href={`/projects/${projectId}/generations?sqlImportId=${selectedImport.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        {generationPlan
                          ? "Generar con este plan"
                          : "Generar datos"}
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {selectedTables.length} tablas
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {totalColumns} columnas
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {totalRelations} relaciones
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 ${
                          generationPlan
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {generationPlan
                          ? `${generationPlan.planJson.rules.length} reglas IA`
                          : "Sin plan IA"}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Resultado del análisis
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Resumen del esquema detectado.
                    </p>
                  </div>

                  {selectedImport && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedImport.status === "VALID"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedImport.status === "VALID"
                        ? "Válido"
                        : "Inválido"}
                    </span>
                  )}
                </div>

                {!selectedImport ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-medium text-slate-800">
                      Aún no hay análisis seleccionado
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Analiza un SQL para ver aquí el esquema detectado.
                    </p>
                  </div>
                ) : loadingSelected ? (
                  <p className="mt-6 text-sm text-slate-500">
                    Cargando análisis...
                  </p>
                ) : selectedImport.status === "INVALID" ? (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-medium text-red-700">
                      El SQL contiene errores o no pudo analizarse
                    </p>

                    <ul className="mt-3 space-y-2 text-sm text-red-600">
                      {(selectedImport.errors ?? []).map((item, index) => (
                        <li key={`${item}-${index}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {selectedTables.map((table) => (
                      <details
                        key={table.name}
                        className="group rounded-xl border border-slate-200 p-4"
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {table.name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {table.columns.length} columnas ·{" "}
                              {table.foreignKeys.length} relaciones
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {table.columns.length} columnas
                            </span>

                            <span className="text-xs font-medium text-slate-500 group-open:hidden">
                              Ver
                            </span>

                            <span className="hidden text-xs font-medium text-slate-500 group-open:inline">
                              Ocultar
                            </span>
                          </div>
                        </summary>

                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                                <th className="pb-2 pr-3">Columna</th>
                                <th className="pb-2 pr-3">Tipo</th>
                                <th className="pb-2 pr-3">Claves</th>
                              </tr>
                            </thead>

                            <tbody>
                              {table.columns.map((column) => (
                                <tr
                                  key={column.name}
                                  className="border-b border-slate-100 last:border-b-0"
                                >
                                  <td className="py-2 pr-3 font-medium text-slate-800">
                                    {column.name}
                                  </td>

                                  <td className="py-2 pr-3 text-slate-600">
                                    {column.rawType}
                                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                      {column.normalizedType}
                                    </span>
                                  </td>

                                  <td className="py-2 pr-3 text-slate-600">
                                    <div className="flex flex-wrap gap-1">
                                      {column.isPrimaryKey && (
                                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                          PK
                                        </span>
                                      )}

                                      {column.references && (
                                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                          FK → {column.references.table}.
                                          {column.references.column}
                                        </span>
                                      )}

                                      {!column.isNullable && (
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                          NOT NULL
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {table.foreignKeys.length > 0 && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                              Relaciones detectadas
                            </p>

                            <ul className="mt-2 space-y-1 text-sm text-slate-600">
                              {table.foreignKeys.map((foreignKey) => (
                                <li key={`${table.name}-${foreignKey.column}`}>
                                  {foreignKey.column} →{" "}
                                  {foreignKey.referencesTable}.
                                  {foreignKey.referencesColumn}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </details>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Coherencia semántica con IA
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Gemini analiza el esquema para detectar reglas de negocio
                      ejecutables.
                    </p>
                  </div>
                </div>

                {!selectedImport ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      Selecciona una importación SQL para analizar su
                      coherencia.
                    </p>
                  </div>
                ) : selectedImport.status !== "VALID" ? (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">
                      Primero necesitas una importación SQL válida.
                    </p>
                  </div>
                ) : loadingPlan ? (
                  <p className="mt-6 text-sm text-slate-500">
                    Cargando plan de coherencia...
                  </p>
                ) : !generationPlan ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6">
                    <p className="font-medium text-slate-800">
                      Todavía no hay un plan semántico
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Puedes generar datos sin este paso, pero con IA SynData
                      puede detectar reglas como totales, subtotales, saldos,
                      fechas dependientes o valores copiados desde tablas
                      relacionadas.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-xl bg-violet-50 p-4">
                      <p className="text-xs font-semibold uppercase text-violet-500">
                        Dominio inferido
                      </p>

                      <p className="mt-2 text-sm text-violet-900">
                        {generationPlan.planJson.domainSummary}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Roles detectados en las tablas
                      </h3>

                      <div className="mt-3 space-y-3">
                        {generationPlan.planJson.tables.map((table) => (
                          <div
                            key={table.table}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">
                                {table.table}
                              </p>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {formatRole(table.role)}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                              {table.notes}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              Confianza: {Math.round(table.confidence * 100)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Reglas de coherencia detectadas
                      </h3>

                      {generationPlan.planJson.rules.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4">
                          <p className="text-sm text-slate-500">
                            La IA no detectó reglas semánticas con suficiente
                            confianza.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {generationPlan.planJson.rules.map((rule, index) => (
                            <div
                              key={`${rule.type}-${rule.targetTable}-${rule.targetColumn}-${index}`}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  {rule.type}
                                </span>

                                <span className="text-xs text-emerald-700">
                                  Confianza: {Math.round(rule.confidence * 100)}
                                  %
                                </span>
                              </div>

                              <p className="mt-3 text-sm font-medium text-emerald-900">
                                {formatRule(rule)}
                              </p>

                              <p className="mt-2 text-sm text-emerald-700">
                                {rule.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <details className="rounded-xl border border-slate-200 p-4">
                      <summary className="cursor-pointer font-semibold text-slate-900">
                        Ver interpretación de columnas
                      </summary>

                      <div className="mt-4 space-y-3">
                        {generationPlan.planJson.columns.map((column) => (
                          <div
                            key={`${column.table}-${column.column}`}
                            className="rounded-lg bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">
                                {column.table}.{column.column}
                              </p>

                              <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">
                                {column.semanticType}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                              Generador sugerido: {column.generatorHint}
                            </p>

                            {column.notes && (
                              <p className="mt-1 text-xs text-slate-400">
                                {column.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>

                    {generationPlan.planJson.warnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-800">
                          Advertencias
                        </p>

                        <ul className="mt-3 space-y-2 text-sm text-amber-700">
                          {generationPlan.planJson.warnings.map(
                            (warning, index) => (
                              <li key={`${warning}-${index}`}>• {warning}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    <Link
                      href={`/projects/${projectId}/generations?sqlImportId=${selectedImport.id}`}
                      className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Generar datos usando este plan
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Historial de importaciones
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Scripts analizados en este proyecto.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadImports}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="mt-6">
                  {loadingImports ? (
                    <p className="text-sm text-slate-500">
                      Cargando importaciones...
                    </p>
                  ) : imports.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                      <p className="text-sm text-slate-500">
                        Aún no analizaste ningún script SQL.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {imports.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    item.status === "VALID"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {item.status === "VALID"
                                    ? "Válido"
                                    : "Inválido"}
                                </span>

                                <span className="text-xs text-slate-400">
                                  {new Date(item.createdAt).toLocaleString()}
                                </span>

                                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                  {item.engine === "MONGODB"
                                    ? "MongoDB"
                                    : "PostgreSQL"}
                                </span>

                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  SQL: {item.dialect === "MYSQL" ? "MySQL" : "PostgreSQL"}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-slate-600">
                                {item.schemaJson?.tables.length ?? 0} tablas
                                detectadas
                              </p>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectImport(item.id)}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                              >
                                Ver
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteImport(item.id)}
                                disabled={deletingId === item.id}
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === item.id ? "..." : "Eliminar"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
