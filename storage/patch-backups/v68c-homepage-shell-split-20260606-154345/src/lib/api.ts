export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3001'
    : 'https://api.erlkim.web.id');

export function unwrap(input: any): any {
  if (input?.data?.items) return input.data.items;
  if (Array.isArray(input?.data)) return input.data;
  if (input?.data) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  return input;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' }
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  return unwrap(json);
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  return unwrap(json);
}
