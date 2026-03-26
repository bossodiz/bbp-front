"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest, getToken, setToken, removeToken } from "@/lib/api-client";

export interface AuthUser {
  userId: string;
  shopId: string;
  email: string;
  name: string;
  role: string;
  shopName: string;
}

export function useAuthLogic() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    const stored = storedUser ? JSON.parse(storedUser) : null;
    if (stored && getToken()) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      shopId: string;
      email: string;
      name: string;
      role: string;
      shopName: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.accessToken) {
      setToken(res.data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(res.data));
      }
    }
    if (res.data) {
      setUser({
        userId: res.data.userId,
        shopId: res.data.shopId,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        shopName: res.data.shopName,
      });
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!getToken(),
  };
}
