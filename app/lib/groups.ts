import { getToken } from "./auth";

export type WorkspaceMember = {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: WorkspaceMember[];
  owner?: {
    plan?: {
      id: string;
      name: string;
      maxUsersPerWorkspace: number | null;
    };
  };
  projects: any[];
};

export async function listMyGroupsRequest(token: string): Promise<Workspace[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${API_URL}/groups`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Error al cargar tus grupos");
  return response.json();
}

export async function createGroupRequest(
  token: string,
  payload: { name: string }
): Promise<Workspace> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear el grupo");
  }

  return response.json();
}

export async function getGroupRequest(token: string, id: string): Promise<Workspace> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${API_URL}/groups/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Error al cargar el grupo");
  return response.json();
}

export async function addMemberToGroupRequest(
  token: string,
  groupId: string,
  email: string
): Promise<WorkspaceMember> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al añadir miembro");
  }

  return response.json();
}
