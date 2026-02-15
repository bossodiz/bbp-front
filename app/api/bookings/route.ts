import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bookings - ดึงรายการนัดหมายทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const fromDate = searchParams.get("fromDate");

    let query = supabaseAdmin
      .from("bookings")
      .select(
        `
        *,
        customers(id, name, phone)
      `,
      )
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (date) {
      query = query.eq("booking_date", date);
    }

    if (fromDate) {
      query = query.gte("booking_date", fromDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const bookingIds = data.map((b) => b.id);
    let bookingPetsData: any[] | null = [];

    if (bookingIds.length > 0) {
      const { data: linkedPets, error: bookingPetsError } = await supabaseAdmin
        .from("booking_pets")
        .select(
          "booking_id, pet_id, service_type, pets(id, name, type, breed, breed_2, is_mixed_breed)",
        )
        .in("booking_id", bookingIds);

      if (bookingPetsError) throw bookingPetsError;
      bookingPetsData = linkedPets;
    }

    const petsByBookingId: Record<
      number,
      Array<{
        petId: number;
        name: string;
        type: string;
        breed: string;
        service: string;
      }>
    > = {};

    if (bookingPetsData) {
      bookingPetsData.forEach((bp: any) => {
        if (!petsByBookingId[bp.booking_id]) {
          petsByBookingId[bp.booking_id] = [];
        }

        if (bp.pets) {
          petsByBookingId[bp.booking_id].push({
            petId: bp.pets.id,
            name: bp.pets.name,
            type: bp.pets.type,
            breed:
              bp.pets.is_mixed_breed && bp.pets.breed_2
                ? `${bp.pets.breed} × ${bp.pets.breed_2}`
                : bp.pets.breed || "ไม่ระบุสายพันธุ์",
            service: bp.service_type,
          });
        }
      });
    }

    const bookings = data.map((booking) => {
      const pets = petsByBookingId[booking.id] || [];

      return {
        id: booking.id,
        customerId: booking.customer_id,
        customerName: booking.customers?.name || "ไม่พบข้อมูลลูกค้า",
        phone: booking.customers?.phone || "",
        pets,
        bookingDate: new Date(booking.booking_date),
        bookingTime: booking.booking_time,
        note: booking.note,
        depositAmount: parseFloat(booking.deposit_amount),
        depositStatus: booking.deposit_status,
        depositForfeitedDate: booking.deposit_forfeited_date
          ? new Date(booking.deposit_forfeited_date)
          : undefined,
        status: booking.status,
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at),
      };
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลนัดหมายได้" },
      { status: 500 },
    );
  }
}

// POST /api/bookings - สร้างนัดหมายใหม่ (atomic via RPC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      petServicePairs,
      bookingDate,
      bookingTime,
      note,
      depositAmount,
      depositStatus,
      status,
    } = body;

    if (!customerId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    const { data: booking, error } = await supabaseAdmin.rpc(
      "create_booking_with_pets",
      {
        p_customer_id: customerId,
        p_booking_date: bookingDate,
        p_booking_time: bookingTime,
        p_note: note ?? null,
        p_deposit_amount: depositAmount ?? 0,
        p_deposit_status: depositStatus ?? "NONE",
        p_status: status ?? "PENDING",
        p_pet_service_pairs: petServicePairs ?? [],
      },
    );

    if (error) throw error;

    const { data: bookingPets } = await supabaseAdmin
      .from("booking_pets")
      .select("pet_id")
      .eq("booking_id", booking.id);

    // Fetch customer data
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("name, phone")
      .eq("id", booking.customer_id)
      .single();

    const result = {
      id: booking.id,
      customerId: booking.customer_id,
      customerName: customer?.name || "ไม่พบข้อมูลลูกค้า",
      phone: customer?.phone || "",
      petIds: (bookingPets || []).map((item) => item.pet_id),
      bookingDate: new Date(booking.booking_date),
      bookingTime: booking.booking_time,
      note: booking.note,
      depositAmount: parseFloat(booking.deposit_amount),
      depositStatus: booking.deposit_status,
      depositForfeitedDate: booking.deposit_forfeited_date
        ? new Date(booking.deposit_forfeited_date)
        : undefined,
      status: booking.status,
      createdAt: new Date(booking.created_at),
      updatedAt: new Date(booking.updated_at),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "ไม่สามารถสร้างนัดหมายได้";
    const isConflict =
      message.includes("มีในระบบแล้ว") ||
      message.includes("มีสัตว์เลี้ยงชื่อ") ||
      message.includes("duplicate");

    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 500 },
    );
  }
}
