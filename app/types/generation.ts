export type GeneratedValue = string | number | boolean | null;

export type GeneratedRow = Record<string, GeneratedValue>;

import type { GenerationRulesJson } from "./generation-rule";

export type PreviewJson = Record<string, GeneratedRow[]>;

export type CreateGenerationPayload = {
  sqlImportId: string;
  rowConfig?: Record<string, number>;
  ruleSetId?: string;
  rules?: GenerationRulesJson;
};

export type Generation = {
  id: string;
  projectId: string;
  sqlImportId: string;
  generationRuleSetId?: string | null;
  rowConfig: Record<string, number>;
  previewJson: PreviewJson;
  validationJson?: unknown;
  orderedTables?: string[];
  createdAt: string;
  updatedAt: string;
};
export type CreatedGenerationResponse = Generation & {
  orderedTables: string[];
};
