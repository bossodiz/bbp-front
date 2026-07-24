import { useState } from "react";
import { usePromotionStore } from "@/lib/store";
import type { Promotion } from "@/lib/types";
import { apiFetch, apiSend } from "@/lib/api";

export function usePromotions() {
  // ใช้ Zustand selector pattern - re-render เมื่อ promotions เปลี่ยน
  const promotions = usePromotionStore((state) => state.promotions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลโปรโมชั่นทั้งหมด - sync เข้า store เท่านั้น
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Promotion[]>("/api/promotions");
      // อัพเดทเข้า Zustand store อย่างเดียว
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
    const newPromotion = await apiSend<Promotion>("/api/promotions", "POST", promotionData);
    // ดึงข้อมูลใหม่จาก database หลังจากเพิ่มสำเร็จ
    await fetchPromotions();
    return newPromotion;
  };

  // อัพเดทโปรโมชั่น
  const updatePromotion = async (id: number, data: Partial<Promotion>) => {
    const updatedPromotion = await apiSend<Promotion>(`/api/promotions/${id}`, "PUT", data);
    // ดึงข้อมูลใหม่จาก database หลังจากแก้ไขสำเร็จ
    await fetchPromotions();
    return updatedPromotion;
  };

  // ลบโปรโมชั่น
  const deletePromotion = async (id: number) => {
    await apiSend<unknown>(`/api/promotions/${id}`, "DELETE");
    // ดึงข้อมูลใหม่จาก database หลังจากลบสำเร็จ
    await fetchPromotions();
  };

  // เปิด/ปิดโปรโมชั่น
  const togglePromotion = async (id: number, active: boolean) => {
    try {
      await updatePromotion(id, { active });
    } catch (err) {
      throw err;
    }
  };

  // ไม่มี auto-fetch - ให้ component เรียก fetchPromotions() เอง

  return {
    promotions, // reactive via Zustand selector
    loading,
    error,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
  };
}
