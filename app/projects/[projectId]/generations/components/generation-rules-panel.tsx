"use client";

import type {
  ColumnGenerationRule,
  GenerationRuleSet,
  GenerationRulesJson,
} from "@/app/types/generation-rule";
import { useState } from "react";
import { countCustomizedColumns, type SchemaTable } from "../utils/generation-rules.utils";
import { ColumnRulesModal } from "./column-rules-modal";

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
    value: string | boolean | string[] | number,
  ) => void;
  onResetColumn: (tableName: string, columnName: string) => void;
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
  onResetColumn,
  onSaveRules,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { customized, total } = countCustomizedColumns(
    selectedTables,
    rulesJson,
  );

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
            Define tipos como EMAIL, PERSON_NAME, ENUM, DATE o MONEY, valores
            únicos y rangos para cada columna.
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

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Configurar reglas por columna
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {total === 0
                  ? "No hay columnas configurables en este esquema"
                  : `${customized} de ${total} columnas personalizadas`}
              </span>
            </span>

            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-violet-600" aria-hidden="true">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

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

      <ColumnRulesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedTables={selectedTables}
        rulesJson={rulesJson}
        onColumnRuleChange={onColumnRuleChange}
        onResetColumn={onResetColumn}
      />
    </div>
  );
}
