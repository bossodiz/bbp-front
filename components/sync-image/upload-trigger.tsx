"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadState } from "@/lib/types";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadTriggerProps {
  onDownload: () => Promise<void>;
  onSync: () => Promise<void>;
  approvedCount?: number;
  downloadState: DownloadState;
}

export function UploadTrigger({
  onDownload,
  onSync,
  approvedCount = 0,
  downloadState,
}: UploadTriggerProps) {
  const [syncing, setSyncing] = useState(false);

  const isDownloading =
    downloadState.status === "preparing" || downloadState.status === "building";
  const isDone = downloadState.status === "done";
  const isBusy = syncing || isDownloading || isDone;

  const handleDownload = async () => {
    try {
      await onDownload();
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
      toast.success("ดึงรูปใหม่จาก Facebook สำเร็จ");
    } catch {
      toast.error("ดึงรูปภาพไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleSync} disabled={isBusy}>
        {syncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        ดึงรูปใหม่
      </Button>

      {isDownloading || isDone ? (
        <DownloadProgress state={downloadState} />
      ) : (
        <Button onClick={handleDownload} disabled={isBusy || approvedCount === 0}>
          <Download className="mr-2 h-4 w-4" />
          ดาวน์โหลด
          {approvedCount > 0 && (
            <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
              {approvedCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

function DownloadProgress({ state }: { state: DownloadState }) {
  const isPreparing = state.status === "preparing";
  const isDone = state.status === "done";

  return (
    <div className="flex min-w-45 items-center gap-3 rounded-md border bg-card px-3 py-1.5">
      {isPreparing ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">เตรียมไฟล์...</span>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {isDone ? "กำลังโหลด..." : `${state.processed}/${state.total} รูป`}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  isDone ? "text-green-600" : "text-foreground",
                )}
              >
                {state.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isDone ? "bg-green-500" : "bg-primary",
                )}
                style={{ width: `${state.percent}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
