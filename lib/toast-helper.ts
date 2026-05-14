"use client";

import { toast } from "sonner";

// ============================================================================
// TOAST HELPERS - Show success/error messages to user
// ============================================================================

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: (data: T) => string;
      error: (error: Error) => string;
    },
  ) => {
    return toast.promise(promise, options);
  },
};

// ============================================================================
// COMMON TOAST MESSAGES
// ============================================================================

export const toastMessages = {
  // Create
  productCreated: () => showToast.success("สินค้าสร้างสำเร็จ", ""),
  customerCreated: () => showToast.success("ลูกค้าสร้างสำเร็จ", ""),
  bookingCreated: () => showToast.success("จองสำเร็จ", ""),
  saleCreated: () => showToast.success("บันทึกการขายสำเร็จ", ""),

  // Update
  productUpdated: () => showToast.success("อัปเดตสินค้าสำเร็จ", ""),
  customerUpdated: () => showToast.success("อัปเดตลูกค้าสำเร็จ", ""),
  bookingUpdated: () => showToast.success("อัปเดตจองสำเร็จ", ""),

  // Delete
  productDeleted: () => showToast.success("ลบสินค้าสำเร็จ", ""),
  customerDeleted: () => showToast.success("ลบลูกค้าสำเร็จ", ""),
  bookingDeleted: () => showToast.success("ลบจองสำเร็จ", ""),

  // Errors
  error: (message: string) => showToast.error("เกิดข้อผิดพลาด", message),
  validationError: (message: string) => showToast.error("ข้อมูลไม่ถูกต้อง", message),
  networkError: () => showToast.error("เชื่อมต่อล้มเหลว", "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"),
  unauthorized: () => showToast.error("ไม่ได้รับอนุญาต", "กรุณาเข้าสู่ระบบใหม่"),
  rateLimitError: (retryAfter: number) =>
    showToast.error("ร้องขอมากเกินไป", `ลองใหม่ใน ${retryAfter} วินาที`),
};
