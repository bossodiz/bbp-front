import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dashboard/today-bookings - ดึงรายการนัดหมายวันนี้ (ทุก status)
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayDateStr = today.toISOString().split("T")[0];

    // ดึงข้อมูล bookings วันนี้ (ทุก status)
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        booking_pets (
          pet_id,
          service_type,
          pets (id, name, type, breed, breed_2, is_mixed_breed)
        )
      `,
      )
      .eq("booking_date", todayDateStr)
      .order("booking_time", { ascending: true });

    if (bookingsError) throw bookingsError;

    // จัดรูปแบบข้อมูล
    const bookings = bookingsData.map((booking: any) => {
      const pets =
        booking.booking_pets?.map((bp: any) => ({
          petId: bp.pets?.id,
          name: bp.pets?.name,
          type: bp.pets?.type,
          breed:
            bp.pets?.is_mixed_breed && bp.pets?.breed_2
              ? `${bp.pets.breed} × ${bp.pets.breed_2}`
              : bp.pets?.breed || "ไม่ระบุสายพันธุ์",
          service: bp.service_type,
        })) || [];

      return {
        id: booking.id,
        customerId: booking.customer_id,
        customerName: booking.customer_name,
        phone: booking.phone,
        pets: pets,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        status: booking.status,
        depositAmount: parseFloat(booking.deposit_amount || "0"),
        note: booking.note,
      };
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching today bookings:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลนัดหมายวันนี้ได้" },
      { status: 500 },
    );
  }
}
