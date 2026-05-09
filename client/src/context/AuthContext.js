import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on first load

  // ── Restore session on app start ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("emi_token");
    const savedUser = localStorage.getItem("emi_user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      authAPI.getMe()
        .then(({ data }) => setUser(data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem("emi_token", data.token);
    localStorage.setItem("emi_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (formData) => {
    const { data } = await authAPI.login(formData);
    localStorage.setItem("emi_token", data.token);
    localStorage.setItem("emi_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("emi_token");
    localStorage.removeItem("emi_user");
    setUser(null);
  }, []);

  // ── Update user in state ───────────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("emi_user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
