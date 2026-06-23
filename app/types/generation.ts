export type GeneratedValue = string | number | boolean | null;

export type GeneratedRow = Record<string, GeneratedValue>;

import type { GenerationRulesJson } from "./generation-rule";

export type PreviewJson = Record<string, GeneratedRow[]>;

export type GenerationEngine = "POSTGRESQL" | "MONGODB";

export type CreateGenerationPayload = {
  sqlImportId: string;
  rowConfig: Record<string, number>;
  ruleSetId?: string;
  rules?: GenerationRulesJson;
  region?: string;
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
  engine?: GenerationEngine;
  createdAt: string;
  updatedAt: string;
  orderedTables?: string[];
};

export type CreatedGenerationResponse = Generation & {
  orderedTables: string[];
};