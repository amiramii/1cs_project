import api from "./api";
import { checkinPath } from "./checkinApi";
import { resolveAppRoleFromApi } from "./resolveAppRole";
import {
  clearDevRoleOverride,
  clearTokens,
  dispatchAppRoleChanged,
  getRoleFromAccessToken,
  normalizeRole,
  persistAppRole,
  persistTokens,
  persistUserEmail,
} from "./tokenStorage";
import { formatDrfError } from "./drfError";

async function login(email: string, password: string, remember = false) {
  const res = await api(
    checkinPath.token,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        remember_me: remember,
      }),
    },
    { withAuth: false }
  ).catch((err: unknown) => {
    if (err instanceof TypeError) {
      throw new Error(
        "Cannot reach the server. Check that the backend is running and NEXT_PUBLIC_API_URL is set correctly (e.g. https://checkin-backend-z1f2.onrender.com on Render)."
      )
    }
    throw err
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatDrfError(data, "Invalid credentials")
    );
  }

  if (typeof data.access !== "string" || typeof data.refresh !== "string") {
    throw new Error("Invalid response from server");
  }

  persistTokens(data.access, data.refresh, remember);

  const fromJwt = getRoleFromAccessToken(data.access);
  const fromBody = normalizeRole(data.role as unknown);
  let appRole = fromJwt ?? fromBody;

  if (!appRole) {
    appRole = await resolveAppRoleFromApi(data.access);
  }

  if (!appRole) {
    clearTokens();
    throw new Error(
      "Could not determine your account role. Please contact support."
    );
  }

  persistAppRole(appRole, remember);
  persistUserEmail(email, remember);
  dispatchAppRoleChanged();
  if (typeof window !== "undefined") {
    sessionStorage.setItem("chekin:role-probed", "1");
  }
  if (process.env.NODE_ENV === "development") {
    clearDevRoleOverride();
  }

  return data;
}

export default login;
