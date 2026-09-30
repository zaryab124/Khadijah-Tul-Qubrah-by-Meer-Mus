/**
 * API configuration and URL resolver for multi-service deployment.
 *
 * Supports Vercel Services architecture:
 * - Server-side runtime (Serverless Functions, SSR, Route Handlers):
 *   Uses the Vercel internal service binding `process.env.BACKEND_URL`
 *   to communicate with the backend service internally via `new URL()`.
 * - Client-side browser runtime:
 *   Calls `/api/v1/...` relative to current origin, which is routed to the
 *   backend service by Vercel top-level rewrites on the unified domain.
 * - Local development:
 *   Falls back to NEXT_PUBLIC_API_URL or 'http://localhost:4000/api/v1'.
 */
export function getBackendApiUrl(endpoint: string = ''): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 1. Server-side runtime with Vercel service binding
  if (typeof window === 'undefined' && process.env.BACKEND_URL) {
    const base = process.env.BACKEND_URL.endsWith('/')
      ? process.env.BACKEND_URL
      : `${process.env.BACKEND_URL}/`;
    return new URL(`api/v1/${cleanEndpoint}`, base).toString();
  }

  // 2. Client-side browser runtime (same domain routed via Vercel rewrites)
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
      return cleanEndpoint ? `${base}/${cleanEndpoint}` : base;
    }
    return cleanEndpoint ? `/api/v1/${cleanEndpoint}` : '/api/v1';
  }

  // 3. Fallback for server-side local development without binding
  const fallback = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const base = fallback.replace(/\/+$/, '');
  return cleanEndpoint ? `${base}/${cleanEndpoint}` : base;
}
