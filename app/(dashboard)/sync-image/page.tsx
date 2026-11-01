"use client";

import { PageHeader, PageShell } from "@/components/page-shell";
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
    downloadApproved,
    downloadState,
    cleanupDownloaded,
    triggerSync,
  } = useSyncImages();

  useEffect(() => {
    fetchPending();
    fetchApproved();
    fetchRejected();
    fetchStatus();
  }, [fetchPending, fetchApproved, fetchRejected, fetchStatus]);

  return (
    <PageShell>
      <PageHeader
        title="ซิงค์รูปภาพ"
        description="จัดการรูปภาพจาก Facebook"
        actions={
          <UploadTrigger
            onDownload={downloadApproved}
            onSync={triggerSync}
            approvedCount={approvedImages.length}
            downloadState={downloadState}
            storageReady={status?.storageReady ?? true}
          />
        }
      />

      <div className="shrink-0">
        <SyncStatusBar status={status} onCleanup={cleanupDownloaded} />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs defaultValue="pending" className="gap-3 lg:min-h-0 lg:flex-1">
        <TabsList className="shrink-0">
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

        <TabsContent
          value="pending"
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
        >
          <ImageGrid
            images={pendingImages}
            loading={loading}
            onApprove={approveImage}
            onReject={rejectImage}
            emptyMessage="ไม่มีรูปภาพที่รอการอนุมัติ"
          />
        </TabsContent>

        {/* approved — แสดงปุ่มปฏิเสธเผื่อกดผิด */}
        <TabsContent
          value="approved"
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
        >
          <ImageGrid
            images={approvedImages}
            loading={approvedLoading}
            onReject={rejectImage}
            emptyMessage="ไม่มีรูปภาพที่อนุมัติแล้ว"
          />
        </TabsContent>

        {/* rejected — แสดงปุ่มอนุมัติเผื่อกดผิด */}
        <TabsContent
          value="rejected"
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
        >
          <ImageGrid
            images={rejectedImages}
            loading={rejectedLoading}
            onApprove={approveImage}
            emptyMessage="ไม่มีรูปภาพที่ปฏิเสธแล้ว"
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
