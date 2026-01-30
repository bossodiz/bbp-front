"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// Mock data - จะเปลี่ยนเป็นข้อมูลจริงจาก database ภายหลัง
const weeklyData = [
  { date: "จ.", revenue: 3200, forfeitedDeposit: 0 },
  { date: "อ.", revenue: 4500, forfeitedDeposit: 500 },
  { date: "พ.", revenue: 3800, forfeitedDeposit: 0 },
  { date: "พฤ.", revenue: 5200, forfeitedDeposit: 300 },
  { date: "ศ.", revenue: 6800, forfeitedDeposit: 0 },
  { date: "ส.", revenue: 8500, forfeitedDeposit: 800 },
  { date: "อา.", revenue: 4850, forfeitedDeposit: 0 },
];

const monthlyData = [
  { date: "สัปดาห์ 1", revenue: 28500, forfeitedDeposit: 1200 },
  { date: "สัปดาห์ 2", revenue: 32000, forfeitedDeposit: 800 },
  { date: "สัปดาห์ 3", revenue: 35500, forfeitedDeposit: 1500 },
  { date: "สัปดาห์ 4", revenue: 29000, forfeitedDeposit: 600 },
];

const yearlyData = [
  { date: "ม.ค.", revenue: 98000, forfeitedDeposit: 4500 },
  { date: "ก.พ.", revenue: 105000, forfeitedDeposit: 3800 },
  { date: "มี.ค.", revenue: 112000, forfeitedDeposit: 5200 },
  { date: "เม.ย.", revenue: 125000, forfeitedDeposit: 4100 },
  { date: "พ.ค.", revenue: 118000, forfeitedDeposit: 3500 },
  { date: "มิ.ย.", revenue: 130000, forfeitedDeposit: 4800 },
  { date: "ก.ค.", revenue: 142000, forfeitedDeposit: 5500 },
  { date: "ส.ค.", revenue: 138000, forfeitedDeposit: 4200 },
  { date: "ก.ย.", revenue: 145000, forfeitedDeposit: 5800 },
  { date: "ต.ค.", revenue: 152000, forfeitedDeposit: 6100 },
  { date: "พ.ย.", revenue: 148000, forfeitedDeposit: 5400 },
  { date: "ธ.ค.", revenue: 165000, forfeitedDeposit: 7200 },
];

const chartConfig = {
  revenue: {
    label: "รายได้จากบริการ",
    color: "var(--color-chart-1)",
  },
  forfeitedDeposit: {
    label: "มัดจำยึด",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

type PeriodType = "weekly" | "monthly" | "yearly";

const periodLabels: Record<PeriodType, string> = {
  weekly: "รายสัปดาห์",
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export function RevenueChart() {
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const chartData = period === "weekly" ? weeklyData : period === "monthly" ? monthlyData : yearlyData;

  const totalRevenue = chartData.reduce(
    (sum, item) => sum + item.revenue + item.forfeitedDeposit,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>รายได้</CardTitle>
            <CardDescription>
              รวม{" "}
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
                minimumFractionDigits: 0,
              }).format(totalRevenue)}
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">รายสัปดาห์</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
              <SelectItem value="yearly">รายปี</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="var(--color-chart-1)"
              fill="var(--color-chart-1)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="forfeitedDeposit"
              stackId="1"
              stroke="var(--color-chart-2)"
              fill="var(--color-chart-2)"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
