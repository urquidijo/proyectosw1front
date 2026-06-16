import { apiFetch } from "./api";
import type {
  CreateGenerationRuleSetPayload,
  GenerationRuleSet,
} from "../types/generation-rule";

export function listGenerationRulesRequest(
  token: string,
  projectId: string,
  sqlImportId?: string,
) {
  const query = sqlImportId ? `?sqlImportId=${sqlImportId}` : "";

  return apiFetch<GenerationRuleSet[]>(
    `/projects/${projectId}/generation-rules${query}`,
    {
      token,
    },
  );
}

export function createGenerationRuleRequest(
  token: string,
  projectId: string,
  payload: CreateGenerationRuleSetPayload,
) {
  return apiFetch<GenerationRuleSet>(
    `/projects/${projectId}/generation-rules`,
    {
      method: "POST",
      body: payload,
      token,
    },
  );
}