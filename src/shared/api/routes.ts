const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.scienceclub.local';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  token?: string | null;
  headers?: Record<string, string>;
}

async function readErrorResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      return { parseError: error instanceof Error ? error.message : String(error) };
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch (error) {
    return { parseError: error instanceof Error ? error.message : String(error) };
  }
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: object | null,
  options: RequestOptions = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const config: RequestInit = {
    method,
    headers,
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    console.error('[API] Falha de conexão', {
      method,
      path,
      url,
      error,
    });
    throw error;
  }

  if (!response.ok) {
    let errorMessage = 'Não foi possível concluir a requisição.';
    const errorData = await readErrorResponse(response);
    errorMessage = errorData?.message || errorData?.error || errorMessage;

    console.error('[API] Requisição falhou', {
      method,
      path,
      status: response.status,
      statusText: response.statusText,
      response: errorData,
    });

    throw new Error(errorMessage);
  }

  // Se status 204, retorna vazio
  if (response.status === 204) {
    return {} as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

/**
 * Módulo de rotas centralizado para chamadas à API.
 * 
 * Uso:
 * ```ts
 * import { Routes } from '@/src/shared/api/routes';
 * 
 * const data = await Routes.get<MyType>('/api/some-endpoint');
 * const result = await Routes.post<MyType>('/api/create', { name: 'test' });
 * ```
 */
export const Routes = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, null, options),

  post: <T>(path: string, body?: object, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  patch: <T>(path: string, body?: object, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  put: <T>(path: string, body?: object, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, null, options),
};
