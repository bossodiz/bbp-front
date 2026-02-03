import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dashboard/top-customers - ดึงรายการลูกค้าประจำ
export async function GET(request: NextRequest) {
  try {
    // รับ query parameter 'type' (frequent_visits หรือ high_revenue)
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "frequent_visits";

    // กำหนด order by clause ตาม type
    const orderBy = type === "frequent_visits" ? "visit_count" : "total_spent";

    // ใช้ Database Function เพื่อ aggregate ที่ database แทนการดึงมาทั้งหมด
    const { data, error } = await supabase.rpc("get_top_customers", {
      sort_by: orderBy,
      result_limit: 5,
    });

    if (error) throw error;

    // แปลง field names ให้ตรงกับ interface ที่ใช้
    const topCustomers = data.map((customer: any) => ({
      customerId: customer.customer_id,
      customerName: customer.customer_name,
      customerPhone: customer.customer_phone,
      totalSpent: parseFloat(customer.total_spent),
      visitCount: customer.visit_count,
    }));

    return NextResponse.json(topCustomers);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลลูกค้าประจำได้" },
      { status: 500 },
    );
  }
}
