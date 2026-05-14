import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  errorResponse,
  successResponse,
  DatabaseError,
  RateLimitError,
} from "@/lib/error-handler";
import { CreateSalesSchema } from "@/lib/schemas";
import { validateCsrfFromRequest } from "@/lib/csrf";
import {
  checkRateLimit,
  getClientIp,
  rateLimitConfigs,
} from "@/lib/rate-limit";
import {
  PaginationParamsSchema,
  getOffset,
  createPaginationMeta,
  createPaginatedResponse,
} from "@/lib/pagination";
import { RawSale, RawSaleItem } from "@/lib/api-types";

// POST /api/sales - บันทึกข้อมูลการขาย (atomic via RPC)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`sales:post:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    validateCsrfFromRequest(request);
    const body = await request.json();
    const validated = CreateSalesSchema.parse(body);

    const { data: saleId, error } = await supabaseAdmin.rpc(
      "create_sale_with_items",
      {
        p_booking_id: validated.bookingId ?? null,
        p_customer_id: validated.customerId ?? null,
        p_subtotal: validated.subtotal,
        p_discount_amount: validated.discountAmount,
        p_promotion_id: validated.promotionId ?? null,
        p_custom_discount: validated.customDiscount,
        p_deposit_used: validated.depositUsed,
        p_total_amount: validated.totalAmount,
        p_payment_method: validated.paymentMethod,
        p_cash_received: validated.paymentMethod === "CASH" ? validated.cashReceived : null,
        p_change: validated.paymentMethod === "CASH" ? validated.change : null,
        p_items: validated.items,
        p_sale_type: validated.saleType,
        p_hotel_booking_id: validated.hotelBookingId ?? null,
      },
    );

    if (error) throw new DatabaseError(error.message);

    if (validated.saleDate && saleId) {
      await supabaseAdmin
        .from("sales")
        .update({ created_at: new Date(validated.saleDate).toISOString() })
        .eq("id", saleId);
    }

    return successResponse({ saleId }, 201);
  } catch (error) {
    return errorResponse(error, "sales_create", "ไม่สามารถบันทึกข้อมูลการขายได้");
  }
}

// GET /api/sales - ดึงข้อมูลการขาย (with pagination)
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`sales:get:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    const { searchParams } = new URL(request.url);
    const paginationParams = PaginationParamsSchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerId = searchParams.get("customerId");

    const offset = getOffset(paginationParams.page, paginationParams.limit);

    let countQuery = supabaseAdmin.from("sales").select("id", { count: "exact", head: true });
    let dataQuery = supabaseAdmin
      .from("sales")
      .select(
        `
        *,
        customers(id, name, phone),
        sale_items(
          *,
          pets(id, name, type)
        )
      `,
      )
      .order("created_at", { ascending: false })
      .order("id", { foreignTable: "sale_items", ascending: true })
      .range(offset, offset + paginationParams.limit - 1);

    if (startDate) {
      countQuery = countQuery.gte("created_at", startDate);
      dataQuery = dataQuery.gte("created_at", startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte("created_at", endDate);
      dataQuery = dataQuery.lte("created_at", endDate);
    }
    if (customerId) {
      countQuery = countQuery.eq("customer_id", customerId);
      dataQuery = dataQuery.eq("customer_id", customerId);
    }

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (error) throw new DatabaseError(error.message);

    const sales = (data as RawSale[] || []).map((sale) => ({
      id: sale.id,
      bookingId: sale.booking_id,
      customerId: sale.customer_id,
      customerName: sale.customers?.name || "ไม่ระบุลูกค้า",
      customerPhone: sale.customers?.phone || null,
      saleType: sale.sale_type || "SERVICE",
      hotelBookingId: sale.hotel_booking_id,
      subtotal: parseFloat(String(sale.subtotal || 0)),
      discountAmount: parseFloat(String(sale.discount_amount || 0)),
      promotionId: sale.promotion_id,
      customDiscount: parseFloat(String(sale.custom_discount || 0)),
      depositUsed: parseFloat(String(sale.deposit_used || 0)),
      totalAmount: parseFloat(String(sale.total_amount || 0)),
      paymentMethod: sale.payment_method || "CASH",
      cashReceived: sale.cash_received ? parseFloat(String(sale.cash_received)) : null,
      change: sale.change ? parseFloat(String(sale.change)) : null,
      createdAt: sale.created_at,
      items: (sale.sale_items as RawSaleItem[] || []).map((item) => ({
        id: item.id,
        serviceId: item.service_id,
        serviceName: item.service_name || "ไม่ระบุบริการ",
        petId: item.pet_id,
        petName: item.pets?.name || null,
        petType: item.pets?.type || null,
        itemType: item.item_type || "SERVICE",
        quantity: item.quantity || 1,
        unitPrice: parseFloat(String(item.unit_price || 0)),
        originalPrice: parseFloat(String(item.original_price || 0)),
        finalPrice: parseFloat(String(item.final_price || 0)),
        isPriceModified: item.is_price_modified || false,
      })),
    }));

    const pagination = createPaginationMeta(
      paginationParams.page,
      paginationParams.limit,
      count || 0,
    );

    return successResponse(createPaginatedResponse(sales, pagination));
  } catch (error) {
    return errorResponse(error, "sales_fetch", "ไม่สามารถดึงข้อมูลการขายได้");
  }
}
