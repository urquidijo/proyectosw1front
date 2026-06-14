"use client";

import type {
  ColumnGenerationRule,
  GenerationRuleSet,
  GenerationRulesJson,
} from "@/app/types/generation-rule";
import {
  RULE_TYPES,
  type SchemaTable,
} from "../utils/generation-rules.utils";

type Props = {
  selectedTables: SchemaTable[];
  useAdvancedRules: boolean;
  onUseAdvancedRulesChange: (value: boolean) => void;
  rulesJson: GenerationRulesJson;
  ruleSets: GenerationRuleSet[];
  selectedRuleSetId: string;
  ruleSetName: string;
  onRuleSetNameChange: (value: string) => void;
  savingRules: boolean;
  onRuleSetChange: (ruleSetId: string) => void;
  onColumnRuleChange: (
    tableName: string,
    columnName: string,
    field: keyof ColumnGenerationRule,
    value: string | boolean | string[],
  ) => void;
  onSaveRules: () => void;
};

export function GenerationRulesPanel({
  selectedTables,
  useAdvancedRules,
  onUseAdvancedRulesChange,
  rulesJson,
  ruleSets,
  selectedRuleSetId,
  ruleSetName,
  onRuleSetNameChange,
  savingRules,
  onRuleSetChange,
  onColumnRuleChange,
  onSaveRules,
}: Props) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-3">
        <input
          id="useAdvancedRules"
          type="checkbox"
          checked={useAdvancedRules}
          onChange={(event) => onUseAdvancedRulesChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600"
        />

        <div>
          <label
            htmlFor="useAdvancedRules"
            className="text-sm font-semibold text-violet-950"
          >
            Usar reglas configurables por columna
          </label>

          <p className="mt-1 text-xs text-violet-700">
            Permite definir tipos como EMAIL, PERSON_NAME, ENUM, DATE, MONEY,
            valores únicos y rangos.
          </p>
        </div>
      </div>

      {useAdvancedRules && (
        <div className="mt-4 space-y-4">
          {ruleSets.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-950">
                Configuración guardada
              </label>

              <select
                value={selectedRuleSetId}
                onChange={(event) => onRuleSetChange(event.target.value)}
                className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500"
              >
                <option value="">Crear nueva configuración</option>

                {ruleSets.map((ruleSet) => (
                  <option key={ruleSet.id} value={ruleSet.id}>
                    {ruleSet.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-violet-950">
              Nombre de la configuración
            </label>

            <input
              type="text"
              value={ruleSetName}
              onChange={(event) => onRuleSetNameChange(event.target.value)}
              placeholder="Ejemplo: Reglas clientes prueba"
              className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-4">
            {selectedTables.map((table) => (
              <details
                key={`rules-${table.name}`}
                className="rounded-2xl border border-violet-200 bg-white p-4"
              >
                <summary className="cursor-pointer text-sm font-bold text-slate-900">
                  Reglas de columnas: {table.name}
                </summary>

                <div className="mt-4 space-y-3">
                  {table.columns.map((column) => {
                    const columnRule =
                      rulesJson.tables[table.name]?.columns?.[column.name] ??
                      {};

                    return (
                      <div
                        key={`${table.name}-${column.name}`}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {column.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              Tipo SQL: {column.rawType}
                            </p>
                          </div>

                          <div className="flex gap-3 text-xs text-slate-600">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={Boolean(columnRule.unique)}
                                onChange={(event) =>
                                  onColumnRuleChange(
                                    table.name,
                                    column.name,
                                    "unique",
                                    event.target.checked,
                                  )
                                }
                              />
                              Único
                            </label>

                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={Boolean(columnRule.nullable)}
                                onChange={(event) =>
                                  onColumnRuleChange(
                                    table.name,
                                    column.name,
                                    "nullable",
                                    event.target.checked,
                                  )
                                }
                              />
                              Permitir NULL
                            </label>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Tipo semántico
                            </label>

                            <select
                              value={columnRule.type ?? ""}
                              onChange={(event) =>
                                onColumnRuleChange(
                                  table.name,
                                  column.name,
                                  "type",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                              <option value="">Automático</option>

                              {RULE_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Mínimo / Desde
                            </label>

                            <input
                              type="text"
                              value={columnRule.min ?? ""}
                              onChange={(event) =>
                                onColumnRuleChange(
                                  table.name,
                                  column.name,
                                  "min",
                                  event.target.value,
                                )
                              }
                              placeholder="Ej: 1 o 2024-01-01"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Máximo / Hasta
                            </label>

                            <input
                              type="text"
                              value={columnRule.max ?? ""}
                              onChange={(event) =>
                                onColumnRuleChange(
                                  table.name,
                                  column.name,
                                  "max",
                                  event.target.value,
                                )
                              }
                              placeholder="Ej: 1000 o 2026-12-31"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Valores permitidos
                          </label>

                          <input
                            type="text"
                            value={columnRule.values?.join(", ") ?? ""}
                            onChange={(event) =>
                              onColumnRuleChange(
                                table.name,
                                column.name,
                                "values",
                                event.target.value
                                  .split(",")
                                  .map((value) => value.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="Ej: ACTIVO, INACTIVO, BLOQUEADO"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>

          <button
            type="button"
            onClick={onSaveRules}
            disabled={savingRules}
            className="w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingRules
              ? "Guardando reglas..."
              : "Guardar configuración de reglas"}
          </button>
        </div>
      )}
    </div>
  );
}