"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadTriggerProps {
  onDownload: () => Promise<void>;
  onSync: () => Promise<void>;
  approvedCount?: number;
}

export function UploadTrigger({
  onDownload,
  onSync,
  approvedCount = 0,
}: UploadTriggerProps) {
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload();
      toast.success("ดาวน์โหลดรูปภาพสำเร็จ");
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setDownloading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
      toast.success("ดึงรูปภาพใหม่จาก Facebook สำเร็จ");
    } catch {
      toast.error("ดึงรูปภาพไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleSync}
        disabled={syncing || downloading}
      >
        {syncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        ดึงรูปใหม่
      </Button>

      <Button
        onClick={handleDownload}
        disabled={downloading || syncing || approvedCount === 0}
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        ดาวน์โหลดรูปอนุมัติ
        {approvedCount > 0 && (
          <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
            {approvedCount}
          </span>
        )}
      </Button>
    </div>
  );
}
