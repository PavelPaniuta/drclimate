'use client';

import { User } from './types';

const TOKEN_KEY = 'drclimat_token';
const USER_KEY = 'drclimat_user';

export function saveAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function authHomePath(locale: string): string {
  return `/${locale}`;
}

export function dashboardPath(role: string, locale: string): string {
  switch (role) {
    case 'MASTER':
      return `/${locale}/master`;
    case 'ADMIN':
      return `/${locale}/admin`;
    default:
      return `/${locale}/client`;
  }
}
