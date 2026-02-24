import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSaleRevenueBreakdown } from "@/lib/dashboard-revenue";
import { toUtcIsoFromBangkokLocal } from "@/lib/utils";

type Period = "weekly" | "monthly" | "yearly" | "last12months";

type RevenuePoint = {
  key: string;
  date: string;
  revenue: number;
  service: number;
  hotel: number;
  product: number;
};

const weekdayFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
});

const monthFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  month: "short",
});

const bangkokYmdFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBangkokDateParts() {
  const now = new Date();
  const bkkNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return {
    year: bkkNow.getFullYear(),
    month: bkkNow.getMonth() + 1,
    day: bkkNow.getDate(),
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getBangkokPartsFromDate(date: Date) {
  const parts = bangkokYmdFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value || 0);
  const month = Number(
    parts.find((part) => part.type === "month")?.value || 0,
  );
  const day = Number(parts.find((part) => part.type === "day")?.value || 0);

  return { year, month, day };
}

function getBangkokDayKey(date: Date) {
  const { year, month, day } = getBangkokPartsFromDate(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getBangkokMonthKey(date: Date) {
  const { year, month } = getBangkokPartsFromDate(date);
  return `${year}-${pad2(month)}`;
}

function createPoint(key: string, date: string): RevenuePoint {
  return {
    key,
    date,
    revenue: 0,
    service: 0,
    hotel: 0,
    product: 0,
  };
}

function getMonthLabel(month: number) {
  return monthFormatter.format(new Date(Date.UTC(2000, month - 1, 1, 12)));
}

function normalizePeriod(value: string | null): Period {
  if (
    value === "weekly" ||
    value === "monthly" ||
    value === "yearly" ||
    value === "last12months"
  ) {
    return value;
  }

  return "weekly";
}

// GET /api/dashboard/revenue-chart
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = normalizePeriod(searchParams.get("period"));

    const { year, month, day } = getBangkokDateParts();
    const endUtc = toUtcIsoFromBangkokLocal(
      year,
      month,
      day + 1,
      0,
      0,
      0,
    );

    let startUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
    let points: RevenuePoint[] = [];
    let getPointKey = (createdAt: string) => getBangkokDayKey(new Date(createdAt));

    switch (period) {
      case "weekly":
        startUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
        points = Array.from({ length: 7 }, (_, index) => {
          const dayOffset = day - (6 - index);
          const bucketUtc = toUtcIsoFromBangkokLocal(
            year,
            month,
            dayOffset,
            0,
            0,
            0,
          );
          const bucketDate = new Date(bucketUtc);
          return createPoint(
            getBangkokDayKey(bucketDate),
            weekdayFormatter.format(bucketDate),
          );
        });
        getPointKey = (createdAt) => getBangkokDayKey(new Date(createdAt));
        break;
      case "monthly":
        startUtc = toUtcIsoFromBangkokLocal(year, month, 1, 0, 0, 0);
        {
          const daysInMonth = new Date(year, month, 0).getDate();
          points = Array.from({ length: daysInMonth }, (_, index) => {
            const currentDay = index + 1;
            return createPoint(
              `${year}-${pad2(month)}-${pad2(currentDay)}`,
              String(currentDay),
            );
          });
        }
        getPointKey = (createdAt) => getBangkokDayKey(new Date(createdAt));
        break;
      case "yearly":
        startUtc = toUtcIsoFromBangkokLocal(year, 1, 1, 0, 0, 0);
        points = Array.from({ length: 12 }, (_, index) => {
          const currentMonth = index + 1;
          return createPoint(
            `${year}-${pad2(currentMonth)}`,
            getMonthLabel(currentMonth),
          );
        });
        getPointKey = (createdAt) => getBangkokMonthKey(new Date(createdAt));
        break;
      case "last12months":
        {
          const firstMonthDate = new Date(Date.UTC(year, month - 1 - 11, 1, 12));
          const startYear = firstMonthDate.getUTCFullYear();
          const startMonth = firstMonthDate.getUTCMonth() + 1;
          startUtc = toUtcIsoFromBangkokLocal(
            startYear,
            startMonth,
            1,
            0,
            0,
            0,
          );

          points = Array.from({ length: 12 }, (_, index) => {
            const currentMonthDate = new Date(firstMonthDate);
            currentMonthDate.setUTCMonth(firstMonthDate.getUTCMonth() + index);

            const currentYear = currentMonthDate.getUTCFullYear();
            const currentMonth = currentMonthDate.getUTCMonth() + 1;
            const monthLabel = getMonthLabel(currentMonth);

            return createPoint(
              `${currentYear}-${pad2(currentMonth)}`,
              `${monthLabel} ${String(currentYear).slice(-2)}`,
            );
          });
        }
        getPointKey = (createdAt) => getBangkokMonthKey(new Date(createdAt));
        break;
    }

    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        total_amount,
        deposit_used,
        sale_type,
        created_at,
        sale_items (
          item_type,
          quantity,
          unit_price,
          final_price
        )
      `,
      )
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    const pointMap = new Map(points.map((point) => [point.key, point]));
    for (const sale of salesData || []) {
      const pointKey = getPointKey(sale.created_at);
      const point = pointMap.get(pointKey);
      if (!point) continue;

      const breakdown = getSaleRevenueBreakdown(sale);
      point.revenue += breakdown.total;
      point.service += breakdown.service;
      point.hotel += breakdown.hotel;
      point.product += breakdown.product;
    }

    return NextResponse.json({
      points,
      period,
      dateRange: {
        start: startUtc,
        end: endUtc,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch revenue chart data" },
      { status: 500 },
    );
  }
}
