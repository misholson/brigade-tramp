export const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export function createApiClient(credentials?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (credentials) headers['Authorization'] = `Basic ${credentials}`;

  return {
    get: <T>(path: string): Promise<T> =>
      fetch(`${BASE_URL}${path}`, { headers }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      }),

    post: <T = unknown>(path: string, body?: unknown): Promise<T> =>
      fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text().then(t => (t ? JSON.parse(t) : undefined)) as Promise<T>;
      }),

    put: <T>(path: string, body?: unknown): Promise<T> =>
      fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      }),

    patch: <T = unknown>(path: string, body?: unknown): Promise<T> =>
      fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text().then(t => (t ? JSON.parse(t) : undefined)) as Promise<T>;
      }),

    delete: (path: string): Promise<void> =>
      fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      }),
  };
}
