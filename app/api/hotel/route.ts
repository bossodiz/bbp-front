import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/hotel - ดึงรายการจองโรงแรมทั้งหมด
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
        pets (id, name, type, breed, breed_2, is_mixed_breed, weight),
        hotel_additional_services (*)
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      // Support multiple statuses separated by comma
      const statuses = status.split(",").map((s) => s.trim());
      query = query.in("status", statuses);
    }

    if (customerId) {
      query = query.eq("customer_id", parseInt(customerId));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to camelCase
    const transformed = (data || []).map((booking: any) => ({
      id: booking.id,
      customerId: booking.customer_id,
      customerName: booking.customers?.name || "",
      customerPhone: booking.customers?.phone || "",
      petId: booking.pet_id,
      petName: booking.pets?.name || "",
      petType: booking.pets?.type || "",
      petBreed: booking.pets?.is_mixed_breed && booking.pets?.breed_2
        ? `${booking.pets.breed} - ${booking.pets.breed_2}`
        : booking.pets?.breed || "",
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      ratePerNight: parseFloat(booking.rate_per_night) || 0,
      totalNights: booking.total_nights,
      roomTotal: parseFloat(booking.room_total) || 0,
      depositAmount: parseFloat(booking.deposit_amount) || 0,
      depositStatus: booking.deposit_status,
      additionalServicesTotal:
        parseFloat(booking.additional_services_total) || 0,
      discountAmount: parseFloat(booking.discount_amount) || 0,
      grandTotal: parseFloat(booking.grand_total) || 0,
      paidAmount: parseFloat(booking.paid_amount) || 0,
      remainingAmount: parseFloat(booking.remaining_amount) || 0,
      paymentMethod: booking.payment_method,
      note: booking.note,
      status: booking.status,
      additionalServices: (booking.hotel_additional_services || []).map(
        (svc: any) => ({
          id: svc.id,
          hotelBookingId: svc.hotel_booking_id,
          serviceId: svc.service_id,
          serviceName: svc.service_name,
          originalPrice: parseFloat(svc.original_price) || 0,
          finalPrice: parseFloat(svc.final_price) || 0,
          isPriceModified: svc.is_price_modified,
        }),
      ),
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    }));

    return NextResponse.json({ data: transformed, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/hotel - สร้างการจองโรงแรมใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      petId,
      checkInDate,
      ratePerNight,
      depositAmount,
      note,
    } = body;

    if (!customerId || !petId || !checkInDate) {
      return NextResponse.json(
        { data: null, error: "กรุณาระบุลูกค้า สัตว์เลี้ยง และวันเข้าพัก" },
        { status: 400 },
      );
    }

    if (!ratePerNight || ratePerNight <= 0) {
      return NextResponse.json(
        { data: null, error: "กรุณาระบุราคาต่อคืน" },
        { status: 400 },
      );
    }

    const insertData: any = {
      customer_id: customerId,
      pet_id: petId,
      check_in_date: checkInDate,
      rate_per_night: ratePerNight,
      deposit_amount: depositAmount || 0,
      deposit_status: depositAmount > 0 ? "HELD" : "NONE",
      note: note || null,
      status: "RESERVED",
    };

    const { data, error } = await supabaseAdmin
      .from("hotel_bookings")
      .insert(insertData)
      .select(
        `
        *,
        customers (id, name, phone),
        pets (id, name, type, breed, weight)
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
