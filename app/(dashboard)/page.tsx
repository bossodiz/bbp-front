import { Suspense } from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PetServiceChart } from "@/components/dashboard/pet-service-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { Skeleton } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">ภาพรวมการดำเนินงานของร้าน</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PetServiceChart />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ListSkeleton />}>
          <TopCustomers />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <RecentBookings />
        </Suspense>
      </div>
    </div>
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
