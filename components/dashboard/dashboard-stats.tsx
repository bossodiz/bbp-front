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
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && !loading && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-success font-medium">
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
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
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            รายได้วันนี้
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenueToday)}
            </div>
          )}
          {!loading && stats.revenueToday > 0 && (
            <div className="mt-2 space-y-1">
              {stats.revenueTodayService > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            รายได้เดือนนี้
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <Banknote className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenueMonthly)}
            </div>
          )}
          {!loading && stats.revenueMonthly > 0 && (
            <div className="mt-2 space-y-1">
              {stats.revenueMonthlyService > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            สัตว์เข้ารับบริการวันนี้
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-dog/10 text-dog">
            <Dog className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">
              {stats.dogsToday + stats.catsToday} ตัว
            </div>
          )}
          {!loading && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Dog className="h-4 w-4 text-dog" />
                <span>หมา {stats.dogsToday} ตัว</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Cat className="h-4 w-4 text-cat" />
                <span>แมว {stats.catsToday} ตัว</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
