import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, successResponse, DatabaseError } from "@/lib/error-handler";
import { RawTopCustomer } from "@/lib/api-types";

// GET /api/dashboard/top-customers - ดึงรายการลูกค้าประจำ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "frequent_visits";
    const orderBy = type === "frequent_visits" ? "visit_count" : "total_spent";

    const { data, error } = await supabaseAdmin.rpc("get_top_customers", {
      sort_by: orderBy,
      result_limit: 5,
    });

    if (error) throw new DatabaseError(error.message);

    const topCustomers = (data as RawTopCustomer[] || []).map((customer) => ({
      customerId: customer.customer_id,
      customerName: customer.customer_name,
      customerPhone: customer.customer_phone,
      totalSpent: parseFloat(String(customer.total_spent)),
      visitCount: customer.visit_count,
    }));

    return successResponse(topCustomers);
  } catch (error) {
    return errorResponse(error, "dashboard_top_customers_fetch", "ไม่สามารถดึงข้อมูลลูกค้าประจำได้");
  }
}
