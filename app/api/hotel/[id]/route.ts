import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/hotel/[id] - ดึงข้อมูลการจองโรงแรมตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

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
        { data: null, error: "ไม่พบข้อมูลการจอง" },
        { status: 404 },
      );
    }

    const transformed = {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customers?.name || "",
      customerPhone: data.customers?.phone || "",
      petId: data.pet_id,
      petName: data.pets?.name || "",
      petType: data.pets?.type || "",
      petBreed:
        data.pets?.is_mixed_breed && data.pets?.breed_2
          ? `${data.pets.breed} - ${data.pets.breed_2}`
          : data.pets?.breed || "",
      checkInDate: data.check_in_date,
      checkOutDate: data.check_out_date,
      ratePerNight: parseFloat(data.rate_per_night) || 0,
      totalNights: data.total_nights,
      roomTotal: parseFloat(data.room_total) || 0,
      depositAmount: parseFloat(data.deposit_amount) || 0,
      depositStatus: data.deposit_status,
      additionalServicesTotal: parseFloat(data.additional_services_total) || 0,
      discountAmount: parseFloat(data.discount_amount) || 0,
      grandTotal: parseFloat(data.grand_total) || 0,
      paidAmount: parseFloat(data.paid_amount) || 0,
      remainingAmount: parseFloat(data.remaining_amount) || 0,
      paymentMethod: data.payment_method,
      note: data.note,
      status: data.status,
      additionalServices: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ data: transformed, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/hotel/[id] - อัพเดตข้อมูลการจองโรงแรม
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await request.json();

    const updateData: any = {};

    if (body.checkInDate !== undefined)
      updateData.check_in_date = body.checkInDate;
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
        pets (id, name, type, breed, weight)
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/hotel/[id] - ลบการจองโรงแรม
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

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
