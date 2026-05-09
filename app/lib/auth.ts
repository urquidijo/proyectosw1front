import { apiFetch } from './api';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';
const TOKEN_KEY = 'syndata_token';
const USER_KEY = 'syndata_user';

export function saveAuthSession(auth: AuthResponse) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function registerRequest(payload: RegisterPayload) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function loginRequest(payload: LoginPayload) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function getMeRequest(token: string) {
  return apiFetch<AuthUser>('/auth/me', {
    method: 'GET',
    token,
  });
}

export async function logoutRequest(token: string) {
  return apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
    token,
  });
}