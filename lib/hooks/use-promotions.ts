import { useState, useEffect } from "react";
import { usePromotionStore } from "@/lib/store";
import type { Promotion } from "@/lib/types";

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลโปรโมชั่นทั้งหมด
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/promotions");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลโปรโมชั่นได้");
      const data = await response.json();
      setPromotions(data);
      // Sync to Zustand store
      usePromotionStore.setState({ promotions: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // สร้างโปรโมชั่นใหม่
  const addPromotion = async (
    promotionData: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถสร้างโปรโมชั่นได้");
      }

      const newPromotion = await response.json();
      // ดึงข้อมูลใหม่จาก database หลังจากเพิ่มสำเร็จ
      await fetchPromotions();
      return newPromotion;
    } catch (err) {
      throw err;
    }
  };

  // อัพเดทโปรโมชั่น
  const updatePromotion = async (id: number, data: Partial<Promotion>) => {
    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถอัพเดทโปรโมชั่นได้");
      }

      const updatedPromotion = await response.json();
      // ดึงข้อมูลใหม่จาก database หลังจากแก้ไขสำเร็จ
      await fetchPromotions();
      return updatedPromotion;
    } catch (err) {
      throw err;
    }
  };

  // ลบโปรโมชั่น
  const deletePromotion = async (id: number) => {
    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถลบโปรโมชั่นได้");
      }

      // ดึงข้อมูลใหม่จาก database หลังจากลบสำเร็จ
      await fetchPromotions();
    } catch (err) {
      throw err;
    }
  };

  // เปิด/ปิดโปรโมชั่น
  const togglePromotion = async (id: number, active: boolean) => {
    try {
      await updatePromotion(id, { active });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
  };
}
