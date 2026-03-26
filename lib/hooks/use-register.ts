"use client";

import { useState } from "react";
import { apiRequest, setToken } from "@/lib/api-client";

interface RegisterShopData {
  shopName: string;
  subdomain: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export function useRegister() {
  const [loading, setLoading] = useState(false);

  const registerShop = async (data: RegisterShopData) => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        shopId: string;
        email: string;
        name: string;
        role: string;
        shopName: string;
      }>("/auth/register-shop", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.data?.accessToken) {
        setToken(res.data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(res.data));
        }
      }

      return res;
    } finally {
      setLoading(false);
    }
  };

  return { registerShop, loading };
}
