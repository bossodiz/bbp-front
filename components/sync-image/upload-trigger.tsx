"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadResult } from "@/lib/types";
import { Upload, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadTriggerProps {
  onUpload: () => Promise<UploadResult>;
  onSync: () => Promise<void>;
}

export function UploadTrigger({ onUpload, onSync }: UploadTriggerProps) {
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const result = await onUpload();
      if (result.failed === 0) {
        toast.success(
          `Upload สำเร็จ ${result.success}/${result.attempted} รูป`,
        );
      } else {
        toast.warning(
          `Upload เสร็จสิ้น: สำเร็จ ${result.success}, ล้มเหลว ${result.failed} รูป`,
        );
      }
    } catch {
      toast.error("Upload ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
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
        disabled={syncing || uploading}
      >
        {syncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        ดึงรูปใหม่
      </Button>

      {/* <Button onClick={handleUpload} disabled={uploading || syncing}>
       */}
      <Button onClick={handleUpload} disabled={true} title="ฟีเจอร์นี้ยังไม่พร้อมใช้งาน">
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Upload ไป Google Maps ฟีเจอร์นี้ยังไม่พร้อมใช้งาน
      </Button>
    </div>
  );
}
