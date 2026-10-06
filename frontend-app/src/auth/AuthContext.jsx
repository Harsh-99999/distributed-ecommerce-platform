import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if token exists, fetch /me
  useEffect(() => {
    const t = localStorage.getItem("accessToken");
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .get("/api/users/me")
      .then((r) => setUser(r.data || r))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const r = await api.post("/api/auth/login", { email, password });
    const { accessToken, refreshToken } = r.data || r;
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    const me = await api.get("/api/users/me");
    setUser(me.data || me);
  }

  async function register(email, password) {
    await api.post("/api/auth/register", { email, password });
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
