import { useState, useCallback } from "react";
import type { FbImage, SyncStatus, UploadResult } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function useSyncImages() {
  const [pendingImages, setPendingImages] = useState<FbImage[]>([]);
  const [approvedImages, setApprovedImages] = useState<FbImage[]>([]);
  const [rejectedImages, setRejectedImages] = useState<FbImage[]>([]);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/posts/pending`);
      if (!res.ok) throw new Error("โหลดรูปภาพไม่สำเร็จ");
      const data: FbImage[] = await res.json();
      setPendingImages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApproved = useCallback(async () => {
    try {
      setApprovedLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/posts/approved`);
      if (!res.ok) throw new Error("โหลดรูปภาพไม่สำเร็จ");
      const data: FbImage[] = await res.json();
      setApprovedImages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setApprovedLoading(false);
    }
  }, []);

  const fetchRejected = useCallback(async () => {
    try {
      setRejectedLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/posts/rejected`);
      if (!res.ok) throw new Error("โหลดรูปภาพไม่สำเร็จ");
      const data: FbImage[] = await res.json();
      setRejectedImages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setRejectedLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`);
      if (!res.ok) return;
      const data: SyncStatus = await res.json();
      setStatus(data);
    } catch {
      // status ไม่ใช่ critical ไม่ต้อง set error
    }
  }, []);

  const approveImage = useCallback(
    async (id: number) => {
      // Optimistic: ลบออกจาก pending และ rejected (ครอบคลุมทั้งสอง tab ที่มีปุ่มนี้)
      setPendingImages((prev) => prev.filter((img) => img.id !== id));
      setRejectedImages((prev) => prev.filter((img) => img.id !== id));
      const res = await fetch(`${BACKEND_URL}/api/posts/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        await Promise.all([fetchPending(), fetchRejected()]);
        throw new Error("อนุมัติรูปไม่สำเร็จ");
      }
      await Promise.all([fetchApproved(), fetchStatus()]);
    },
    [fetchPending, fetchRejected, fetchApproved, fetchStatus],
  );

  const rejectImage = useCallback(
    async (id: number) => {
      // Optimistic: ลบออกจาก pending และ approved (ครอบคลุมทั้งสอง tab ที่มีปุ่มนี้)
      setPendingImages((prev) => prev.filter((img) => img.id !== id));
      setApprovedImages((prev) => prev.filter((img) => img.id !== id));
      const res = await fetch(`${BACKEND_URL}/api/posts/${id}/reject`, {
        method: "POST",
      });
      if (!res.ok) {
        await Promise.all([fetchPending(), fetchApproved()]);
        throw new Error("ปฏิเสธรูปไม่สำเร็จ");
      }
      await Promise.all([fetchRejected(), fetchStatus()]);
    },
    [fetchPending, fetchApproved, fetchRejected, fetchStatus],
  );

  const startUpload = useCallback(async (): Promise<UploadResult> => {
    const res = await fetch(`${BACKEND_URL}/api/upload/start`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Upload ไม่สำเร็จ");
    const result: UploadResult = await res.json();
    await Promise.all([fetchApproved(), fetchStatus()]);
    return result;
  }, [fetchApproved, fetchStatus]);

  const triggerSync = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/sync/trigger`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Sync ไม่สำเร็จ");
    await Promise.all([fetchPending(), fetchApproved(), fetchRejected(), fetchStatus()]);
  }, [fetchPending, fetchApproved, fetchRejected, fetchStatus]);

  return {
    pendingImages,
    approvedImages,
    rejectedImages,
    status,
    loading,
    approvedLoading,
    rejectedLoading,
    error,
    fetchPending,
    fetchApproved,
    fetchRejected,
    fetchStatus,
    approveImage,
    rejectImage,
    startUpload,
    triggerSync,
  };
}
