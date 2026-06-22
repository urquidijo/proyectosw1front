"use client";

import type {
  ColumnGenerationRule,
  GenerationRulesJson,
} from "@/app/types/generation-rule";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  RULE_TYPE_GROUPS,
  RULE_TYPE_META,
  getEligibleColumns,
  getRuleTypeMeta,
  getSuggestedNumericRuleType,
  type SchemaColumn,
  type SchemaTable,
} from "../utils/generation-rules.utils";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedTables: SchemaTable[];
  rulesJson: GenerationRulesJson;
  onColumnRuleChange: (
    tableName: string,
    columnName: string,
    field: keyof ColumnGenerationRule,
    value: string | boolean | string[] | number,
  ) => void;
  onResetColumn: (tableName: string, columnName: string) => void;
};

export function ColumnRulesModal({
  open,
  onClose,
  selectedTables,
  rulesJson,
  onColumnRuleChange,
  onResetColumn,
}: Props) {
  const [activeTableName, setActiveTableName] = useState(
    selectedTables[0]?.name ?? "",
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedTables.some((table) => table.name === activeTableName)) {
      setActiveTableName(selectedTables[0]?.name ?? "");
    }
  }, [open, selectedTables, activeTableName]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeTable = selectedTables.find(
    (table) => table.name === activeTableName,
  );
  const eligibleColumns = activeTable ? getEligibleColumns(activeTable) : [];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Reglas por columna
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Define el tipo de dato, rangos y restricciones de cada columna.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
          {selectedTables.map((table) => {
            const eligible = getEligibleColumns(table);
            const customizedCount = eligible.filter(
              (column) =>
                rulesJson.tables[table.name]?.columns?.[column.name]?.type,
            ).length;

            const isActive = table.name === activeTableName;

            return (
              <button
                key={table.name}
                type="button"
                onClick={() => setActiveTableName(table.name)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {table.name}
                {customizedCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {customizedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {eligibleColumns.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Esta tabla no tiene columnas configurables (todas son clave
              primaria o foránea).
            </p>
          ) : (
            <div className="space-y-3">
              {eligibleColumns.map((column) => (
                <ColumnRuleCard
                  key={column.name}
                  tableName={activeTableName}
                  column={column}
                  rule={
                    rulesJson.tables[activeTableName]?.columns?.[
                      column.name
                    ] ?? {}
                  }
                  onChange={onColumnRuleChange}
                  onReset={onResetColumn}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Listo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ColumnRuleCard({
  tableName,
  column,
  rule,
  onChange,
  onReset,
}: {
  tableName: string;
  column: SchemaColumn;
  rule: ColumnGenerationRule;
  onChange: Props["onColumnRuleChange"];
  onReset: Props["onResetColumn"];
}) {
  const meta = getRuleTypeMeta(rule.type);
  const isCustomized = Boolean(rule.type);
  const suggestedNumericType = getSuggestedNumericRuleType(column);

  return (
    <div className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta?.colorClass ?? "bg-slate-300"}`}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {column.name}
            </p>
            <p className="text-xs text-slate-400">{column.rawType}</p>
          </div>

          {isCustomized ? (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
              Personalizada
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Automática
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(rule.unique)}
              onChange={(event) =>
                onChange(tableName, column.name, "unique", event.target.checked)
              }
              className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600"
            />
            Único
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(rule.nullable)}
              onChange={(event) =>
                onChange(
                  tableName,
                  column.name,
                  "nullable",
                  event.target.checked,
                )
              }
              disabled={!column.isNullable}
              className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 disabled:opacity-40"
            />
            Permitir NULL
          </label>

          {isCustomized && (
            <button
              type="button"
              onClick={() => onReset(tableName, column.name)}
              className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {!column.isNullable && rule.nullable === undefined && (
        <p className="mt-1 text-[11px] text-slate-400">
          Esta columna no admite NULL en el esquema, así que la opción está
          deshabilitada.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tipo de dato
          </label>

          <select
            value={rule.type ?? ""}
            onChange={(event) =>
              onChange(tableName, column.name, "type", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
          >
            <option value="">Automático (heurística por defecto)</option>

            {RULE_TYPE_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {RULE_TYPE_META.filter((item) => item.group === group).map(
                  (item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>

          {!rule.type && suggestedNumericType && (
            <button
              type="button"
              onClick={() =>
                onChange(tableName, column.name, "type", suggestedNumericType)
              }
              className="mt-1.5 text-xs font-medium text-violet-600 underline-offset-2 hover:text-violet-800 hover:underline"
            >
              Definir un límite mínimo/máximo para esta columna
            </button>
          )}
        </div>

        {rule.nullable && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              % de filas con NULL
            </label>

            <input
              type="number"
              min={0}
              max={100}
              value={rule.nullRate ?? 10}
              onChange={(event) =>
                onChange(
                  tableName,
                  column.name,
                  "nullRate",
                  Number(event.target.value),
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        )}
      </div>

      {meta?.rangeKind && meta.rangeKind !== "none" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Mínimo
            </label>
            <input
              type={meta.rangeKind === "date" ? "date" : "number"}
              step={meta.rangeKind === "number" ? "any" : undefined}
              value={rule.min ?? ""}
              onChange={(event) =>
                onChange(tableName, column.name, "min", event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Máximo
            </label>
            <input
              type={meta.rangeKind === "date" ? "date" : "number"}
              step={meta.rangeKind === "number" ? "any" : undefined}
              value={rule.max ?? ""}
              onChange={(event) =>
                onChange(tableName, column.name, "max", event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>
      )}

      {meta?.acceptsValues && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Valores permitidos (separados por coma)
          </label>

          <input
            type="text"
            value={rule.values?.join(", ") ?? ""}
            onChange={(event) =>
              onChange(
                tableName,
                column.name,
                "values",
                event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Ej: ACTIVO, INACTIVO, BLOQUEADO"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />

          {rule.values && rule.values.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rule.values.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700"
                >
                  {value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
