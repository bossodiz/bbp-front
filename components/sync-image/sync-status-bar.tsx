"use client";

import { useState } from "react";
import { SyncStatus, CleanupResult } from "@/lib/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Wifi, WifiOff, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SyncStatusBarProps {
  status: SyncStatus | null;
  onCleanup?: () => Promise<CleanupResult>;
}

export function SyncStatusBar({ status, onCleanup }: SyncStatusBarProps) {
  const [cleaning, setCleaning] = useState(false);

  if (!status) return null;

  const lastFetch = status.lastFetchTime
    ? format(new Date(status.lastFetchTime), "d MMM yy HH:mm", { locale: th })
    : "—";

  const handleCleanup = async () => {
    if (!onCleanup) return;
    setCleaning(true);
    try {
      const result = await onCleanup();
      if (result.failed === 0) {
        toast.success(`ลบไฟล์สำเร็จ ${result.success} รูป`);
      } else {
        toast.warning(`ลบสำเร็จ ${result.success} · ล้มเหลว ${result.failed}`);
      }
    } catch {
      toast.error("ลบไฟล์ไม่สำเร็จ");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-md border bg-card px-3 py-1.5 text-xs">
      <div className="flex items-center gap-3 text-muted-foreground">
        {status.dbConnected ? (
          <Wifi className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-destructive" />
        )}
        <span>
          ดึงล่าสุด <span className="font-medium text-foreground">{lastFetch}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Stat dot="bg-amber-500" value={status.pendingCount} label="รอตรวจ" />
        <Stat dot="bg-blue-500" value={status.approvedCount} label="อนุมัติ" />
        <div className="flex items-center gap-1">
          <Stat dot="bg-orange-500" value={status.readyToDeleteCount} label="รอลบ" />
          {status.readyToDeleteCount > 0 && onCleanup && (
            <button
              type="button"
              onClick={handleCleanup}
              disabled={cleaning}
              title="ล้างไฟล์ออกจาก storage"
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 disabled:pointer-events-none disabled:opacity-50"
            >
              {cleaning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ dot, value, label }: { dot: string; value: number; label: string }) {
  const muted = value === 0;
  return (
    <span className={cn("flex items-center gap-1.5", muted && "opacity-40")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="font-medium tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
