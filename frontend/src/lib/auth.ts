import api from "./api";
import { checkinPath } from "./checkinApi";
import {
  clearDevRoleOverride,
  clearStoredAppRole,
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
  );

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
  const appRole = fromJwt ?? fromBody;
  if (appRole) {
    persistAppRole(appRole, remember);
  } else {
    clearStoredAppRole();
  }
  persistUserEmail(email, remember);
  if (process.env.NODE_ENV === "development") {
    clearDevRoleOverride();
  }

  return data;
}

export default login;