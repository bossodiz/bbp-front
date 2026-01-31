"use client";

import { useState, useMemo } from "react";
import { Dog, Cat, Loader2 } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { usePetServiceChart } from "@/lib/hooks/use-pet-service-chart";

const chartConfig = {
  dogs: {
    label: "หมา",
    color: "oklch(0.7 0.14 55)",
  },
  cats: {
    label: "แมว",
    color: "oklch(0.6 0.15 280)",
  },
} satisfies ChartConfig;

type PeriodType = "weekly" | "monthly" | "yearly" | "last12months";

export function PetServiceChart() {
  const today = new Date();
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const { data, loading } = usePetServiceChart(period);

  const chartData = useMemo(() => {
    const sales = data?.sales || [];
    const bkkNow = new Date();
    bkkNow.setHours(0, 0, 0, 0);
    if (period === "weekly") {
      const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
      const data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(bkkNow);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: days[date.getDay()],
          dogs: 0,
          cats: 0,
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
          sale.items.forEach((item) => {
            if (item.petType === "DOG") {
              data[matchingIndex].dogs++;
            } else if (item.petType === "CAT") {
              data[matchingIndex].cats++;
            }
          });
        }
      });

      return data;
    } else if (period === "monthly") {
      // รายวัน - แสดงทั้งเดือน (วันที่ 1 ถึงวันสุดท้าย)
      const firstDay = new Date(bkkNow.getFullYear(), bkkNow.getMonth(), 1);
      const lastDay = new Date(bkkNow.getFullYear(), bkkNow.getMonth() + 1, 0);
      const daysInMonth = lastDay.getDate();

      const data = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(firstDay);
        date.setDate(i + 1);
        return {
          date: `${date.getDate()}`,
          dogs: 0,
          cats: 0,
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
          sale.items.forEach((item) => {
            if (item.petType === "DOG") {
              data[matchingIndex].dogs++;
            } else if (item.petType === "CAT") {
              data[matchingIndex].cats++;
            }
          });
        }
      });

      return data;
    } else if (period === "yearly") {
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
          bkkNow.getFullYear(),
          i, // เดือน 0-11 (มกราคม-ธันวาคม)
          1,
        );

        return {
          date: months[targetDate.getMonth()],
          dogs: 0,
          cats: 0,
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
          sale.items.forEach((item) => {
            if (item.petType === "DOG") {
              data[matchingIndex].dogs++;
            } else if (item.petType === "CAT") {
              data[matchingIndex].cats++;
            }
          });
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
          bkkNow.getFullYear(),
          bkkNow.getMonth() - monthsAgo,
          1,
        );

        return {
          date: months[targetDate.getMonth()],
          dogs: 0,
          cats: 0,
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
          sale.items.forEach((item) => {
            if (item.petType === "DOG") {
              data[matchingIndex].dogs++;
            } else if (item.petType === "CAT") {
              data[matchingIndex].cats++;
            }
          });
        }
      });

      return data;
    }
  }, [data?.sales, period, today]);

  const totalDogs = chartData.reduce((sum, item) => sum + item.dogs, 0);
  const totalCats = chartData.reduce((sum, item) => sum + item.cats, 0);

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
    return `${months[today.getMonth()]} ${today.getFullYear()}`;
  }, [period, today]);

  // คำนวณ max value และ tick formatter สำหรับ YAxis
  const maxCount = Math.max(
    ...chartData.map((item) => Math.max(item.dogs, item.cats)),
    0,
  );
  const yAxisConfig = useMemo(() => {
    if (maxCount === 0) {
      return { domain: [0, 5], tickFormatter: (value: number) => `${value}` };
    }

    const maxTick = Math.max(5, Math.ceil(maxCount * 1.1)); // เพิ่ม 10% และขั้นต่ำ 5
    const step = Math.max(1, Math.floor(maxTick / 5)); // แบ่งเป็น 5 ช่อง แต่ขั้นต่ำ 1

    return {
      domain: [0, maxTick],
      tickFormatter: (value: number) => `${Math.round(value)}`, // แสดงเป็นจำนวนเต็ม
    };
  }, [maxCount]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              สัตว์เข้ารับบริการ
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {period === "monthly" && monthLabel && (
                <span className="block">{monthLabel}</span>
              )}
              รวม {totalDogs + totalCats} ตัว
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
          <>
            <ChartContainer
              config={chartConfig}
              className="h-[200px] sm:h-[280px] md:h-[300px] w-full"
            >
              <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
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
                  width={35}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar
                  dataKey="dogs"
                  fill="var(--color-dogs)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cats"
                  fill="var(--color-cats)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <Dog className="h-3 w-3 sm:h-4 sm:w-4 text-dog" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  หมา:{" "}
                  <span className="font-medium text-foreground">
                    {totalDogs}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Cat className="h-3 w-3 sm:h-4 sm:w-4 text-cat" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  แมว:{" "}
                  <span className="font-medium text-foreground">
                    {totalCats}
                  </span>
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
