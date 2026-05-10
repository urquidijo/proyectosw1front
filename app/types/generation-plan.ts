export type TableRole =
  | "MASTER"
  | "REFERENCE"
  | "TRANSACTION_HEADER"
  | "TRANSACTION_DETAIL"
  | "LEDGER"
  | "BRIDGE"
  | "EVENT"
  | "UNKNOWN";

export type SemanticType =
  | "PERSON_NAME"
  | "EMAIL"
  | "PHONE"
  | "CITY"
  | "ADDRESS"
  | "MONEY"
  | "QUANTITY"
  | "STATUS"
  | "DATE"
  | "DATETIME"
  | "IDENTIFIER"
  | "CODE"
  | "DESCRIPTION"
  | "BOOLEAN"
  | "TEXT"
  | "UNKNOWN";

export type GeneratorHint =
  | "NAME"
  | "EMAIL"
  | "PHONE"
  | "CITY"
  | "ADDRESS"
  | "MONEY"
  | "INTEGER"
  | "DECIMAL"
  | "STATUS"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "TEXT"
  | "STRING"
  | "UNKNOWN";

export type RuleType =
  | "COPY_FROM_REFERENCE"
  | "BINARY_OPERATION"
  | "AGGREGATE_CHILDREN"
  | "DATE_RELATION"
  | 'REFERENCE_BOUND';

export type PlanRule = {
  type: RuleType;

  targetTable: string;
  targetColumn: string;

  description: string;
  confidence: number;

  sourceTable: string | null;
  sourceColumn: string | null;
  viaForeignKey: string | null;

  leftColumn: string | null;
  rightColumn: string | null;
  operator: "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE" | null;

  childTable: string | null;
  childForeignKey: string | null;
  childColumn: string | null;
  aggregate: "SUM" | "COUNT" | "AVG" | null;

  referenceColumn: string | null;
  dateRelation: "AFTER" | "BEFORE" | "ON_OR_AFTER" | "ON_OR_BEFORE" | null
  boundOperator: 'LTE' | 'GTE' | null;
};

export type GenerationPlanJson = {
  domainSummary: string;

  tables: {
    table: string;
    role: TableRole;
    confidence: number;
    notes: string;
  }[];

  columns: {
    table: string;
    column: string;
    semanticType: SemanticType;
    generatorHint: GeneratorHint;
    confidence: number;
    notes: string;
    sampleValues: string[];
    numericMin: number | null;
    numericMax: number | null;
  }[];

  rules: PlanRule[];

  warnings: string[];
};

export type GenerationPlan = {
  id: string;
  projectId: string;
  sqlImportId: string;
  planJson: GenerationPlanJson;
  createdAt: string;
  updatedAt: string;
};
