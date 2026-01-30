"use client";

import { useState, useMemo } from "react";
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useRevenueChart } from "@/lib/hooks/use-revenue-chart";

import { Loader2 } from "lucide-react";
import { toUtcIsoFromBangkokLocal } from "@/lib/utils";

const chartConfig = {
  revenue: {
    label: "รายได้",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

type PeriodType = "weekly" | "monthly" | "yearly" | "last12months";

export function RevenueChart() {
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const { data, loading } = useRevenueChart(period);

  const nowBkk = new Date();

  // เอาวันตาม "เครื่องผู้ใช้" (ไทย) แล้วสร้าง boundary เป็น UTC
  const y = nowBkk.getFullYear();
  const m = nowBkk.getMonth() + 1;
  const d = nowBkk.getDate();

  const startTodayUtc = toUtcIsoFromBangkokLocal(y, m, d, 0, 0, 0);
  const startTomorrowUtc = toUtcIsoFromBangkokLocal(y, m, d + 1, 0, 0, 0);

  // จัดกลุ่มข้อมูลตาม period
  const chartData = useMemo(() => {
    const sales = data?.sales || [];

    if (period === "weekly") {
      // รายวัน 7 วัน
      const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
      const data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startTodayUtc);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: days[date.getDay()],
          revenue: 0,
          dateObj: date,
        };
      });

      sales.forEach((sale) => {
        // ข้อมูลจาก DB เป็น UTC+7 อยู่แล้ว ไม่ต้องแปลง
        const saleDate = new Date(sale.createdAt);
        saleDate.setHours(0, 0, 0, 0);

        const matchingIndex = data.findIndex((item) => {
          const itemDate = new Date(item.dateObj);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === saleDate.getTime();
        });

        if (matchingIndex >= 0) {
          data[matchingIndex].revenue += sale.totalAmount;
        }
      });

      return data;
    } else if (period === "monthly") {
      // รายวัน - แสดงทั้งเดือน (วันที่ 1 ถึงวันสุดท้าย)
      const firstDayOfMonth = new Date(
        nowBkk.getFullYear(),
        nowBkk.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        nowBkk.getFullYear(),
        nowBkk.getMonth() + 1,
        0,
      );

      const daysInMonth = lastDayOfMonth.getDate();

      const data = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(firstDayOfMonth);
        date.setDate(i + 1);
        return {
          date: `${date.getDate()}`,
          revenue: 0,
          dateObj: date,
        };
      });

      sales.forEach((sale) => {
        // ข้อมูลจาก DB เป็น UTC+7 อยู่แล้ว ไม่ต้องแปลง
        const saleDate = new Date(sale.createdAt);
        saleDate.setHours(0, 0, 0, 0);

        const matchingIndex = data.findIndex((item) => {
          const itemDate = new Date(item.dateObj);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === saleDate.getTime();
        });

        if (matchingIndex >= 0) {
          data[matchingIndex].revenue += sale.totalAmount;
        }
      });

      return data;
    } else if (period === "yearly") {
      // รายเดือน 12 เดือน
      const months = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];

      // สร้างข้อมูล 12 เดือนของปีปัจจุบัน (มกราคม-ธันวาคม)
      const data = Array.from({ length: 12 }, (_, i) => {
        const targetDate = new Date(
          nowBkk.getFullYear(),
          i, // เดือน 0-11 (มกราคม-ธันวาคม)
          1,
        );

        return {
          date: months[targetDate.getMonth()],
          revenue: 0,
          monthStart: targetDate,
          monthIndex: targetDate.getMonth(),
          year: targetDate.getFullYear(),
        };
      });

      sales.forEach((sale) => {
        // ข้อมูลจาก DB เป็น UTC+7 อยู่แล้ว ไม่ต้องแปลง
        const saleDate = new Date(sale.createdAt);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        // หา index ที่ตรงกับเดือนและปีของ sale
        const matchingIndex = data.findIndex(
          (item) => item.year === saleYear && item.monthIndex === saleMonth,
        );

        if (matchingIndex >= 0) {
          data[matchingIndex].revenue += sale.totalAmount;
        }
      });

      return data;
    } else {
      // 12 เดือนย้อนหลัง
      const months = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];

      // สร้างข้อมูล 12 เดือนย้อนหลังจากเดือนปัจจุบัน
      const data = Array.from({ length: 12 }, (_, i) => {
        const monthsAgo = 11 - i; // 11, 10, 9, ..., 0
        const targetDate = new Date(
          nowBkk.getFullYear(),
          nowBkk.getMonth() - monthsAgo,
          1,
        );

        return {
          date: months[targetDate.getMonth()],
          revenue: 0,
          monthStart: targetDate,
          monthIndex: targetDate.getMonth(),
          year: targetDate.getFullYear(),
        };
      });

      sales.forEach((sale) => {
        const saleDate = new Date(sale.createdAt);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        const matchingIndex = data.findIndex(
          (item) => item.year === saleYear && item.monthIndex === saleMonth,
        );

        if (matchingIndex >= 0) {
          data[matchingIndex].revenue += sale.totalAmount;
        }
      });

      return data;
    }
  }, [data?.sales, period, startTodayUtc]);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  // สร้าง label สำหรับเดือน
  const monthLabel = useMemo(() => {
    if (period !== "monthly") return "";
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const dateObj = new Date(startTodayUtc);
    return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }, [period, startTodayUtc]);

  // คำนวณ max value และ tick formatter
  const maxRevenue = Math.max(...chartData.map((item) => item.revenue), 0);
  const yAxisConfig = useMemo(() => {
    if (maxRevenue === 0) {
      return {
        domain: [0, 1000],
        tickFormatter: (value: number) => `${value}`,
      };
    }

    const magnitude = Math.pow(10, Math.floor(Math.log10(maxRevenue)));
    const maxTick = Math.ceil(maxRevenue / magnitude) * magnitude;
    const step = maxTick / 5; // แบ่งเป็น 5 ช่อง

    return {
      domain: [0, maxTick],
      tickFormatter: (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return `${value}`;
      },
    };
  }, [maxRevenue]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">รายได้</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {period === "monthly" && monthLabel && (
                <span className="block">{monthLabel}</span>
              )}
              รวม{" "}
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
                minimumFractionDigits: 0,
              }).format(totalRevenue)}
            </CardDescription>
          </div>
          <Select
            value={period}
            onValueChange={(value: PeriodType) => setPeriod(value)}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">รายสัปดาห์</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
              <SelectItem value="yearly">รายปี</SelectItem>
              <SelectItem value="last12months">12 เดือนย้อนหลัง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[280px] md:h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] sm:h-[280px] md:h-[300px] w-full"
          >
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                domain={yAxisConfig.domain}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisConfig.tickFormatter}
                width={45}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-chart-1)"
                fill="var(--color-chart-1)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
