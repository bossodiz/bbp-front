import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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
    const { data: salesToday, error: salesTodayError } = await supabaseAdmin
      .from("sales")
      .select("total_revenue:total_amount, deposit_used")
      .gte("created_at", startTodayUtc)
      .lt("created_at", startTomorrowUtc);

    if (salesTodayError) throw salesTodayError;

    const revenueToday = (salesToday ?? []).reduce(
      (sum, row) =>
        sum + Number(row.total_revenue || 0) + Number(row.deposit_used || 0),
      0,
    );

    // 2. รายได้เดือนนี้
    const { data: salesMonthly, error: salesMonthlyError } = await supabaseAdmin
      .from("sales")
      .select("total_revenue:total_amount, deposit_used")
      .gte("created_at", firstDayOfMonth.toISOString())
      .lt("created_at", startTomorrowUtc);

    if (salesMonthlyError) throw salesMonthlyError;

    const revenueMonthly = (salesMonthly ?? []).reduce(
      (sum, sale) =>
        sum + Number(sale.total_revenue || 0) + Number(sale.deposit_used || 0),
      0,
    );

    // 3. สัตว์เข้ารับบริการวันนี้ (แยกหมา/แมว)
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

    type PetType = "DOG" | "CAT";

    interface Pet {
      id: number;
      type: PetType;
    }

    const { dogsToday, catsToday } = salesTodayItems
      .flatMap((sale: any) => sale.sale_items.map((i: any) => i.pets))
      .filter(Boolean)
      .reduce(
        (acc, pet: Pet) => {
          if (!acc.seen.has(pet.id)) {
            acc.seen.add(pet.id);
            if (pet.type === "DOG") acc.dogsToday++;
            if (pet.type === "CAT") acc.catsToday++;
          }
          return acc;
        },
        { dogsToday: 0, catsToday: 0, seen: new Set<number>() },
      );

    // 4. นัดหมายวันนี้ (ทุก status)
    const todayDateStr = new Date().toLocaleDateString("sv-SE");
    const { data: bookingsTodayData, error: bookingsTodayError } =
      await supabaseAdmin
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
