import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { toUtcIsoFromBangkokLocal } from "@/lib/utils";

// GET /api/dashboard/stats - ดึงสถิติ dashboard
export async function GET(request: NextRequest) {
  try {
    const nowBkk = new Date();

    // เอาวันตาม "เครื่องผู้ใช้" (ไทย) แล้วสร้าง boundary เป็น UTC
    const y = nowBkk.getFullYear();
    const m = nowBkk.getMonth() + 1;
    const d = nowBkk.getDate();

    const startTodayUtc = toUtcIsoFromBangkokLocal(y, m, d, 0, 0, 0);
    const startTomorrowUtc = toUtcIsoFromBangkokLocal(y, m, d + 1, 0, 0, 0);

    // วันแรกของเดือนนี้
    const firstDayOfMonth = new Date(
      nowBkk.getFullYear(),
      nowBkk.getMonth(),
      1,
    );

    // 1. รายได้วันนี้
    const { data: salesToday, error: salesTodayError } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", startTodayUtc)
      .lt("created_at", startTomorrowUtc);

    if (salesTodayError) throw salesTodayError;

    const revenueToday = salesToday.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount),
      0,
    );

    // 2. รายได้เดือนนี้
    const { data: salesMonthly, error: salesMonthlyError } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", firstDayOfMonth.toISOString())
      .lt("created_at", startTomorrowUtc);

    if (salesMonthlyError) throw salesMonthlyError;

    const revenueMonthly = salesMonthly.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount),
      0,
    );

    // 3. สัตว์เข้ารับบริการวันนี้ (แยกหมา/แมว)
    const { data: salesTodayItems, error: salesTodayItemsError } =
      await supabase
        .from("sales")
        .select(
          `
        id,
        sale_items (
          pet_type
        )
      `,
        )
        .gte("created_at", startTodayUtc)
        .lt("created_at", startTomorrowUtc);

    if (salesTodayItemsError) throw salesTodayItemsError;

    let dogsToday = 0;
    let catsToday = 0;

    salesTodayItems.forEach((sale: any) => {
      sale.sale_items.forEach((item: any) => {
        if (item.pet_type === "DOG") {
          dogsToday++;
        } else if (item.pet_type === "CAT") {
          catsToday++;
        }
      });
    });

    // 4. นัดหมายวันนี้ (ทุก status)
    const todayDateStr = new Date().toLocaleDateString("sv-SE");
    const { data: bookingsTodayData, error: bookingsTodayError } =
      await supabase
        .from("bookings")
        .select("id")
        .eq("booking_date", todayDateStr);

    if (bookingsTodayError) throw bookingsTodayError;

    const bookingsToday = bookingsTodayData?.length || 0;

    return NextResponse.json({
      revenueToday,
      revenueMonthly,
      catsToday,
      dogsToday,
      bookingsToday,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลสถิติได้" },
      { status: 500 },
    );
  }
}
