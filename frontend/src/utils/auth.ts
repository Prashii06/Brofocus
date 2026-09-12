import { authApi } from '../api/client';

const AUTH_STORAGE_KEYS = [
  'brofocus_token',
  'brofocus-store',
  'brofocus-session',
  'access_token',
  'refresh_token',
  'google_access_token',
  'google_refresh_token',
];

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;

  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  document.cookie.split(';').forEach((cookie) => {
    const trimmed = cookie.trim();
    if (!trimmed) return;
    const equalsIndex = trimmed.indexOf('=');
    const name = equalsIndex >= 0 ? trimmed.slice(0, equalsIndex) : trimmed;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  });
};

export const signOutCurrentUser = async () => {
  try {
    await authApi.logout();
  } catch {
    // Ignore network/session issues during sign-out cleanup.
  }

  clearAuthSession();

  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
};
