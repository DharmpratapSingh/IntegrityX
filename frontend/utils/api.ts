export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 8000,
    retries = 1,
    retryDelayMs = 300,
    signal,
    ...rest
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...rest,
        signal: signal ?? controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      const isLast = attempt === retries;
      const isAbort = (err as any)?.name === 'AbortError';
      if (isLast || isAbort === false) {
        throw err;
      }
      await sleep(retryDelayMs);
    }
  }
  // Should be unreachable
  throw new Error('fetchWithTimeout: exhausted retries');
}

export async function json<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: unknown }> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const status = res.status;
    const ok = res.ok;
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : undefined;
    return { ok, status, data: body as T };
  } catch (error) {
    return { ok: false, status: 0, error };
  }
}

// Alias for compatibility
export const fetchJson = json;

















