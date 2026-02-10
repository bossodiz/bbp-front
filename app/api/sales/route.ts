import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/sales - บันทึกข้อมูลการขาย
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
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการบริการ" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // บันทึกข้อมูลการขาย
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        booking_id: bookingId || null,
        customer_id: customerId || null,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        subtotal,
        discount_amount: discountAmount || 0,
        promotion_id: promotionId || null,
        custom_discount: customDiscount || 0,
        deposit_used: depositUsed || 0,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "CASH" ? cashReceived : null,
        change: paymentMethod === "CASH" ? change : null,
        created_at: now,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // บันทึกรายการบริการในการขาย
    const saleItemsData = items.map((item: any) => ({
      sale_id: sale.id,
      service_id: item.serviceId,
      service_name: item.serviceName,
      pet_id: item.petId || null,
      pet_name: item.petName || null,
      pet_type: item.petType || null,
      original_price: item.originalPrice,
      final_price: item.finalPrice,
      is_price_modified: item.isPriceModified || false,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItemsData);

    if (itemsError) throw itemsError;

    // ถ้ามี bookingId ให้อัพเดท status เป็น COMPLETED
    if (bookingId) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "COMPLETED",
          updated_at: now,
        })
        .eq("id", bookingId);

      if (updateError) {
        // ไม่ throw error เพราะการขายสำเร็จแล้ว
      }
    }

    return NextResponse.json({
      success: true,
      saleId: sale.id,
      message: "บันทึกข้อมูลการขายสำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลการขายได้" },
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

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        sale_items(*)
      `,
      )
      .order("created_at", { ascending: false });

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

    // แปลง snake_case เป็น camelCase
    const sales = (data || []).map((sale: any) => ({
      id: sale.id,
      bookingId: sale.booking_id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || "ไม่ระบุ",
      customerPhone: sale.customer_phone,
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
        petName: item.pet_name,
        petType: item.pet_type,
        originalPrice: parseFloat(item.original_price || 0),
        finalPrice: parseFloat(item.final_price || 0),
        isPriceModified: item.is_price_modified || false,
      })),
    }));

    return NextResponse.json({ data: sales });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลการขายได้" },
      { status: 500 },
    );
  }
}
