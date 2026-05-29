const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function uploadWithAuth<T>(
  path: string,
  file: File,
  token: string,
  fields?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value) form.append(key, value);
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || res.statusText);
  }

  return res.json();
}
