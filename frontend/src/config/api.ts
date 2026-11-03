/**
 * Konfigurasi Base URL API untuk Frontend
 * 
 * - Pada lokal dev (tanpa VITE_API_URL): otomatis menggunakan http://localhost:8787/api
 * - Pada Cloudflare Pages: otomatis menggunakan Cloudflare Worker publik.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('pages.dev')
    ? 'https://distribusiapp-backend.digreator.workers.dev/api'
    : 'http://localhost:8787/api')
).replace(/\/+$/, '');

/**
 * Setup interceptor otomatis untuk fetch:
 * 1. Mengalihkan pemanggilan fetch() yang mengarah ke http://localhost:8787/api ke API_BASE_URL yang aktif.
 * 2. Menginjeksi header x-tenant-id dan Authorization secara otomatis untuk SaaS Multi-tenant.
 */
export function setupApiInterceptor() {
  const targetApi =
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.endsWith('pages.dev')
      ? 'https://distribusiapp-backend.digreator.workers.dev/api'
      : '');
  const targetClean = targetApi ? targetApi.replace(/\/+$/, '') : '';
  const originalFetch = window.fetch;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let reqInit: RequestInit = init ? { ...init } : {};

    // Auto-attach x-tenant-id and Authorization for SaaS Multi-tenant
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('distribusi_tenant_id');
      const token = localStorage.getItem('distribusi_token');

      const headers = new Headers(reqInit.headers || (input instanceof Request ? input.headers : {}));
      if (tenantId && !headers.has('x-tenant-id')) {
        headers.set('x-tenant-id', tenantId);
      }
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      reqInit.headers = headers;
    }

    if (targetClean) {
      if (typeof input === 'string') {
        if (input.startsWith('http://localhost:8787/api')) {
          input = input.replace('http://localhost:8787/api', targetClean);
        }
      } else if (input instanceof URL) {
        if (input.href.startsWith('http://localhost:8787/api')) {
          input = new URL(input.href.replace('http://localhost:8787/api', targetClean));
        }
      } else if (input instanceof Request) {
        if (input.url.startsWith('http://localhost:8787/api')) {
          const newUrl = input.url.replace('http://localhost:8787/api', targetClean);
          input = new Request(newUrl, { ...input, headers: reqInit.headers });
        }
      }
    }

    return originalFetch(input, reqInit);
  };
}
