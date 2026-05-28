export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.scienceclub.local';

export function resolveApiUrl(path?: string | null) {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export type ApiClientOptions = RequestInit & {
  token?: string | null;
};

export async function apiClient<TResponse>(
  path: string,
  { token, headers, ...options }: ApiClientOptions = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = 'Nao foi possivel concluir a requisicao.';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (typeof data?.message === 'string' && data.message.trim().length > 0) {
          message = data.message;
        } else if (typeof data?.error === 'string' && data.error.trim().length > 0) {
          message = data.error;
        }
      } else {
        const text = await response.text();
        if (text?.trim()) {
          message = text.trim();
        }
      }
    } catch {}

    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  return response.json() as Promise<TResponse>;
}
