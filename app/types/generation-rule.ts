export type ColumnGenerationRule = {
  type?: string;
  nullable?: boolean;
  unique?: boolean;
  min?: number | string;
  max?: number | string;
  values?: string[];
  prefix?: string;
  suffix?: string;
  nullRate?: number;
};

export type TableGenerationRule = {
  rowCount?: number;
  columns?: Record<string, ColumnGenerationRule>;
};

export type GenerationRulesJson = {
  tables: Record<string, TableGenerationRule>;
};

export type GenerationRuleSet = {
  id: string;
  projectId: string;
  sqlImportId: string;
  name: string;
  description: string | null;
  rulesJson: GenerationRulesJson;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateGenerationRuleSetPayload = {
  sqlImportId: string;
  name: string;
  description?: string;
  rulesJson: GenerationRulesJson;
  isDefault?: boolean;
};