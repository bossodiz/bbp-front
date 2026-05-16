import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CreateHotelBookingSchema } from "@/lib/schemas";
import { errorResponse } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

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
        hotel_bookings_pet (
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("hotel_fetch", { message });
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 },
    );
  }
}

// POST /api/hotel - create hotel booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateHotelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error, "hotel_create");
    }
    const {
      customerId,
      petIds,
      checkInDate,
      ratePerNight,
      depositAmount,
      note,
    } = parsed.data;

    const insertData: any = {
      customer_id: customerId,
      check_in_date: checkInDate,
      rate_per_night: ratePerNight,
      deposit_amount: depositAmount,
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

    const { data: bookingPets, error: bookingPetsError } = await supabaseAdmin
      .from("hotel_bookings_pet")
      .insert(
        petIds.map((petId: number) => ({
          hotel_booking_id: booking.id,
          pet_id: petId,
        })),
      )
      .select("*");

    if (bookingPetsError) throw bookingPetsError;

    const { data: fullBooking, error: fetchError } = await supabaseAdmin
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
      .eq("id", booking.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { data: mapHotelBooking(fullBooking, null), error: null },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("hotel_create", { message });
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 },
    );
  }
}
