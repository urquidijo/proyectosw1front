import { apiFetch } from '@/app/lib/api';
import {
  CreateGenerationPayload,
  CreatedGenerationResponse,
  Generation,
} from '@/app/types/generation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL no está configurado');
}

export async function createGenerationRequest(
  token: string,
  projectId: string,
  payload: CreateGenerationPayload,
) {
  return apiFetch<CreatedGenerationResponse>(
    `/projects/${projectId}/generations`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
}

export async function listGenerationsRequest(
  token: string,
  projectId: string,
) {
  return apiFetch<Generation[]>(`/projects/${projectId}/generations`, {
    method: 'GET',
    token,
  });
}

export async function getGenerationRequest(
  token: string,
  projectId: string,
  generationId: string,
) {
  return apiFetch<Generation>(
    `/projects/${projectId}/generations/${generationId}`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function getGenerationStatusRequest(
  token: string,
  projectId: string,
  generationId: string,
) {
  return apiFetch<{ status: string; progress: number; error: string | null }>(
    `/projects/${projectId}/generations/${generationId}/status`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function suggestVolumesRequest(
  token: string,
  projectId: string,
  importId: string,
) {
  return apiFetch<Record<string, number>>(
    `/projects/${projectId}/generations/suggest-volumes/${importId}`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function downloadGenerationSqlRequest(
  token: string,
  projectId: string,
  generationId: string,
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/generations/${generationId}/download`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.message || 'No se pudo descargar el archivo generado';

    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return response.blob();
}