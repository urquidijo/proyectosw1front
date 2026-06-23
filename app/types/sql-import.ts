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
  dialect: 'postgresql' | 'mysql';
  tables: DetectedTable[];
};

export type SqlImportStatus = 'VALID' | 'INVALID';

export type SqlImportEngine = 'POSTGRESQL' | 'MONGODB';

/** Sintaxis del script DDL pegado/subido. No confundir con SqlImportEngine (motor destino de los datos). */
export type SqlImportDialect = 'POSTGRESQL' | 'MYSQL';

export type SqlImport = {
  id: string;
  projectId: string;
  originalSql?: string;
  status: SqlImportStatus;
  schemaJson: DetectedSchema | null;
  errors: string[] | null;
  engine?: SqlImportEngine;
  dialect?: SqlImportDialect;
  createdAt: string;
  updatedAt: string;
};

export type CreateSqlImportPayload = {
  sql: string;
  engine?: SqlImportEngine;
  dialect?: SqlImportDialect;
};