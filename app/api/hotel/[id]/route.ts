import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function toNumber(value: any): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mapHotelBooking(booking: any, checkoutSale: any | null) {
  const saleItems = checkoutSale?.sale_items || [];
  const roomItem =
    saleItems.find((item: any) => item.item_type === "HOTEL_ROOM") || null;
  const additionalServiceItems = saleItems.filter(
    (item: any) => item.item_type === "SERVICE",
  );

  const roomTotal = roomItem ? toNumber(roomItem.final_price) : 0;
  const totalNights = roomItem ? Number(roomItem.quantity || 0) || null : null;
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

  return {
    id: booking.id,
    customerId: booking.customer_id,
    customerName: booking.customers?.name || "",
    customerPhone: booking.customers?.phone || "",
    petId: booking.pet_id,
    petName: booking.pets?.name || "",
    petType: booking.pets?.type || "",
    petBreed:
      booking.pets?.is_mixed_breed && booking.pets?.breed_2
        ? `${booking.pets.breed} - ${booking.pets.breed_2}`
        : booking.pets?.breed || "",
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    ratePerNight: toNumber(booking.rate_per_night),
    totalNights,
    roomTotal,
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

// GET /api/hotel/[id] - get hotel booking by id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json(
        { data: null, error: "Invalid booking id" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("hotel_bookings")
      .select(
        `
        *,
        customers (id, name, phone),
        pets (id, name, type, breed, breed_2, is_mixed_breed, weight)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { data: null, error: "Booking not found" },
        { status: 404 },
      );
    }

    const checkoutSale = await fetchCheckoutSale(bookingId);
    return NextResponse.json({
      data: mapHotelBooking(data, checkoutSale),
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/hotel/[id] - update hotel booking
export async function PUT(
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

    const updateData: any = {};

    if (body.checkInDate !== undefined) updateData.check_in_date = body.checkInDate;
    if (body.checkOutDate !== undefined)
      updateData.check_out_date = body.checkOutDate;
    if (body.ratePerNight !== undefined)
      updateData.rate_per_night = body.ratePerNight;
    if (body.depositAmount !== undefined) {
      updateData.deposit_amount = body.depositAmount;
      updateData.deposit_status = body.depositAmount > 0 ? "HELD" : "NONE";
    }
    if (body.note !== undefined) updateData.note = body.note;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.petId !== undefined) updateData.pet_id = body.petId;

    const { data, error } = await supabaseAdmin
      .from("hotel_bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select(
        `
        *,
        customers (id, name, phone),
        pets (id, name, type, breed, breed_2, is_mixed_breed, weight)
      `,
      )
      .single();

    if (error) throw error;

    const checkoutSale = await fetchCheckoutSale(bookingId);
    return NextResponse.json({
      data: mapHotelBooking(data, checkoutSale),
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/hotel/[id] - delete hotel booking
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json(
        { data: null, error: "Invalid booking id" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("hotel_bookings")
      .delete()
      .eq("id", bookingId);

    if (error) throw error;

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
