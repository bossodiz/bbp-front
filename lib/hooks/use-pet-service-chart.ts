"use client";

import { useState, useEffect } from "react";

export interface PetServiceChartPoint {
  key: string;
  date: string;
  dogs: number;
  cats: number;
}

interface PetServiceChartData {
  points: PetServiceChartPoint[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface SaleItem {
  petType: string;
}

interface Sale {
  id: number;
  createdAt: string;
  items: SaleItem[];
}

const bangkokDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBangkokDateKey(date: Date): string {
  const parts = bangkokDateFormatter.formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value || "";
  const m = parts.find((p) => p.type === "month")?.value || "";
  const d = parts.find((p) => p.type === "day")?.value || "";
  return `${y}-${m}-${d}`;
}

function getBangkokMonth(date: Date): number {
  return (
    Number(
      bangkokDateFormatter.formatToParts(date).find((p) => p.type === "month")
        ?.value || 0,
    ) - 1
  );
}

function getBangkokYear(date: Date): number {
  return Number(
    bangkokDateFormatter.formatToParts(date).find((p) => p.type === "year")
      ?.value || 0,
  );
}

function processToPoints(
  sales: Sale[],
  period: "weekly" | "monthly" | "yearly" | "last12months",
): PetServiceChartPoint[] {
  const bkkNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );

  const MONTHS = [
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
  const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  if (period === "weekly") {
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(bkkNow);
      date.setDate(date.getDate() - (6 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return { key, date: WEEKDAYS[date.getDay()], dogs: 0, cats: 0 };
    });

    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    sales.forEach((sale) => {
      const bucket = bucketMap.get(getBangkokDateKey(new Date(sale.createdAt)));
      if (bucket)
        sale.items.forEach((item) => {
          if (item.petType === "DOG") bucket.dogs++;
          else if (item.petType === "CAT") bucket.cats++;
        });
    });

    return buckets;
  }

  if (period === "monthly") {
    const daysInMonth = new Date(
      bkkNow.getFullYear(),
      bkkNow.getMonth() + 1,
      0,
    ).getDate();
    const buckets = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const key = `${bkkNow.getFullYear()}-${String(bkkNow.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { key, date: `${d}`, dogs: 0, cats: 0 };
    });

    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    sales.forEach((sale) => {
      const bucket = bucketMap.get(getBangkokDateKey(new Date(sale.createdAt)));
      if (bucket)
        sale.items.forEach((item) => {
          if (item.petType === "DOG") bucket.dogs++;
          else if (item.petType === "CAT") bucket.cats++;
        });
    });

    return buckets;
  }

  if (period === "yearly") {
    const currentYear = bkkNow.getFullYear();
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      key: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
      date: MONTHS[i],
      dogs: 0,
      cats: 0,
      monthIndex: i,
      year: currentYear,
    }));

    sales.forEach((sale) => {
      const d = new Date(sale.createdAt);
      const bucket = buckets.find(
        (b) =>
          b.year === getBangkokYear(d) && b.monthIndex === getBangkokMonth(d),
      );
      if (bucket)
        sale.items.forEach((item) => {
          if (item.petType === "DOG") bucket.dogs++;
          else if (item.petType === "CAT") bucket.cats++;
        });
    });

    return buckets.map(({ key, date, dogs, cats }) => ({
      key,
      date,
      dogs,
      cats,
    }));
  }

  // last12months
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const monthsAgo = 11 - i;
    const target = new Date(
      bkkNow.getFullYear(),
      bkkNow.getMonth() - monthsAgo,
      1,
    );
    return {
      key: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`,
      date: MONTHS[target.getMonth()],
      dogs: 0,
      cats: 0,
      monthIndex: target.getMonth(),
      year: target.getFullYear(),
    };
  });

  sales.forEach((sale) => {
    const d = new Date(sale.createdAt);
    const bucket = buckets.find(
      (b) =>
        b.year === getBangkokYear(d) && b.monthIndex === getBangkokMonth(d),
    );
    if (bucket)
      sale.items.forEach((item) => {
        if (item.petType === "DOG") bucket.dogs++;
        else if (item.petType === "CAT") bucket.cats++;
      });
  });

  return buckets.map(({ key, date, dogs, cats }) => ({
    key,
    date,
    dogs,
    cats,
  }));
}

export function usePetServiceChart(
  period: "weekly" | "monthly" | "yearly" | "last12months",
) {
  const [data, setData] = useState<PetServiceChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { apiRequest } = await import("@/lib/api-client");
        const result = await apiRequest<PetServiceChartData>(
          `/dashboard/pet-service-chart?period=${period}`,
        );
        setData((result.data as PetServiceChartData) || null);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, loading, error };
}
