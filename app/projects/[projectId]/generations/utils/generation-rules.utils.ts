import type { GenerationRulesJson } from "@/app/types/generation-rule";
import type { SqlImport } from "@/app/types/sql-import";

export type SchemaTable = NonNullable<
  NonNullable<SqlImport["schemaJson"]>["tables"]
>[number];

export type SchemaColumn = SchemaTable["columns"][number];

export type RuleTypeMeta = {
  value: string;
  label: string;
  group: string;
  colorClass: string;
  /** Acepta rango (mínimo/máximo): números o fechas según el tipo. */
  rangeKind: "none" | "number" | "date";
  /** Acepta lista de valores permitidos (ENUM, estados, texto fijo). */
  acceptsValues: boolean;
};

export const RULE_TYPE_META: RuleTypeMeta[] = [
  { value: "PERSON_NAME", label: "Nombre de persona", group: "Personas y contacto", colorClass: "bg-violet-500", rangeKind: "none", acceptsValues: false },
  { value: "EMAIL", label: "Correo electrónico", group: "Personas y contacto", colorClass: "bg-violet-500", rangeKind: "none", acceptsValues: false },
  { value: "PHONE", label: "Teléfono", group: "Personas y contacto", colorClass: "bg-violet-500", rangeKind: "none", acceptsValues: false },
  { value: "CITY", label: "Ciudad", group: "Personas y contacto", colorClass: "bg-violet-500", rangeKind: "none", acceptsValues: false },

  { value: "STATUS", label: "Estado", group: "Categorías", colorClass: "bg-amber-500", rangeKind: "none", acceptsValues: true },
  { value: "ENUM", label: "Lista de valores (ENUM)", group: "Categorías", colorClass: "bg-amber-500", rangeKind: "none", acceptsValues: true },

  { value: "INTEGER", label: "Número entero", group: "Números y dinero", colorClass: "bg-emerald-500", rangeKind: "number", acceptsValues: false },
  { value: "DECIMAL", label: "Número decimal", group: "Números y dinero", colorClass: "bg-emerald-500", rangeKind: "number", acceptsValues: false },
  { value: "MONEY", label: "Dinero", group: "Números y dinero", colorClass: "bg-emerald-500", rangeKind: "number", acceptsValues: false },

  { value: "DATE", label: "Fecha", group: "Fechas", colorClass: "bg-sky-500", rangeKind: "date", acceptsValues: false },
  { value: "DATETIME", label: "Fecha y hora", group: "Fechas", colorClass: "bg-sky-500", rangeKind: "date", acceptsValues: false },

  { value: "STRING", label: "Texto corto", group: "Texto", colorClass: "bg-slate-400", rangeKind: "none", acceptsValues: true },
  { value: "TEXT", label: "Texto largo", group: "Texto", colorClass: "bg-slate-400", rangeKind: "none", acceptsValues: true },
  { value: "UUID", label: "UUID", group: "Texto", colorClass: "bg-slate-400", rangeKind: "none", acceptsValues: false },

  { value: "BOOLEAN", label: "Verdadero / Falso", group: "Otros", colorClass: "bg-rose-400", rangeKind: "none", acceptsValues: false },
];

export const RULE_TYPE_GROUPS = Array.from(
  new Set(RULE_TYPE_META.map((item) => item.group)),
);

/** @deprecated usa RULE_TYPE_META; se mantiene por compatibilidad. */
export const RULE_TYPES = RULE_TYPE_META.map((item) => item.value);

export function getRuleTypeMeta(type?: string): RuleTypeMeta | undefined {
  if (!type) return undefined;
  return RULE_TYPE_META.find((item) => item.value === type);
}

/** Tipo numérico sugerido para una columna según su tipo SQL detectado, o undefined si no es numérica. */
export function getSuggestedNumericRuleType(
  column: SchemaColumn,
): "INTEGER" | "DECIMAL" | undefined {
  if (column.normalizedType === "INTEGER" || column.normalizedType === "SERIAL") {
    return "INTEGER";
  }

  if (column.normalizedType === "DECIMAL") {
    return "DECIMAL";
  }

  return undefined;
}

/** Columnas donde tiene sentido configurar una regla manual: ni PK ni FK. */
export function getEligibleColumns(table: SchemaTable): SchemaColumn[] {
  const fkColumnNames = new Set(table.foreignKeys.map((fk) => fk.column));

  return table.columns.filter(
    (column) => !column.isPrimaryKey && !fkColumnNames.has(column.name),
  );
}

export function countCustomizedColumns(
  tables: SchemaTable[],
  rulesJson: GenerationRulesJson,
): { customized: number; total: number } {
  let customized = 0;
  let total = 0;

  for (const table of tables) {
    const eligibleColumns = getEligibleColumns(table);
    total += eligibleColumns.length;

    for (const column of eligibleColumns) {
      if (rulesJson.tables[table.name]?.columns?.[column.name]?.type) {
        customized += 1;
      }
    }
  }

  return { customized, total };
}

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
        ...(columnRule.nullable && columnRule.nullRate !== undefined
          ? { nullRate: columnRule.nullRate }
          : {}),
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
