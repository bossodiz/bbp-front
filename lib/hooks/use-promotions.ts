import { useState } from "react";
import { usePromotionStore } from "@/lib/store";
import { apiRequest } from "@/lib/api-client";
import type { Promotion } from "@/lib/types";

export function usePromotions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest("/promotions");
      const data = (result.data as any[]) || [];
      usePromotionStore.setState({ promotions: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const addPromotion = async (
    promotionData: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
  ) => {
    const result = await apiRequest("/promotions", {
      method: "POST",
      body: JSON.stringify({
        name: promotionData.name,
        type: promotionData.type,
        value: promotionData.value,
        applicable_to: promotionData.applicableTo,
        active: promotionData.active,
        start_date: promotionData.startDate
          ? String(promotionData.startDate)
          : undefined,
        end_date: promotionData.endDate
          ? String(promotionData.endDate)
          : undefined,
      }),
    });
    await fetchPromotions();
    return result.data;
  };

  const updatePromotion = async (id: number, data: Partial<Promotion>) => {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.type !== undefined) payload.type = data.type;
    if (data.value !== undefined) payload.value = data.value;
    if (data.applicableTo !== undefined)
      payload.applicable_to = data.applicableTo;
    if (data.active !== undefined) payload.active = data.active;
    if (data.startDate !== undefined)
      payload.start_date = data.startDate ? String(data.startDate) : null;
    if (data.endDate !== undefined)
      payload.end_date = data.endDate ? String(data.endDate) : null;

    const result = await apiRequest(`/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await fetchPromotions();
    return result.data;
  };

  const deletePromotion = async (id: number) => {
    await apiRequest(`/promotions/${id}`, { method: "DELETE" });
    await fetchPromotions();
  };

  const togglePromotion = async (id: number, active: boolean) => {
    await updatePromotion(id, { active });
  };

  return {
    promotions: usePromotionStore.getState().promotions,
    loading,
    error,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
  };
}
