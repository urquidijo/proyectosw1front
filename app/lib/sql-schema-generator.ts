import { apiFetch } from "@/app/lib/api";
import { GeneratedSqlSchema } from "@/app/types/generated-sql-schema";
import { SqlImportDialect } from "@/app/types/sql-import";

export async function generateSqlSchemaRequest(
  token: string,
  projectId: string,
  description: string,
  dialect?: SqlImportDialect,
) {
  return apiFetch<GeneratedSqlSchema>(
    `/projects/${projectId}/sql-schema-generator/generate`,
    {
      method: "POST",
      token,
      body: {
        description,
        dialect,
      },
    },
  );
}
