import { useState, useCallback } from "react";
import type { FbImage, SyncStatus, CleanupResult, DownloadState } from "@/lib/types";

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
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: "idle",
    percent: 0,
    processed: 0,
    total: 0,
  });

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

  const downloadApproved = useCallback(async (): Promise<void> => {
    const reset = () =>
      setDownloadState({ status: "idle", percent: 0, processed: 0, total: 0 });

    // 1. prepare — สร้าง job เบื้องหลัง
    setDownloadState({ status: "preparing", percent: 0, processed: 0, total: 0 });
    const prepRes = await fetch(`${BACKEND_URL}/api/download/prepare`, { method: "POST" });
    if (!prepRes.ok) { reset(); throw new Error("เตรียมไฟล์ไม่สำเร็จ"); }
    const { jobId, total } = await prepRes.json();
    if (!jobId) { reset(); throw new Error("ไม่มีรูป approved"); }

    setDownloadState({ status: "building", percent: 0, processed: 0, total });

    // 2. poll progress ทุก 1 วินาที
    await new Promise<void>((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const pRes = await fetch(`${BACKEND_URL}/api/download/progress/${jobId}`);
          if (!pRes.ok) { clearInterval(timer); reset(); reject(new Error("ตรวจสอบ progress ไม่สำเร็จ")); return; }
          const p: { processed: number; total: number; percent: number; status: string; error?: string } = await pRes.json();
          setDownloadState({ status: "building", percent: p.percent, processed: p.processed, total: p.total });
          if (p.status === "ready") { clearInterval(timer); resolve(); }
          if (p.status === "error") { clearInterval(timer); reset(); reject(new Error(p.error ?? "เกิดข้อผิดพลาด")); }
        } catch (e) {
          clearInterval(timer);
          reset();
          reject(e);
        }
      }, 1000);
    });

    // 3. trigger download ผ่าน browser
    setDownloadState({ status: "done", percent: 100, processed: total, total });
    window.location.href = `${BACKEND_URL}/api/download/result/${jobId}`;

    await new Promise((r) => setTimeout(r, 1500));
    reset();
    await Promise.all([fetchApproved(), fetchRejected(), fetchStatus()]);
  }, [fetchApproved, fetchRejected, fetchStatus]);

  const cleanupDownloaded = useCallback(async (): Promise<CleanupResult> => {
    const res = await fetch(`${BACKEND_URL}/api/download/cleanup`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("ลบไฟล์ไม่สำเร็จ");
    const result: CleanupResult = await res.json();
    await fetchStatus();
    return result;
  }, [fetchStatus]);

  const triggerSync = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/sync/trigger`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Sync ไม่สำเร็จ");
    await Promise.all([
      fetchPending(),
      fetchApproved(),
      fetchRejected(),
      fetchStatus(),
    ]);
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
    downloadApproved,
    downloadState,
    cleanupDownloaded,
    triggerSync,
  };
}
