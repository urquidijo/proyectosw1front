export type Project = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
};