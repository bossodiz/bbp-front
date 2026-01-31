import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dashboard/revenue-chart - ดึงข้อมูลกราฟรายได้
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

    // ดึงข้อมูล sales
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("id, total_amount, created_at")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    const sales = salesData.map((sale) => ({
      id: sale.id,
      totalAmount: parseFloat(sale.total_amount),
      createdAt: sale.created_at,
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
    console.error("Error fetching revenue chart data:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกราฟรายได้ได้" },
      { status: 500 },
    );
  }
}
