import { apiFetch } from '@/app/lib/api';
import { CreateProjectPayload, Project } from '@/app/types/project';

export async function createProjectRequest(
  token: string,
  payload: CreateProjectPayload,
) {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function listProjectsRequest(token: string) {
  return apiFetch<Project[]>('/projects', {
    method: 'GET',
    token,
  });
}

export async function getProjectRequest(token: string, projectId: string) {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: 'GET',
    token,
  });
}

export async function deleteProjectRequest(token: string, projectId: string) {
  return apiFetch<{ message: string }>(`/projects/${projectId}`, {
    method: 'DELETE',
    token,
  });
}

export async function assignProjectToWorkspaceRequest(
  token: string,
  projectId: string,
  workspaceId: string | null
): Promise<void> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const response = await fetch(`${API_URL}/projects/${projectId}/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workspaceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al asignar workspace');
  }
}