import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  persistTokens,
  isRememberMeSession,
} from "./tokenStorage";
import { checkinPath } from "./checkinApi";

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
function buildHeader(options: RequestInit = {},apiOptions: ApiOptions = {}){
  const token= typeof window==="undefined" ? null: getAccessToken()
  const { withAuth = true } = apiOptions
  return(
     {
      "Content-Type":"application/json", 
      ...(withAuth && token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }
  )
}
async function tryRefresh(refresh: string): Promise<boolean> {
  const res = await fetch(buildApiUrl(`/${checkinPath.tokenRefresh}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    return false;
  }
  const data = await res.json().catch(() => ({}));
  if (typeof data.access !== "string") {
    return false;
  }
  const nextRefresh =
    typeof data.refresh === "string" ? data.refresh : refresh;
  persistTokens(data.access, nextRefresh, isRememberMeSession());
  return true;
} 
async function api(url: string, options: RequestInit = {}, apiOptions: ApiOptions = {}) {
  const { withAuth = true } = apiOptions
  const res = await fetch(buildApiUrl(url), {
    ...options,
    headers:buildHeader(options,apiOptions),
  })
  if(withAuth && res.status===401){
    const refresh=typeof window!=="undefined"?getRefreshToken():null;
    let refreshed=false;
    if( refresh){refreshed=await tryRefresh(refresh);}
    if(refreshed){
      const res=await fetch(buildApiUrl(url), {
        ...options,
        headers:buildHeader(options,apiOptions),
      })
      return res
    }
    clearTokens();
    if(typeof window!=="undefined"){
      window.location.href="/Login"
    }

  }
  return res
}

export default api;