export type GeneratedValue = string | number | boolean | null;

export type GeneratedRow = Record<string, GeneratedValue>;

export type Generation = {
  id: string;
  projectId: string;
  sqlImportId: string;
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