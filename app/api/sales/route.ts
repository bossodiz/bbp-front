import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/sales - บันทึกข้อมูลการขาย (atomic via RPC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingId,
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discountAmount,
      promotionId,
      customDiscount,
      depositUsed,
      totalAmount,
      paymentMethod,
      cashReceived,
      change,
      saleType,
      hotelBookingId,
      saleDate,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการบริการ" },
        { status: 400 },
      );
    }

    const { data: saleId, error } = await supabaseAdmin.rpc(
      "create_sale_with_items",
      {
        p_booking_id: bookingId ?? null,
        p_customer_id: customerId ?? null,
        p_subtotal: subtotal ?? 0,
        p_discount_amount: discountAmount ?? 0,
        p_promotion_id: promotionId ?? null,
        p_custom_discount: customDiscount ?? 0,
        p_deposit_used: depositUsed ?? 0,
        p_total_amount: totalAmount ?? 0,
        p_payment_method: paymentMethod,
        p_cash_received: paymentMethod === "CASH" ? cashReceived : null,
        p_change: paymentMethod === "CASH" ? change : null,
        p_items: items,
        p_sale_type: saleType || "SERVICE",
        p_hotel_booking_id: hotelBookingId ?? null,
      },
    );

    if (error) throw error;

    // Override created_at if saleDate provided
    // DB convention: created_at stores Bangkok local time in UTC field (UTC+7 offset = 0)
    // Browser sends ISO UTC, so we add 7 hours to convert UTC -> Bangkok local stored as UTC
    if (saleDate && saleId) {
      const utcDate = new Date(saleDate);
      const bangkokAsUtc = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
      await supabaseAdmin
        .from("sales")
        .update({ created_at: bangkokAsUtc.toISOString() })
        .eq("id", saleId);
    }

    return NextResponse.json({
      success: true,
      saleId,
      message: "บันทึกข้อมูลการขายสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      {
        error: error?.message || "ไม่สามารถบันทึกข้อมูลการขายได้",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/sales - ดึงข้อมูลการขาย
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerId = searchParams.get("customerId");

    let query = supabaseAdmin
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
      .order("id", { foreignTable: "sale_items", ascending: true });

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const sales = (data || []).map((sale: any) => ({
      id: sale.id,
      bookingId: sale.booking_id,
      customerId: sale.customer_id,
      customerName: sale.customers?.name || "ไม่ระบุลูกค้า",
      customerPhone: sale.customers?.phone || null,
      saleType: sale.sale_type || "SERVICE",
      hotelBookingId: sale.hotel_booking_id,
      subtotal: parseFloat(sale.subtotal || 0),
      discountAmount: parseFloat(sale.discount_amount || 0),
      promotionId: sale.promotion_id,
      customDiscount: parseFloat(sale.custom_discount || 0),
      depositUsed: parseFloat(sale.deposit_used || 0),
      totalAmount: parseFloat(sale.total_amount || 0),
      paymentMethod: sale.payment_method || "CASH",
      cashReceived: sale.cash_received ? parseFloat(sale.cash_received) : null,
      change: sale.change ? parseFloat(sale.change) : null,
      createdAt: sale.created_at,
      items: (sale.sale_items || []).map((item: any) => ({
        id: item.id,
        serviceId: item.service_id,
        serviceName: item.service_name || "ไม่ระบุบริการ",
        petId: item.pet_id,
        petName: item.pets?.name || null,
        petType: item.pets?.type || null,
        itemType: item.item_type || "SERVICE",
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unit_price || 0),
        originalPrice: parseFloat(item.original_price || 0),
        finalPrice: parseFloat(item.final_price || 0),
        isPriceModified: item.is_price_modified || false,
      })),
    }));

    return NextResponse.json({ data: sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      {
        error: "ไม่สามารถดึงข้อมูลการขายได้",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
