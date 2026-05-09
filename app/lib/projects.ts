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