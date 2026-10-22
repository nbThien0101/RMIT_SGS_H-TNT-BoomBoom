"use client";
// Calls to OUR API must carry the DPoP-bound token + a DPoP proof (the template's withAuth rejects a
// plain Bearer). secureFetch from useTideCloak() does both. It needs an ABSOLUTE url: with a relative
// one it throws `Invalid URL` while building the proof's htu (canon troubleshooting, AP-74).
export type SecureFetch = (url: string, init?: RequestInit) => Promise<Response>;

export function makeApiFetch(secureFetch: SecureFetch | undefined) {
  return async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (typeof secureFetch !== "function") {
      throw new Error("secureFetch is not available: DPoP must be on in providers.tsx (useDPoP)");
    }
    const headers = { "Content-Type": "application/json", ...(init.headers || {}) };
    return secureFetch(new URL(path, window.location.origin).href, { ...init, headers });
  };
}

/** POST JSON and throw the server's error message on a non-2xx answer. */
export async function postJson<T = unknown>(apiFetch: ReturnType<typeof makeApiFetch>, path: string, body: object): Promise<T> {
  const r = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j as T;
}

export async function getJson<T = unknown>(apiFetch: ReturnType<typeof makeApiFetch>, path: string): Promise<T> {
  const r = await apiFetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j as T;
}
