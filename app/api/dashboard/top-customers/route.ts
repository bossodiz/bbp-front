import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dashboard/top-customers - ดึงรายการลูกค้าประจำ
export async function GET(request: NextRequest) {
  try {
    // ดึงยอดขายของลูกค้าทั้งหมด (30 วันล่าสุด)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29); // 30 วัน

    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("customer_id, customer_name, customer_phone, total_amount")
      .gte("created_at", startDate.toISOString())
      .not("customer_id", "is", null);

    if (salesError) throw salesError;

    // จัดกลุ่มตามลูกค้า
    const customerMap = new Map<
      number,
      {
        customerId: number;
        customerName: string;
        customerPhone: string;
        totalSpent: number;
        visitCount: number;
      }
    >();

    salesData.forEach((sale) => {
      const existing = customerMap.get(sale.customer_id);
      if (existing) {
        existing.totalSpent += parseFloat(sale.total_amount);
        existing.visitCount += 1;
      } else {
        customerMap.set(sale.customer_id, {
          customerId: sale.customer_id,
          customerName: sale.customer_name,
          customerPhone: sale.customer_phone,
          totalSpent: parseFloat(sale.total_amount),
          visitCount: 1,
        });
      }
    });

    // เรียงตามยอดใช้จ่าย และเอา top 5
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return NextResponse.json(topCustomers);
  } catch (error) {
    console.error("Error fetching top customers:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลลูกค้าประจำได้" },
      { status: 500 },
    );
  }
}
