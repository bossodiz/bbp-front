"use client";

import {
  Banknote,
  Dog,
  Cat,
  Calendar,
  Scissors,
  BedDouble,
  Package,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconClassName?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
  loading,
  children,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
        {trend && !loading && (
          <div className="flex items-center gap-1 mt-3 text-xs">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-success font-medium">
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data, loading } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    revenueToday: data?.revenueToday || 0,
    revenueTodayService: data?.revenueTodayService || 0,
    revenueTodayHotel: data?.revenueTodayHotel || 0,
    revenueTodayProduct: data?.revenueTodayProduct || 0,
    revenueMonthly: data?.revenueMonthly || 0,
    revenueMonthlyService: data?.revenueMonthlyService || 0,
    revenueMonthlyHotel: data?.revenueMonthlyHotel || 0,
    revenueMonthlyProduct: data?.revenueMonthlyProduct || 0,
    dogsToday: data?.dogsToday || 0,
    catsToday: data?.catsToday || 0,
    bookingsToday: data?.bookingsToday || 0,
    lowStockCount: data?.lowStockCount || 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="รายได้วันนี้"
        value={loading ? "" : formatCurrency(stats.revenueToday)}
        icon={Banknote}
        iconClassName="bg-primary/10 text-primary"
        loading={loading}
      >
        {!loading && stats.revenueToday > 0 && (
          <div className="mt-3 space-y-1.5">
            {stats.revenueTodayService > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Scissors className="h-3 w-3 text-muted-foreground" />
                  <span>บริการ</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueTodayService)}
                </span>
              </div>
            )}
            {stats.revenueTodayHotel > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-3 w-3 text-muted-foreground" />
                  <span>โรงแรม</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueTodayHotel)}
                </span>
              </div>
            )}
            {stats.revenueTodayProduct > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span>สินค้า</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueTodayProduct)}
                </span>
              </div>
            )}
          </div>
        )}
      </StatCard>

      <StatCard
        title="รายได้เดือนนี้"
        value={loading ? "" : formatCurrency(stats.revenueMonthly)}
        icon={Banknote}
        iconClassName="bg-success/10 text-success"
        loading={loading}
      >
        {!loading && stats.revenueMonthly > 0 && (
          <div className="mt-3 space-y-1.5">
            {stats.revenueMonthlyService > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Scissors className="h-3 w-3 text-muted-foreground" />
                  <span>บริการ</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueMonthlyService)}
                </span>
              </div>
            )}
            {stats.revenueMonthlyHotel > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-3 w-3 text-muted-foreground" />
                  <span>โรงแรม</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueMonthlyHotel)}
                </span>
              </div>
            )}
            {stats.revenueMonthlyProduct > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span>สินค้า</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(stats.revenueMonthlyProduct)}
                </span>
              </div>
            )}
          </div>
        )}
      </StatCard>

      <StatCard
        title="สัตว์เข้ารับบริการวันนี้"
        value={loading ? "" : `${stats.dogsToday + stats.catsToday} ตัว`}
        icon={Dog}
        iconClassName="bg-dog/10 text-dog"
        loading={loading}
      >
        {!loading && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Dog className="h-4 w-4 text-dog" />
              <span>สุนัข {stats.dogsToday} ตัว</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cat className="h-4 w-4 text-cat" />
              <span>แมว {stats.catsToday} ตัว</span>
            </div>
          </div>
        )}
      </StatCard>

      <StatCard
        title="นัดหมายวันนี้"
        value={stats.bookingsToday}
        subtitle="ทุกนัดหมาย"
        icon={Calendar}
        iconClassName="bg-info/10 text-info"
        loading={loading}
      />
    </div>
  );
}
