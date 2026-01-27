"use client";

import React from "react"

import {
  Banknote,
  Dog,
  Cat,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data - จะเปลี่ยนเป็นข้อมูลจริงจาก database ภายหลัง
const stats = {
  todayRevenue: 4850,
  weekRevenue: 28500,
  monthRevenue: 125000,
  todayDogs: 8,
  todayCats: 3,
  weekDogs: 45,
  weekCats: 18,
  monthDogs: 180,
  monthCats: 72,
  todayBookings: 5,
};

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
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
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
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-success font-medium">+{trend.value}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="รายได้วันนี้"
        value={formatCurrency(stats.todayRevenue)}
        subtitle={`สัปดาห์นี้ ${formatCurrency(stats.weekRevenue)}`}
        icon={Banknote}
        trend={{ value: 12, label: "จากสัปดาห์ก่อน" }}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        title="รายได้เดือนนี้"
        value={formatCurrency(stats.monthRevenue)}
        icon={Banknote}
        trend={{ value: 8, label: "จากเดือนก่อน" }}
        iconClassName="bg-success/10 text-success"
      />
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
          <div className="text-2xl font-bold">{stats.todayDogs + stats.todayCats} ตัว</div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Dog className="h-4 w-4 text-dog" />
              <span>หมา {stats.todayDogs} ตัว</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cat className="h-4 w-4 text-cat" />
              <span>แมว {stats.todayCats} ตัว</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <StatCard
        title="นัดหมายวันนี้"
        value={stats.todayBookings}
        subtitle="รอรับบริการ"
        icon={Calendar}
        iconClassName="bg-info/10 text-info"
      />
    </div>
  );
}
