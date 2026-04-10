import api from "./api";
import { persistTokens } from "./tokenStorage";
import { formatDrfError } from "./drfError";

async function login(email: string, password: string, remember = false) {
  const res = await api(
    "api/token",
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

  return data;
}

export default login;