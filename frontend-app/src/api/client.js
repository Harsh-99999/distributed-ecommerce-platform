// fetch wrapper with Bearer + auto refresh-token rotation on 401.
//
// Flow:
//   1. Attach access token from localStorage as Bearer header
//   2. If response = 401 AND we have a refresh token AND haven't already retried →
//      POST /api/auth/refresh, save new tokens, retry the original request once
//   3. If refresh itself fails → clear tokens + bubble up 401 (caller will see auth error)

// `??` (not `||`) — empty string is a *valid* value: it means "use relative
// /api paths so nginx in the same container network can reverse-proxy them".
// `||` would treat "" as falsy and fall back to localhost:8080, which the
// browser can only reach on the dev machine, not from a containerised stack.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function getAccessToken() {
  return localStorage.getItem("accessToken");
}
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}
function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}
function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// Single-flight refresh — multiple parallel 401s share the same refresh promise
let refreshInFlight = null;
async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("no refresh token");
  refreshInFlight = (async () => {
    const res = await fetch(BASE + "/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error("refresh failed");
    const json = await res.json();
    const data = json.data || json;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function rawRequest(method, path, body, headers, retryOn401 = true) {
  const t = getAccessToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → try refresh + retry once
  if (res.status === 401 && retryOn401 && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return rawRequest(method, path, body, headers, /* retryOn401 */ false);
    } catch {
      clearTokens();
      // fall through and let caller handle the 401
    }
  }

  if (res.status === 204) return null;

  let data;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (data && data.message) ||
      (data && data.code) ||
      `${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, opts = {}) => rawRequest("GET", path, undefined, opts.headers),
  post: (path, body, opts = {}) => rawRequest("POST", path, body, opts.headers),
  put: (path, body, opts = {}) => rawRequest("PUT", path, body, opts.headers),
  patch: (path, body, opts = {}) => rawRequest("PATCH", path, body, opts.headers),
  delete: (path, opts = {}) => rawRequest("DELETE", path, undefined, opts.headers),
};

export function uuid() {
  return crypto.randomUUID();
}
