export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};