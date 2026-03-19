"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface SessionContextValue {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "contract-management-session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { token: string; user: SessionUser };
      setToken(session.token);
      setUser(session.user);
    }
    setReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<{ accessToken: string; user: SessionUser }>("/api/internal/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setToken(response.accessToken);
    setUser(response.user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: response.accessToken, user: response.user }));
  };

  const logout = () => {
    startTransition(() => {
      setToken(null);
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    });
  };

  return (
    <SessionContext.Provider value={{ token, user, ready, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return value;
}
