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

  const pets = (booking.hotel_rooms || []).map((room: any) => ({
    id: room.pets?.id,
    name: room.pets?.name || "",
    type: room.pets?.type || "",
    breed:
      room.pets?.is_mixed_breed && room.pets?.breed_2
        ? `${room.pets.breed} - ${room.pets.breed_2}`
        : room.pets?.breed || "",
    weight: room.pets?.weight,
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

// GET /api/hotel - list hotel bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    let query = supabaseAdmin
      .from("hotel_bookings")
      .select(
        `
        *,
        customers (id, name, phone),
        hotel_rooms (
          id,
          pet_id,
          pets (id, name, type, breed, breed_2, is_mixed_breed, weight)
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      const statuses = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        query = query.in("status", statuses);
      }
    }

    if (customerId) {
      const parsedCustomerId = Number(customerId);
      if (!Number.isFinite(parsedCustomerId)) {
        return NextResponse.json(
          { data: null, error: "Invalid customerId" },
          { status: 400 },
        );
      }
      query = query.eq("customer_id", parsedCustomerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const bookingIds = (data || []).map((booking: any) => booking.id);
    const salesByBookingId = new Map<number, any>();

    if (bookingIds.length > 0) {
      const { data: checkoutSales, error: salesError } = await supabaseAdmin
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
        .in("hotel_booking_id", bookingIds)
        .order("created_at", { ascending: false })
        .order("id", { foreignTable: "sale_items", ascending: true });

      if (salesError) throw salesError;

      for (const sale of checkoutSales || []) {
        const bookingIdKey = Number(sale.hotel_booking_id);
        if (!Number.isFinite(bookingIdKey)) continue;
        if (!salesByBookingId.has(bookingIdKey)) {
          salesByBookingId.set(bookingIdKey, sale);
        }
      }
    }

    const transformed = (data || []).map((booking: any) =>
      mapHotelBooking(
        booking,
        salesByBookingId.get(Number(booking.id)) || null,
      ),
    );

    return NextResponse.json({ data: transformed, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/hotel - create hotel booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      petIds,
      checkInDate,
      ratePerNight,
      depositAmount,
      note,
    } = body;

    if (
      !customerId ||
      !petIds ||
      !Array.isArray(petIds) ||
      petIds.length === 0 ||
      !checkInDate
    ) {
      return NextResponse.json(
        {
          data: null,
          error: "customerId, petIds (array) and checkInDate are required",
        },
        { status: 400 },
      );
    }

    if (!ratePerNight || ratePerNight <= 0) {
      return NextResponse.json(
        { data: null, error: "ratePerNight must be greater than 0" },
        { status: 400 },
      );
    }

    const insertData: any = {
      customer_id: customerId,
      check_in_date: checkInDate,
      rate_per_night: ratePerNight,
      deposit_amount: depositAmount || 0,
      deposit_status: depositAmount > 0 ? "HELD" : "NONE",
      note: note || null,
      status: "RESERVED",
    };

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("hotel_bookings")
      .insert(insertData)
      .select("*")
      .single();

    if (bookingError) throw bookingError;

    const roomInserts = petIds.map((petId: number) => ({
      hotel_booking_id: booking.id,
      pet_id: petId,
    }));

    const { error: roomsError } = await supabaseAdmin
      .from("hotel_rooms")
      .insert(roomInserts);

    if (roomsError) throw roomsError;

    const { data: fullBooking, error: fetchError } = await supabaseAdmin
      .from("hotel_bookings")
      .select(
        `
        *,
        customers (id, name, phone),
        hotel_rooms (
          id,
          pet_id,
          pets (id, name, type, breed, breed_2, is_mixed_breed, weight)
        )
      `,
      )
      .eq("id", booking.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { data: mapHotelBooking(fullBooking, null), error: null },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
