"use client";

import { useMemo, useState } from "react";
import {
  Cat,
  Dog,
  MoreVertical,
  Power,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ServiceDialog } from "./service-dialog";
import { useServices } from "@/lib/hooks/use-services";
import { useServiceConfigContext } from "@/lib/contexts/service-config-context";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types";
import { toast } from "sonner";

interface ServiceListProps {
  services: Service[];
  loading?: boolean;
  onRefresh?: () => void;
}

interface SizeColumn {
  id: string;
  name: string;
  description?: string;
}

const SPECIAL_TAB = "special";

// การ์ดบริการเรียงเป็นคอลัมน์: มือถือ 1 คอลัมน์, จอกลางขึ้นไป 2 คอลัมน์
const CARD_GRID = "grid gap-2 md:grid-cols-2 xl:grid-cols-3";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

export function ServiceList({
  services,
  loading,
  onRefresh,
}: ServiceListProps) {
  const {
    deleteService: deleteServiceAPI,
    toggleServiceStatus: toggleServiceAPI,
  } = useServices({ autoFetch: false });
  const { petTypes, getSizesForPetType } = useServiceConfigContext();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("");
  // ขนาดที่เลือกของแต่ละแท็บ (key = รหัสประเภทสัตว์); ยังไม่เลือก = ขนาดแรก
  const [sizeByTab, setSizeByTab] = useState<Record<string, string>>({});

  const handleDelete = async () => {
    if (!deletingService) return;
    try {
      await deleteServiceAPI(deletingService.id);
      toast.success("ลบบริการเรียบร้อยแล้ว");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setDeletingService(null);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      await toggleServiceAPI(service.id);
      toast.success(
        service.active ? "ปิดใช้งานบริการแล้ว" : "เปิดใช้งานบริการแล้ว",
      );
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  };

  // หนึ่งแท็บต่อประเภทสัตว์ที่เปิดใช้งาน + แท็บบริการพิเศษ: บนมือถือเห็นทีละประเภท เลื่อนน้อยลงมาก
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (s: Service) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q);

    const petGroups = [...petTypes]
      .filter((p) => p.active)
      .sort((a, b) => a.order - b.order)
      .map((petType) => {
        const sizes: SizeColumn[] = getSizesForPetType(petType.id)
          .filter((s) => s.active)
          .map((s) => ({ id: s.id, name: s.name, description: s.description }));
        const list = services.filter(
          (s) =>
            !s.isSpecial &&
            matches(s) &&
            s.prices?.some((p) => p.petTypeId === petType.id && p.price > 0),
        );
        return { key: petType.id, label: petType.name, sizes, list };
      })
      .filter((g) => g.sizes.length > 0);

    const special = services.filter((s) => s.isSpecial && matches(s));
    const hasAnySpecial = services.some((s) => s.isSpecial);
    return { petGroups, special, hasAnySpecial };
  }, [services, petTypes, getSizesForPetType, query]);

  const tabs = [
    ...groups.petGroups.map((g) => ({ key: g.key, label: g.label, count: g.list.length })),
    ...(groups.hasAnySpecial
      ? [{ key: SPECIAL_TAB, label: "พิเศษ", count: groups.special.length }]
      : []),
  ];
  const activeTab = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key;

  const rowActions = {
    onEdit: setEditingService,
    onDelete: setDeletingService,
    onToggle: handleToggleStatus,
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-4 py-12 text-center text-base text-muted-foreground">
        ยังไม่มีบริการในระบบ
      </div>
    );
  }

  return (
    <>
      {/* การ์ดใหญ่ใบเดียวบนจอใหญ่ (ค้นหา + แท็บ + รายการ) บนมือถือไม่ซ้อนกรอบเพื่อให้เหลือพื้นที่เต็มความกว้าง */}
      <div className="flex flex-col gap-3 lg:h-full lg:min-h-0 md:rounded-xl md:border md:bg-card md:p-4">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาบริการ"
            aria-label="ค้นหาบริการ"
            className="pl-10 text-base md:max-w-sm"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setTab} className="gap-3 lg:min-h-0 lg:flex-1">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1 md:w-fit">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="h-10 min-w-fit flex-1 gap-2 px-4 text-base md:flex-none"
              >
                <TabIcon id={t.key} />
                <span>{t.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {t.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.petGroups.map((group) => {
            const selected =
              group.sizes.find((z) => z.id === sizeByTab[group.key]) ??
              group.sizes[0];
            // แสดงเฉพาะขนาดที่เลือก (พนักงานรู้น้ำหนักสัตว์อยู่แล้ว เลือกขนาดแล้วเห็นราคาทุกบริการ)
            const items = group.list
              .map((service) => ({
                service,
                price: service.prices?.find(
                  (p) => p.petTypeId === group.key && p.sizeId === selected.id,
                )?.price,
              }))
              .filter((it) => it.price != null && it.price > 0);

            return (
              <TabsContent
                key={group.key}
                value={group.key}
                className="flex flex-col gap-3 lg:min-h-0 lg:flex-1"
              >
                <SizePicker
                  sizes={group.sizes}
                  selectedId={selected.id}
                  onSelect={(id) =>
                    setSizeByTab((prev) => ({ ...prev, [group.key]: id }))
                  }
                />
                <div className="flex shrink-0 flex-wrap items-baseline gap-x-2 border-b pb-1.5">
                  <h2 className="text-lg font-semibold">{selected.name} ({selected.description})</h2>
                  <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                    {items.length} บริการ
                  </span>
                </div>
                <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                  {items.length === 0 ? (
                    <EmptyState searching={query.trim() !== ""} />
                  ) : (
                    <ul className={CARD_GRID}>
                      {items.map(({ service, price }) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          price={price}
                          {...rowActions}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            );
          })}

          {groups.hasAnySpecial && (
            <TabsContent
              value={SPECIAL_TAB}
              className="flex flex-col gap-3 lg:min-h-0 lg:flex-1"
            >
              <p className="text-sm text-muted-foreground">
                ราคาเดียว ไม่แยกตามประเภทสัตว์และขนาด
              </p>
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                {groups.special.length === 0 ? (
                  <EmptyState searching={query.trim() !== ""} />
                ) : (
                  <ul className={CARD_GRID}>
                    {groups.special.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        price={service.specialPrice}
                        {...rowActions}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Service Dialog */}
      <ServiceDialog
        open={editingService !== null}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingService !== null}
        onOpenChange={(open) => !open && setDeletingService(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบบริการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบบริการ &quot;{deletingService?.name}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TabIcon({ id }: { id: string }) {
  if (id === "DOG") return <Dog className="h-5 w-5 text-dog" aria-hidden="true" />;
  if (id === "CAT") return <Cat className="h-5 w-5 text-cat" aria-hidden="true" />;
  return <Sparkles className="h-5 w-5 text-warning" aria-hidden="true" />;
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-10 text-center text-base text-muted-foreground">
      {searching ? "ไม่พบบริการที่ค้นหา" : "ยังไม่มีบริการในหมวดนี้"}
    </div>
  );
}

// "2 - 4.9 KG" -> "2 - 4.9": ตัดหน่วยออกให้ป้ายบนปุ่มสั้นลง (หน่วยเต็มอยู่ที่หัวข้อด้านล่าง)
function compactRange(text?: string) {
  if (!text) return "";
  return text
    .replace(/\s*kg\.?$/i, "")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

// ปุ่มเลือกขนาด (เลือกได้ทีละหนึ่ง): สองบรรทัด ชื่อขนาดตัวใหญ่ + ช่วงน้ำหนักตัวเล็ก
// เรียงเป็นแถวเดียว เลื่อนซ้าย-ขวาได้ (ปุ่มที่เลือกจะเลื่อนมาอยู่กลางจอให้เอง)
function SizePicker({
  sizes,
  selectedId,
  onSelect,
}: {
  sizes: SizeColumn[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (sizes.length < 2) return null;
  return (
    <div className="shrink-0 space-y-1">
      <p className="text-sm text-muted-foreground">เลือกขนาด · น้ำหนักเป็น กก.</p>
      <div
        role="group"
        aria-label="เลือกขนาด"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sizes.map((size) => {
          const active = size.id === selectedId;
          return (
            <button
              key={size.id}
              type="button"
              aria-pressed={active}
              onClick={(e) => {
                onSelect(size.id);
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
              }}
              className={cn(
                // มือถือ (< md): แสดง 5 ปุ่มพอดีแถว ที่เหลือเลื่อนซ้าย-ขวา
                // จอใหญ่ (md+): ขยายเท่า ๆ กันเต็มแถว ไม่ต่ำกว่า min-w-24 (ไม่พอก็เลื่อน)
                "flex min-h-14 w-[calc((100%-2rem)/5)] min-w-0 flex-none flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 whitespace-nowrap transition-colors",
                "md:w-auto md:min-w-24 md:flex-1 md:shrink-0 md:px-3",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              <span className="text-lg font-semibold leading-none">
                {size.name}
              </span>
              {size.description && (
                <span
                  className={cn(
                    "text-sm leading-none tabular-nums",
                    active ? "text-primary-foreground/90" : "text-muted-foreground",
                  )}
                >
                  {compactRange(size.description)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  price?: number;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggle: (service: Service) => void;
}

// การ์ดแถวเดียว: แตะที่การ์ดเพื่อแก้ไข, เมนู "⋯" สำหรับเปิด/ปิดใช้งานและลบ
function ServiceCard({
  service,
  price,
  onEdit,
  onDelete,
  onToggle,
}: ServiceCardProps) {
  const has = price != null && price > 0;

  return (
    <li className="flex items-center rounded-xl border bg-card pl-1 pr-1">
      <button
        type="button"
        onClick={() => onEdit(service)}
        aria-label={`แก้ไข ${service.name}`}
        className={cn(
          "flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left",
          "outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
          !service.active && "opacity-60",
        )}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold leading-snug">
              {service.name}
            </span>
            {!service.active && (
              <Badge variant="outline" className="text-sm">
                ปิดใช้งาน
              </Badge>
            )}
          </span>
          {service.description && (
            <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground md:line-clamp-2">
              {service.description}
            </span>
          )}
        </span>
        <span
          className={cn(
            "shrink-0 text-xl tabular-nums",
            has ? "font-semibold" : "text-muted-foreground",
          )}
        >
          {has ? formatCurrency(price) : "–"}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={`เมนูของ ${service.name}`}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            className="min-h-11 text-base"
            onSelect={() => onToggle(service)}
          >
            <Power />
            {service.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 text-base"
            onSelect={() => onDelete(service)}
          >
            <Trash2 />
            ลบบริการ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
