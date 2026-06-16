import { apiFetch } from '@/app/lib/api';
import { GenerationPlan } from '@/app/types/generation-plan';

export type PlanLanguage = 'es' | 'en';

export async function analyzeGenerationPlanRequest(
  token: string,
  projectId: string,
  importId: string,
  language: PlanLanguage = 'es',
) {
  return apiFetch<GenerationPlan>(
    `/projects/${projectId}/sql-imports/${importId}/generation-plan/analyze?language=${language}`,
    {
      method: 'POST',
      token,
    },
  );
}

export async function getGenerationPlanRequest(
  token: string,
  projectId: string,
  importId: string,
) {
  return apiFetch<GenerationPlan>(
    `/projects/${projectId}/sql-imports/${importId}/generation-plan`,
    {
      method: 'GET',
      token,
    },
  );
}