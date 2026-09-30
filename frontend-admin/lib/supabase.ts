/**
 * Supabase Client Configuration & REST API Helper
 *
 * Project Reference: sijfxilgezxtprswtrmx
 * Supabase URL: https://sijfxilgezxtprswtrmx.supabase.co
 * REST Endpoint: https://sijfxilgezxtprswtrmx.supabase.co/rest/v1/
 */

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sijfxilgezxtprswtrmx.supabase.co',
  restUrl: process.env.NEXT_PUBLIC_SUPABASE_REST_URL || 'https://sijfxilgezxtprswtrmx.supabase.co/rest/v1',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

/**
 * Direct REST API query helper for Supabase PostgREST endpoints.
 * Makes authenticated requests using the anon/service key.
 */
export async function supabaseRestQuery<T = any>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { method = 'GET', query = {}, body, headers = {} } = options;

  try {
    const url = new URL(`${SUPABASE_CONFIG.restUrl}/${table}`);
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      ...headers,
    };

    const res = await fetch(url.toString(), {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { data: null, error: `Supabase Error (${res.status}): ${errText}` };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to connect to Supabase REST API' };
  }
}
