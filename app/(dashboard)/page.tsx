import { Suspense } from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PetServiceChart } from "@/components/dashboard/pet-service-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <PageShell>
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมการดำเนินงานของร้านในวันนี้"
      />

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* จอใหญ่: 2x2 แบ่งความสูงที่เหลือเท่ากัน ไม่เลื่อนทั้งหน้า (รายการยาวเลื่อนในการ์ดเอง) */}
      <div className="grid gap-3 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-rows-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PetServiceChart />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <TopCustomers />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <RecentBookings />
        </Suspense>
      </div>
    </PageShell>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-80 rounded-xl" />;
}

function ListSkeleton() {
  return <Skeleton className="h-96 rounded-xl" />;
}
