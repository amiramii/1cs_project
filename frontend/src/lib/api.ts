import { getAccessToken } from "./tokenStorage";

type ApiOptions = {
  withAuth?: boolean
}

function buildApiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  let cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (base.endsWith("/api") && cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.slice(4);
  }
  return `${base}/${cleanPath}/`;
}

async function api(url: string, options: RequestInit = {}, apiOptions: ApiOptions = {}) {
  const { withAuth = true } = apiOptions
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  return fetch(buildApiUrl(url), {
    ...options,
    headers: {
      ...(withAuth && token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

export default api;