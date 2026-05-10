import { apiFetch } from "@/app/lib/api";
import { GeneratedSqlSchema } from "@/app/types/generated-sql-schema";

export async function generateSqlSchemaRequest(
  token: string,
  projectId: string,
  description: string,
) {
  return apiFetch<GeneratedSqlSchema>(
    `/projects/${projectId}/sql-schema-generator/generate`,
    {
      method: "POST",
      token,
      body: {
        description,
      },
    },
  );
}
