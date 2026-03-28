import api from "./api";
import { persistTokens } from "./tokenStorage";

async function login(email: string, password: string, remember = false) {
  const res = await api("api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  }, { withAuth: false });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await res.json();

  persistTokens(data.access, data.refresh, remember);

  return data;
}

export default login;