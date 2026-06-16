"use client";

import { getToken } from "@/app/lib/auth";
import {
  createGenerationRuleRequest,
  listGenerationRulesRequest,
} from "@/app/lib/generation-rules";
import type {
  ColumnGenerationRule,
  GenerationRuleSet,
  GenerationRulesJson,
} from "@/app/types/generation-rule";
import type { SqlImport } from "@/app/types/sql-import";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import {
  buildRulesForSubmit,
  createDefaultRowConfig,
  createDefaultRules,
  type SchemaTable,
} from "../utils/generation-rules.utils";

type UseGenerationRulesParams = {
  projectId?: string;
  selectedImport: SqlImport | null;
  selectedTables: SchemaTable[];
  rowConfig: Record<string, string>;
  setRowConfig: Dispatch<SetStateAction<Record<string, string>>>;
  setError: Dispatch<SetStateAction<string>>;
};

export function useGenerationRules({
  projectId,
  selectedImport,
  selectedTables,
  rowConfig,
  setRowConfig,
  setError,
}: UseGenerationRulesParams) {
  const [useAdvancedRules, setUseAdvancedRules] = useState(false);
  const [rulesJson, setRulesJson] = useState<GenerationRulesJson>({
    tables: {},
  });

  const [ruleSets, setRuleSets] = useState<GenerationRuleSet[]>([]);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState("");
  const [ruleSetName, setRuleSetName] = useState("");
  const [savingRules, setSavingRules] = useState(false);

  const applyRuleSet = useCallback(
    (ruleSet: GenerationRuleSet) => {
      setSelectedRuleSetId(ruleSet.id);
      setRuleSetName(ruleSet.name);
      setRulesJson(ruleSet.rulesJson);

      const newRowConfig: Record<string, string> = {};

      selectedTables.forEach((table) => {
        const rowCount = ruleSet.rulesJson.tables[table.name]?.rowCount ?? 10;
        newRowConfig[table.name] = String(rowCount);
      });

      setRowConfig(newRowConfig);
      setUseAdvancedRules(true);
    },
    [selectedTables, setRowConfig],
  );

  const loadGenerationRules = useCallback(
    async (sqlImportId: string) => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error("No existe una sesión activa");
        }

        if (!projectId) {
          throw new Error("Proyecto no válido");
        }

        const data = await listGenerationRulesRequest(
          token,
          projectId,
          sqlImportId,
        );

        setRuleSets(data);

        const defaultRuleSet = data.find((item) => item.isDefault);

        if (defaultRuleSet) {
          applyRuleSet(defaultRuleSet);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar configuraciones de reglas",
        );
      }
    },
    [projectId, applyRuleSet, setError],
  );

  useEffect(() => {
    if (!selectedImport?.schemaJson?.tables) return;

    setRowConfig(createDefaultRowConfig(selectedTables));
    setRulesJson(createDefaultRules(selectedTables));
    setSelectedRuleSetId("");
    setRuleSetName("");
    setUseAdvancedRules(false);

    loadGenerationRules(selectedImport.id);
  }, [
    selectedImport?.id,
    selectedImport?.schemaJson?.tables,
    selectedTables,
    setRowConfig,
    loadGenerationRules,
  ]);

  function handleRuleSetChange(ruleSetId: string) {
    setSelectedRuleSetId(ruleSetId);

    if (!ruleSetId) {
      setRuleSetName("");
      setRulesJson(createDefaultRules(selectedTables));
      setRowConfig(createDefaultRowConfig(selectedTables));
      return;
    }

    const foundRuleSet = ruleSets.find((item) => item.id === ruleSetId);

    if (foundRuleSet) {
      applyRuleSet(foundRuleSet);
    }
  }

  function updateTableRowCount(tableName: string, value: string) {
    setRowConfig((currentConfig) => ({
      ...currentConfig,
      [tableName]: value,
    }));

    const parsed = Number(value);

    setRulesJson((currentRules) => ({
      tables: {
        ...currentRules.tables,
        [tableName]: {
          ...currentRules.tables[tableName],
          rowCount: Number.isFinite(parsed) ? parsed : undefined,
          columns: currentRules.tables[tableName]?.columns ?? {},
        },
      },
    }));
  }

  function updateColumnRule(
    tableName: string,
    columnName: string,
    field: keyof ColumnGenerationRule,
    value: string | boolean | string[],
  ) {
    setRulesJson((currentRules) => {
      const currentTable = currentRules.tables[tableName] ?? {
        rowCount: Number(rowConfig[tableName] ?? 10),
        columns: {},
      };

      const currentColumn = currentTable.columns?.[columnName] ?? {};

      return {
        tables: {
          ...currentRules.tables,
          [tableName]: {
            ...currentTable,
            columns: {
              ...currentTable.columns,
              [columnName]: {
                ...currentColumn,
                [field]: value,
              },
            },
          },
        },
      };
    });
  }

  function getRulesForSubmit() {
    return buildRulesForSubmit(selectedTables, rowConfig, rulesJson);
  }

  async function handleSaveRules() {
    setError("");

    if (!selectedImport) {
      setError("Debes seleccionar una importación SQL válida");
      return;
    }

    if (!ruleSetName.trim()) {
      setError("Debes ingresar un nombre para la configuración de reglas");
      return;
    }

    setSavingRules(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No existe una sesión activa");
      }

      if (!projectId) {
        throw new Error("Proyecto no válido");
      }

      const createdRuleSet = await createGenerationRuleRequest(
        token,
        projectId,
        {
          sqlImportId: selectedImport.id,
          name: ruleSetName,
          description: "Configuración creada desde la pantalla de generación",
          isDefault: false,
          rulesJson: getRulesForSubmit(),
        },
      );

      setRuleSets((currentRuleSets) => [createdRuleSet, ...currentRuleSets]);
      setSelectedRuleSetId(createdRuleSet.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración de reglas",
      );
    } finally {
      setSavingRules(false);
    }
  }

  return {
    useAdvancedRules,
    setUseAdvancedRules,
    rulesJson,
    ruleSets,
    selectedRuleSetId,
    ruleSetName,
    setRuleSetName,
    savingRules,
    handleRuleSetChange,
    updateTableRowCount,
    updateColumnRule,
    handleSaveRules,
    getRulesForSubmit,
  };
}