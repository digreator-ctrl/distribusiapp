/**
 * Konfigurasi Base URL API untuk Frontend
 * 
 * - Pada lokal dev (tanpa VITE_API_URL): otomatis menggunakan http://localhost:8787/api
 * - Pada production / Cloudflare Pages: set environment variable VITE_API_URL ke URL Cloudflare Worker Anda,
 *   misal: https://distribusiapp-backend.<subdomain>.workers.dev/api
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8787/api'
).replace(/\/+$/, '');

/**
 * Setup interceptor otomatis untuk fetch:
 * Jika VITE_API_URL diatur di environment, semua pemanggilan fetch()
 * yang mengarah ke http://localhost:8787/api otomatis dialihkan ke VITE_API_URL.
 */
export function setupApiInterceptor() {
  const targetApi = import.meta.env.VITE_API_URL;
  if (!targetApi) return;

  const targetClean = targetApi.replace(/\/+$/, '');
  const originalFetch = window.fetch;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
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
        input = new Request(newUrl, input);
      }
    }
    return originalFetch(input, init);
  };
}
