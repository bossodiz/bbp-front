import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * โครงหน้าสำหรับเมนูหลัก: บนจอใหญ่ (lg ขึ้นไป) หน้าสูงเท่าพื้นที่ที่เหลือและไม่เลื่อนทั้งหน้า
 * ส่วนที่ยาวเกินให้ห่อด้วย <PageScroll> เพื่อเลื่อนเฉพาะส่วนนั้น
 * ต่ำกว่า lg (แท็บเล็ต/มือถือ) ยังเป็นหน้าที่เลื่อนตามปกติ
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 lg:h-full lg:min-h-0", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** ส่วนที่เลื่อนได้เฉพาะตัวเองบนจอใหญ่ (กินที่ที่เหลือทั้งหมดของหน้า) */
export function PageScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain",
        className,
      )}
    >
      {children}
    </div>
  );
}
