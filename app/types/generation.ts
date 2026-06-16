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
  previewJson: Record<string, GeneratedRow[]>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string | null;
  region?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreatedGenerationResponse = Generation & {
  orderedTables: string[];
};

export type CreateGenerationPayload = {
  sqlImportId: string;
  rowConfig: Record<string, number>;
  region?: string;
};