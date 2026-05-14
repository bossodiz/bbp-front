import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  errorResponse,
  successResponse,
  ValidationError,
  DatabaseError,
  RateLimitError,
} from "@/lib/error-handler";
import { UpdateSalesDateSchema } from "@/lib/schemas";
import { validateCsrfFromRequest } from "@/lib/csrf";
import {
  checkRateLimit,
  getClientIp,
  rateLimitConfigs,
} from "@/lib/rate-limit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`sales:put:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    validateCsrfFromRequest(request);
    const { id } = await params;
    const saleId = parseInt(id);

    if (isNaN(saleId)) {
      throw new ValidationError("รหัสรายการขายไม่ถูกต้อง");
    }

    const body = await request.json();
    const validated = UpdateSalesDateSchema.parse(body);
    const parsedDate = new Date(validated.saleDate);

    const { data, error } = await supabaseAdmin
      .from("sales")
      .update({ created_at: parsedDate.toISOString() })
      .eq("id", saleId)
      .select("id, created_at")
      .single();

    if (error) throw new DatabaseError(error.message);

    return successResponse({
      id: data.id,
      createdAt: data.created_at,
    });
  } catch (error) {
    return errorResponse(error, "sales_update_timestamp", "ไม่สามารถแก้ไขวันที่และเวลาได้");
  }
}
