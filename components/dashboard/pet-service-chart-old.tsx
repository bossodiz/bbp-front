"use client";

import { useState } from "react";
import { Dog, Cat } from "lucide-react";
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

// Mock data - จะเปลี่ยนเป็นข้อมูลจริงจาก database ภายหลัง
const weeklyData = [
  { date: "จ.", dogs: 5, cats: 2 },
  { date: "อ.", dogs: 7, cats: 3 },
  { date: "พ.", dogs: 6, cats: 2 },
  { date: "พฤ.", dogs: 8, cats: 4 },
  { date: "ศ.", dogs: 10, cats: 5 },
  { date: "ส.", dogs: 12, cats: 6 },
  { date: "อา.", dogs: 8, cats: 3 },
];

const monthlyData = [
  { date: "สัปดาห์ 1", dogs: 35, cats: 14 },
  { date: "สัปดาห์ 2", dogs: 42, cats: 18 },
  { date: "สัปดาห์ 3", dogs: 48, cats: 22 },
  { date: "สัปดาห์ 4", dogs: 38, cats: 16 },
];

const yearlyData = [
  { date: "ม.ค.", dogs: 145, cats: 58 },
  { date: "ก.พ.", dogs: 152, cats: 62 },
  { date: "มี.ค.", dogs: 168, cats: 71 },
  { date: "เม.ย.", dogs: 175, cats: 75 },
  { date: "พ.ค.", dogs: 162, cats: 68 },
  { date: "มิ.ย.", dogs: 180, cats: 78 },
  { date: "ก.ค.", dogs: 195, cats: 85 },
  { date: "ส.ค.", dogs: 188, cats: 82 },
  { date: "ก.ย.", dogs: 198, cats: 88 },
  { date: "ต.ค.", dogs: 205, cats: 92 },
  { date: "พ.ย.", dogs: 195, cats: 86 },
  { date: "ธ.ค.", dogs: 220, cats: 98 },
];

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

type PeriodType = "weekly" | "monthly" | "yearly";

export function PetServiceChart() {
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const chartData = period === "weekly" ? weeklyData : period === "monthly" ? monthlyData : yearlyData;

  const totalDogs = chartData.reduce((sum, item) => sum + item.dogs, 0);
  const totalCats = chartData.reduce((sum, item) => sum + item.cats, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>สัตว์เข้ารับบริการ</CardTitle>
            <CardDescription>
              รวม {totalDogs + totalCats} ตัว
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
          <BarChart
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
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="dogs"
              name="หมา"
              fill="oklch(0.7 0.14 55)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="cats"
              name="แมว"
              fill="oklch(0.6 0.15 280)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "oklch(0.7 0.14 55)" }} />
            <Dog className="h-4 w-4" style={{ color: "oklch(0.7 0.14 55)" }} />
            <span>หมา {totalDogs} ตัว</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "oklch(0.6 0.15 280)" }} />
            <Cat className="h-4 w-4" style={{ color: "oklch(0.6 0.15 280)" }} />
            <span>แมว {totalCats} ตัว</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
