// Centralized authenticated API fetch helper

export const TOKEN_STORAGE_KEY = 'ecocivic_token';

let inMemoryToken: string | null = null;

export function getStoredToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  try {
    const local = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (local) {
      inMemoryToken = local;
      return local;
    }
  } catch (e) {
    // storage restricted in sandboxed iframe environments
  }
  try {
    const session = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (session) {
      inMemoryToken = session;
      return session;
    }
  } catch (e) {
    // storage restricted in sandboxed iframe environments
  }
  return inMemoryToken;
}

export function setStoredToken(token: string): void {
  inMemoryToken = token;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    // quiet catch for sandboxed environments
  }
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    // quiet catch for sandboxed environments
  }
}

export function clearStoredToken(): void {
  inMemoryToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    // quiet catch
  }
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    // quiet catch
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials || 'include',
  });
}

