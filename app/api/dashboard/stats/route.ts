import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sumSaleRevenueBreakdowns, toNumber } from "@/lib/dashboard-revenue";
import { toUtcIsoFromBangkokLocal } from "@/lib/utils";

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

function formatDateYmd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// GET /api/dashboard/stats
export async function GET(_request: NextRequest) {
  try {
    const { year, month, day } = getBangkokDateParts();

    const startTodayUtc = toUtcIsoFromBangkokLocal(year, month, day, 0, 0, 0);
    const startTomorrowUtc = toUtcIsoFromBangkokLocal(
      year,
      month,
      day + 1,
      0,
      0,
      0,
    );
    const startMonthUtc = toUtcIsoFromBangkokLocal(year, month, 1, 0, 0, 0);
    const todayDateYmd = formatDateYmd(year, month, day);

    const { data: salesToday, error: salesTodayError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        total_amount,
        deposit_used,
        sale_type,
        sale_items (
          item_type,
          quantity,
          unit_price,
          final_price
        )
      `,
      )
      .gte("created_at", startTodayUtc)
      .lt("created_at", startTomorrowUtc);
    if (salesTodayError) throw salesTodayError;

    const { data: salesMonthly, error: salesMonthlyError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        total_amount,
        deposit_used,
        sale_type,
        sale_items (
          item_type,
          quantity,
          unit_price,
          final_price
        )
      `,
      )
      .gte("created_at", startMonthUtc)
      .lt("created_at", startTomorrowUtc);
    if (salesMonthlyError) throw salesMonthlyError;

    const revenueTodayBreakdown = sumSaleRevenueBreakdowns(salesToday || []);
    const revenueMonthlyBreakdown = sumSaleRevenueBreakdowns(salesMonthly || []);

    const revenueToday = revenueTodayBreakdown.total;
    const revenueTodayService = revenueTodayBreakdown.service;
    const revenueTodayHotel = revenueTodayBreakdown.hotel;
    const revenueTodayProduct = revenueTodayBreakdown.product;

    const revenueMonthly = revenueMonthlyBreakdown.total;
    const revenueMonthlyService = revenueMonthlyBreakdown.service;
    const revenueMonthlyHotel = revenueMonthlyBreakdown.hotel;
    const revenueMonthlyProduct = revenueMonthlyBreakdown.product;

    const { data: salesTodayItems, error: salesTodayItemsError } =
      await supabaseAdmin
        .from("sales")
        .select(
          `
          id,
          sale_items (
            pet_id,
            pets (id, type)
          )
        `,
        )
        .gte("created_at", startTodayUtc)
        .lt("created_at", startTomorrowUtc);
    if (salesTodayItemsError) throw salesTodayItemsError;

    const uniquePets = new Map<number, "DOG" | "CAT">();
    for (const sale of salesTodayItems || []) {
      for (const item of sale.sale_items || []) {
        const pet = Array.isArray(item?.pets) ? item.pets[0] : item?.pets;
        const petId = pet?.id;
        const petType = pet?.type;
        if (!petId || (petType !== "DOG" && petType !== "CAT")) continue;
        if (!uniquePets.has(petId)) uniquePets.set(petId, petType);
      }
    }

    const dogsToday = Array.from(uniquePets.values()).filter(
      (type) => type === "DOG",
    ).length;
    const catsToday = Array.from(uniquePets.values()).filter(
      (type) => type === "CAT",
    ).length;

    const { data: bookingsTodayData, error: bookingsTodayError } =
      await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("booking_date", todayDateYmd);
    if (bookingsTodayError) throw bookingsTodayError;

    const bookingsToday = bookingsTodayData?.length || 0;

    const { data: productsData, error: productsError } = await supabaseAdmin
      .from("products")
      .select("stock_quantity, min_stock, active")
      .eq("active", true);
    if (productsError) throw productsError;

    const lowStockCount = (productsData || []).filter((product: any) => {
      const stock = toNumber(product.stock_quantity);
      const minStock = toNumber(product.min_stock);
      return minStock > 0 && stock <= minStock;
    }).length;

    return NextResponse.json({
      revenueToday,
      revenueTodayService,
      revenueTodayHotel,
      revenueTodayProduct,
      revenueMonthly,
      revenueMonthlyService,
      revenueMonthlyHotel,
      revenueMonthlyProduct,
      catsToday,
      dogsToday,
      bookingsToday,
      lowStockCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
