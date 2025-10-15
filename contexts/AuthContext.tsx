'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
  encryptionSalt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  encryptionSalt: string | null;
  encryptionKey: CryptoKey | null;
  setEncryptionKey: (key: CryptoKey | null) => void;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
};

const STORAGE_KEY = "auth-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [encryptionSalt, setEncryptionSalt] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKeyState] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthSession;
        setUser(parsed.user);
        setToken(parsed.token);
        setEncryptionSalt(parsed.encryptionSalt);
      }
    } catch (error) {
      console.warn("Failed to parse stored auth session", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    setEncryptionSalt(session.encryptionSalt);
    setEncryptionKeyState(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn("Failed to persist auth session", error);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setEncryptionSalt(null);
    setEncryptionKeyState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear auth session", error);
    }
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } catch (error) {
      console.warn("Logout request failed", error);
    }
  }, []);

  const setEncryptionKey = useCallback((key: CryptoKey | null) => {
    setEncryptionKeyState(key);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      encryptionSalt,
      encryptionKey,
      setEncryptionKey,
      login,
      logout,
      isAuthenticated: Boolean(user && token),
      loading
    }),
    [user, token, encryptionSalt, encryptionKey, login, logout, setEncryptionKey, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
