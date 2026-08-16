const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function visitorKey() {
  return "zt_visitor";
}

export function userTokenKey() {
  return "zt_user";
}

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(visitorKey()) || sessionStorage.getItem(visitorKey()) || "";
}

export function getUserToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(userTokenKey()) || "";
}

export function persistVisitorId(id: string, opts?: { cookies?: boolean; localStorage?: boolean }) {
  sessionStorage.setItem(visitorKey(), id);
  if (opts?.localStorage) localStorage.setItem(visitorKey(), id);
  if (opts?.cookies) {
    document.cookie = `${visitorKey()}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    document.cookie = `zt_consent=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } else {
    document.cookie = `${visitorKey()}=; path=/; max-age=0`;
    document.cookie = `zt_consent=; path=/; max-age=0`;
  }
}

export function persistUserSession(
  token: string,
  visitorId: string,
  opts?: { cookies?: boolean; localStorage?: boolean },
) {
  sessionStorage.setItem(userTokenKey(), token);
  persistVisitorId(visitorId, opts);
}

export function clearUserSession() {
  sessionStorage.removeItem(userTokenKey());
  sessionStorage.removeItem(visitorKey());
  localStorage.removeItem(visitorKey());
  document.cookie = `${visitorKey()}=; path=/; max-age=0`;
  document.cookie = `zt_consent=; path=/; max-age=0`;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const visitorId = getVisitorId();
  if (visitorId) headers.set("X-Visitor-Id", visitorId);
  const auth = token || getUserToken();
  if (auth) headers.set("Authorization", `Bearer ${auth}`);

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red");
  return data as T;
}

export const api = {
  register: (body: unknown) =>
    request<{ token: string; visitor: { visitorId: string } }>("/api/session/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: unknown) =>
    request<{ token: string; visitor: { visitorId: string } }>("/api/session/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  heartbeat: (body: unknown) => request("/api/session/heartbeat", { method: "POST", body: JSON.stringify(body) }),
  leave: () => request("/api/session/leave", { method: "POST", body: "{}" }),
  leaveKeepAlive: () => {
    const token = getUserToken();
    const visitorId = getVisitorId();
    if (!token) return;
    void fetch(`${API}/api/session/leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Visitor-Id": visitorId,
      },
      body: "{}",
      keepalive: true,
      credentials: "include",
    });
  },
  me: () => request("/api/session/me"),
  consent: (body: unknown) => request("/api/session/consent", { method: "POST", body: JSON.stringify(body) }),
  permissions: (body: unknown) =>
    request("/api/session/permissions", { method: "POST", body: JSON.stringify(body) }),
  event: (body: unknown) => request("/api/session/events", { method: "POST", body: JSON.stringify(body) }),
  awareness: () => request("/api/session/awareness"),
  adminLogin: (username: string, password: string) =>
    request<{ token: string; username: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  adminStats: (token: string) => request("/api/admin/stats", undefined, token),
  adminVisitors: (token: string, q = "", device = "") =>
    request(`/api/admin/visitors?q=${encodeURIComponent(q)}&device=${encodeURIComponent(device)}`, undefined, token),
  adminVisitor: (token: string, id: string) => request(`/api/admin/visitors/${id}`, undefined, token),
  adminDelete: (token: string, id: string) =>
    request(`/api/admin/visitors/${id}`, { method: "DELETE" }, token),
  adminEvents: (token: string, type = "") =>
    request(`/api/admin/events?type=${encodeURIComponent(type)}`, undefined, token),
};
