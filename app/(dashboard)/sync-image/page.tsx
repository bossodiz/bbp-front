"use client";

import { useEffect } from "react";
import { useSyncImages } from "@/lib/hooks/use-sync-images";
import { SyncStatusBar } from "@/components/sync-image/sync-status-bar";
import { ImageGrid } from "@/components/sync-image/image-grid";
import { UploadTrigger } from "@/components/sync-image/upload-trigger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function SyncImagePage() {
  const {
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
  } = useSyncImages();

  useEffect(() => {
    fetchPending();
    fetchApproved();
    fetchRejected();
    fetchStatus();
  }, [fetchPending, fetchApproved, fetchRejected, fetchStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ซิงค์รูปภาพ</h1>
          <p className="text-muted-foreground">
            จัดการรูปภาพจาก Facebook และ upload ไป Google Maps
          </p>
        </div>
        <UploadTrigger onUpload={startUpload} onSync={triggerSync} />
      </div>

      <SyncStatusBar status={status} />

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            รอการอนุมัติ
            {pendingImages.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {pendingImages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            อนุมัติแล้ว
            {approvedImages.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                {approvedImages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            ปฏิเสธแล้ว
            {rejectedImages.length > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {rejectedImages.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <ImageGrid
            images={pendingImages}
            loading={loading}
            onApprove={approveImage}
            onReject={rejectImage}
            emptyMessage="ไม่มีรูปภาพที่รอการอนุมัติ"
          />
        </TabsContent>

        {/* approved — แสดงปุ่มปฏิเสธเผื่อกดผิด */}
        <TabsContent value="approved" className="mt-4">
          <ImageGrid
            images={approvedImages}
            loading={approvedLoading}
            onReject={rejectImage}
            emptyMessage="ไม่มีรูปภาพที่อนุมัติแล้ว"
          />
        </TabsContent>

        {/* rejected — แสดงปุ่มอนุมัติเผื่อกดผิด */}
        <TabsContent value="rejected" className="mt-4">
          <ImageGrid
            images={rejectedImages}
            loading={rejectedLoading}
            onApprove={approveImage}
            emptyMessage="ไม่มีรูปภาพที่ปฏิเสธแล้ว"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
