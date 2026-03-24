import { getAccessToken } from "./tokenStorage";

type ApiOptions = {
  withAuth?: boolean
}

async function api(url: string, options: RequestInit = {}, apiOptions: ApiOptions = {}) {
  const { withAuth = true } = apiOptions
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const cleanPath = url.replace(/^\/+/, "").replace(/\/+$/, "");

  return fetch(`${BASE_URL}/${cleanPath}/`, {
    ...options,
    headers: {
      ...(withAuth && token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

export default api;