import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/dashboard/pet-service-chart - ดึงข้อมูลกราฟสัตว์เข้ารับบริการ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "weekly"; // weekly, monthly, yearly

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // tomorrow

    switch (period) {
      case "weekly":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // 7 วัน
        break;
      case "monthly":
        // เริ่มจากวันที่ 1 ของเดือนปัจจุบัน
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "yearly":
        // เริ่มจากวันที่ 1 มกราคมของปีปัจจุบัน
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case "last12months":
        // 12 เดือนย้อนหลัง
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
    }

    // ดึงข้อมูล sales พร้อม sale_items
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        created_at,
        sale_items (
          pet_type
        )
      `,
      )
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    const sales = salesData.map((sale: any) => ({
      id: sale.id,
      createdAt: sale.created_at,
      items: sale.sale_items.map((item: any) => ({
        petType: item.pet_type,
      })),
    }));

    return NextResponse.json({
      sales,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกราฟสัตว์เข้ารับบริการได้" },
      { status: 500 },
    );
  }
}
