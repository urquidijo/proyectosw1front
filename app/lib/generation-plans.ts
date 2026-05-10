import { apiFetch } from '@/app/lib/api';
import { GenerationPlan } from '@/app/types/generation-plan';

export async function analyzeGenerationPlanRequest(
  token: string,
  projectId: string,
  importId: string,
) {
  return apiFetch<GenerationPlan>(
    `/projects/${projectId}/sql-imports/${importId}/generation-plan/analyze`,
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