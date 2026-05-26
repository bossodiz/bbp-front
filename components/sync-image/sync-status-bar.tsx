"use client";

import { SyncStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface SyncStatusBarProps {
  status: SyncStatus | null;
}

export function SyncStatusBar({ status }: SyncStatusBarProps) {
  if (!status) return null;

  const lastFetch = status.lastFetchTime
    ? format(new Date(status.lastFetchTime), "d MMM yyyy HH:mm", { locale: th })
    : "ยังไม่เคย fetch";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            status.dbConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-muted-foreground">
          {status.dbConnected
            ? "เชื่อมต่อฐานข้อมูลแล้ว"
            : "ไม่สามารถเชื่อมต่อฐานข้อมูล"}
        </span>
      </div>

      <span className="text-muted-foreground">|</span>

      <span className="text-muted-foreground">
        Fetch ล่าสุด:{" "}
        <span className="font-medium text-foreground">{lastFetch}</span>
      </span>

      <span className="text-muted-foreground">|</span>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{status.pendingCount} รอการอนุมัติ</Badge>
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          {status.approvedCount} อนุมัติแล้ว
        </Badge>
        <Badge variant="outline" className="border-green-500 text-green-600">
          {status.uploadedCount} upload แล้ว
        </Badge>
      </div>
    </div>
  );
}
