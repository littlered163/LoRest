"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  getSessionToken: () => string | null;
}

const SESSION_KEY = "lorest.session";

function readSession(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: User; token: string };
  } catch {
    return null;
  }
}

function writeSession(user: User, token: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authenticated: false,
  login: () => undefined,
  logout: () => undefined,
  getSessionToken: () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, authenticated: false });

  useEffect(() => {
    queueMicrotask(() => {
      const session = readSession();
      if (session) {
        setState({ user: session.user, loading: false, authenticated: true });
      } else {
        setState({ user: null, loading: false, authenticated: false });
      }
    });
  }, []);

  function login(user: User, token: string) {
    writeSession(user, token);
    setState({ user, loading: false, authenticated: true });
  }

  function logout() {
    clearSession();
    setState({ user: null, loading: false, authenticated: false });
  }

  function getSessionToken() {
    return readSession()?.token ?? null;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
