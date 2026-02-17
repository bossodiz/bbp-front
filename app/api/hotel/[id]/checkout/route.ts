import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/hotel/[id]/checkout - Checkout โรงแรม
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await request.json();

    const {
      checkOutDate,
      additionalServices,
      discountAmount,
      paymentMethod,
      cashReceived,
      note,
      promotionId,
      customDiscount,
    } = body;

    if (!checkOutDate) {
      return NextResponse.json(
        { data: null, error: "กรุณาระบุวันที่รับกลับ" },
        { status: 400 },
      );
    }

    // Use RPC function for atomic checkout
    const { data, error } = await supabaseAdmin.rpc("checkout_hotel_booking", {
      p_hotel_booking_id: bookingId,
      p_check_out_date: checkOutDate,
      p_additional_services: additionalServices || [],
      p_discount_amount: discountAmount || 0,
      p_payment_method: paymentMethod || "CASH",
      p_cash_received: cashReceived || null,
      p_note: note || null,
      p_promotion_id: promotionId || null,
      p_custom_discount: customDiscount || 0,
    });

    if (error) throw error;

    // Fetch the full booking with relations
    const { data: fullBooking, error: fetchError } = await supabaseAdmin
      .from("hotel_bookings")
      .select(
        `
        *,
        customers (id, name, phone),
        pets (id, name, type, breed, weight)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ data: fullBooking, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
