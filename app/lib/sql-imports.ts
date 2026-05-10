import { apiFetch } from '@/app/lib/api';
import {
  CreateSqlImportPayload,
  SqlImport,
} from '@/app/types/sql-import';

export async function createSqlImportRequest(
  token: string,
  projectId: string,
  payload: CreateSqlImportPayload,
) {
  return apiFetch<SqlImport>(`/projects/${projectId}/sql-imports`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function listSqlImportsRequest(
  token: string,
  projectId: string,
) {
  return apiFetch<SqlImport[]>(`/projects/${projectId}/sql-imports`, {
    method: 'GET',
    token,
  });
}

export async function getSqlImportRequest(
  token: string,
  projectId: string,
  importId: string,
) {
  return apiFetch<SqlImport>(
    `/projects/${projectId}/sql-imports/${importId}`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function deleteSqlImportRequest(
  token: string,
  projectId: string,
  importId: string,
) {
  return apiFetch<{ message: string }>(
    `/projects/${projectId}/sql-imports/${importId}`,
    {
      method: 'DELETE',
      token,
    },
  );
}