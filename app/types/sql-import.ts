export type DetectedColumn = {
  name: string;
  rawType: string;
  normalizedType: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string | null;
  references?: {
    table: string;
    column: string;
  } | null;
};

export type DetectedForeignKey = {
  column: string;
  referencesTable: string;
  referencesColumn: string;
};

export type DetectedTable = {
  name: string;
  columns: DetectedColumn[];
  primaryKeys: string[];
  foreignKeys: DetectedForeignKey[];
};

export type DetectedSchema = {
  dialect: 'postgresql';
  tables: DetectedTable[];
};

export type SqlImportStatus = 'VALID' | 'INVALID';

export type SqlImport = {
  id: string;
  projectId: string;
  originalSql?: string;
  status: SqlImportStatus;
  schemaJson: DetectedSchema | null;
  errors: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSqlImportPayload = {
  sql: string;
};