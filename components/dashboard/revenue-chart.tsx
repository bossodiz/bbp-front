"use client";

import { useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useRevenueChart } from "@/lib/hooks/use-revenue-chart";

const chartConfig = {
  revenue: {
    label: "รายได้รวม",
    color: "var(--color-chart-1)",
  },
  service: {
    label: "บริการ",
    color: "var(--color-chart-1)",
  },
  hotel: {
    label: "โรงแรม",
    color: "var(--color-chart-2)",
  },
  product: {
    label: "สินค้า",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

type PeriodType = "weekly" | "monthly" | "yearly" | "last12months";

export function RevenueChart() {
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const { data, loading } = useRevenueChart(period);

  const chartData = useMemo(() => data?.points || [], [data?.points]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenue, 0),
    [chartData],
  );

  const monthLabel = useMemo(() => {
    if (period !== "monthly") return "";
    const start = data?.dateRange?.start;
    if (!start) return "";

    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      month: "long",
      year: "numeric",
    }).format(new Date(start));
  }, [period, data?.dateRange?.start]);

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
            <SelectTrigger className="w-full sm:w-40">
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
                dataKey="service"
                stackId="1"
                stroke="var(--color-chart-1)"
                fill="var(--color-chart-1)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="hotel"
                stackId="1"
                stroke="var(--color-chart-2)"
                fill="var(--color-chart-2)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="product"
                stackId="1"
                stroke="var(--color-chart-3)"
                fill="var(--color-chart-3)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
