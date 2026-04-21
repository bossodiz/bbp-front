import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function toNumber(value: any): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mapHotelBooking(booking: any, checkoutSale: any | null) {
  const saleItems = checkoutSale?.sale_items || [];
  const additionalServiceItems = saleItems.filter(
    (item: any) => item.item_type === "SERVICE",
  );

  const totalNights =
    booking.check_out_date && booking.check_in_date
      ? Math.ceil(
          (new Date(booking.check_out_date).getTime() -
            new Date(booking.check_in_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
  const additionalServicesTotal = additionalServiceItems.reduce(
    (sum: number, item: any) => sum + toNumber(item.final_price),
    0,
  );
  const discountAmount = checkoutSale
    ? toNumber(checkoutSale.discount_amount) +
      toNumber(checkoutSale.custom_discount)
    : 0;
  const grandTotal = checkoutSale
    ? toNumber(checkoutSale.total_amount) + toNumber(checkoutSale.deposit_used)
    : 0;

  const pets = (booking.hotel_bookings_pet || []).map((item: any) => ({
    id: item.pets?.id,
    name: item.pets?.name || "",
    type: item.pets?.type || "",
    breed:
      item.pets?.is_mixed_breed && item.pets?.breed_2
        ? `${item.pets.breed} - ${item.pets.breed_2}`
        : item.pets?.breed || "",
    weight: item.pets?.weight,
  }));

  return {
    id: booking.id,
    customerId: booking.customer_id,
    customerName: booking.customers?.name || "",
    customerPhone: booking.customers?.phone || "",
    pets,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    ratePerNight: toNumber(booking.rate_per_night),
    totalNights,
    depositAmount: toNumber(booking.deposit_amount),
    depositStatus: booking.deposit_status,
    additionalServicesTotal,
    discountAmount,
    grandTotal,
    paidAmount: checkoutSale ? grandTotal : 0,
    remainingAmount: checkoutSale ? 0 : grandTotal,
    paymentMethod: checkoutSale?.payment_method || null,
    note: booking.note,
    status: booking.status,
    additionalServices: additionalServiceItems.map((item: any) => ({
      serviceId: item.service_id,
      serviceName: item.service_name,
      originalPrice: toNumber(item.original_price),
      finalPrice: toNumber(item.final_price),
      isPriceModified: Boolean(item.is_price_modified),
    })),
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
  };
}

async function fetchCheckoutSale(hotelBookingId: number) {
  const { data, error } = await supabaseAdmin
    .from("sales")
    .select(
      `
      id,
      hotel_booking_id,
      subtotal,
      discount_amount,
      custom_discount,
      deposit_used,
      total_amount,
      payment_method,
      created_at,
      sale_items (
        id,
        service_id,
        service_name,
        pet_id,
        original_price,
        final_price,
        is_price_modified,
        item_type,
        quantity,
        unit_price
      )
    `,
    )
    .eq("sale_type", "HOTEL")
    .eq("hotel_booking_id", hotelBookingId)
    .order("created_at", { ascending: false })
    .order("id", { foreignTable: "sale_items", ascending: true })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

// POST /api/hotel/[id]/checkout - checkout hotel booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);
    const body = await request.json();

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json(
        { data: null, error: "Invalid booking id" },
        { status: 400 },
      );
    }

    const {
      checkOutDate,
      additionalServices,
      discountAmount,
      paymentMethod,
      cashReceived,
      note,
      promotionId,
      customDiscount,
      saleDate,
    } = body;

    if (!checkOutDate) {
      return NextResponse.json(
        { data: null, error: "checkOutDate is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.rpc("checkout_hotel_booking", {
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

    // Override created_at if saleDate provided (browser sends ISO UTC)
    if (saleDate) {
      const { data: saleRow } = await supabaseAdmin
        .from("sales")
        .select("id")
        .eq("sale_type", "HOTEL")
        .eq("hotel_booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (saleRow?.id) {
        await supabaseAdmin
          .from("sales")
          .update({ created_at: new Date(saleDate).toISOString() })
          .eq("id", saleRow.id);
      }
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("hotel_bookings")
      .select(
        `
        *,
        customers (id, name, phone),
        hotel_bookings_pet (
          id,
          pet_id,
          pets (id, name, type, breed, breed_2, is_mixed_breed, weight)
        )
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    const checkoutSale = await fetchCheckoutSale(bookingId);
    return NextResponse.json({
      data: mapHotelBooking(booking, checkoutSale),
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
