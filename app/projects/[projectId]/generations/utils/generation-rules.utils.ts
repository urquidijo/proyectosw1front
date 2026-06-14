import type { GenerationRulesJson } from "@/app/types/generation-rule";
import type { SqlImport } from "@/app/types/sql-import";

export type SchemaTable = NonNullable<
  NonNullable<SqlImport["schemaJson"]>["tables"]
>[number];

export const RULE_TYPES = [
  "STRING",
  "TEXT",
  "PERSON_NAME",
  "EMAIL",
  "PHONE",
  "CITY",
  "STATUS",
  "ENUM",
  "INTEGER",
  "DECIMAL",
  "MONEY",
  "DATE",
  "DATETIME",
  "BOOLEAN",
  "UUID",
];

export function createDefaultRowConfig(
  tables: SchemaTable[],
): Record<string, string> {
  const defaultConfig: Record<string, string> = {};

  tables.forEach((table) => {
    defaultConfig[table.name] = "10";
  });

  return defaultConfig;
}

export function createDefaultRules(
  tables: SchemaTable[],
): GenerationRulesJson {
  const defaultRules: GenerationRulesJson = {
    tables: {},
  };

  tables.forEach((table) => {
    defaultRules.tables[table.name] = {
      rowCount: 10,
      columns: {},
    };
  });

  return defaultRules;
}

export function normalizeRowConfig(
  tables: SchemaTable[],
  rowConfig: Record<string, string>,
):
  | {
      ok: true;
      value: Record<string, number>;
    }
  | {
      ok: false;
      error: string;
    } {
  const normalizedRowConfig: Record<string, number> = {};

  for (const table of tables) {
    const rawValue = rowConfig[table.name];
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 1) {
      return {
        ok: false,
        error: `Debes indicar una cantidad entera mayor a 0 para la tabla "${table.name}"`,
      };
    }

    normalizedRowConfig[table.name] = value;
  }

  return {
    ok: true,
    value: normalizedRowConfig,
  };
}

export function buildRulesForSubmit(
  tables: SchemaTable[],
  rowConfig: Record<string, string>,
  rulesJson: GenerationRulesJson,
): GenerationRulesJson {
  const cleanRules: GenerationRulesJson = {
    tables: {},
  };

  tables.forEach((table) => {
    const rowCount = Number(rowConfig[table.name]);

    cleanRules.tables[table.name] = {
      rowCount,
      columns: {},
    };

    table.columns.forEach((column) => {
      const columnRule = rulesJson.tables[table.name]?.columns?.[column.name];

      if (!columnRule) return;

      const cleanColumnRule = {
        ...(columnRule.type ? { type: columnRule.type } : {}),
        ...(columnRule.unique ? { unique: true } : {}),
        ...(columnRule.nullable ? { nullable: true } : {}),
        ...(columnRule.min !== undefined && columnRule.min !== ""
          ? { min: columnRule.min }
          : {}),
        ...(columnRule.max !== undefined && columnRule.max !== ""
          ? { max: columnRule.max }
          : {}),
        ...(columnRule.values && columnRule.values.length > 0
          ? { values: columnRule.values }
          : {}),
      };

      if (Object.keys(cleanColumnRule).length > 0) {
        cleanRules.tables[table.name].columns![column.name] = cleanColumnRule;
      }
    });
  });

  return cleanRules;
}