import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/bookings - ดึงรายการนัดหมายทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const fromDate = searchParams.get("fromDate");

    let query = supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Filter by exact date
    if (date) {
      query = query.eq("booking_date", date);
    }

    // Filter by date from (>=)
    if (fromDate) {
      query = query.gte("booking_date", fromDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // ดึงข้อมูล pets ที่เชื่อมโยงกับแต่ละ booking พร้อมข้อมูลสัตว์เลี้ยง
    const bookingIds = data.map((b) => b.id);
    const { data: bookingPetsData } = await supabase
      .from("booking_pets")
      .select(
        "booking_id, pet_id, service_type, pets(id, name, type, breed, breed_2, is_mixed_breed)",
      )
      .in("booking_id", bookingIds);

    // สร้าง map ของ pets แยกตาม booking_id
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
            service: bp.service_type, // ใช้ service_type จาก booking_pets table
          });
        }
      });
    }

    // แปลง snake_case เป็น camelCase
    const bookings = data.map((booking) => {
      const pets = petsByBookingId[booking.id] || [];

      return {
        id: booking.id,
        customerId: booking.customer_id,
        customerName: booking.customer_name,
        phone: booking.phone,
        pets: pets,
        serviceType: booking.service_type,
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
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลนัดหมายได้" },
      { status: 500 },
    );
  }
}

// POST /api/bookings - สร้างนัดหมายใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      phone,
      petServicePairs, // [{ petId?, newPet?, serviceType }]
      serviceType, // เก็บไว้สำหรับ backward compatibility
      bookingDate,
      bookingTime,
      note,
      depositAmount,
      depositStatus,
      status,
    } = body;

    // Validation
    if (
      !customerName ||
      !phone ||
      !serviceType ||
      !bookingDate ||
      !bookingTime
    ) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    let finalCustomerId = customerId;

    // ถ้าไม่มี customerId = ลูกค้าใหม่
    if (!finalCustomerId) {
      // เช็คเบอร์โทรซ้ำ
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, name")
        .eq("phone", phone)
        .single();

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: `เบอร์โทรนี้มีในระบบแล้ว (${existingCustomer.name}) กรุณาเลือกจากรายการลูกค้า`,
          },
          { status: 409 },
        );
      }

      // สร้างลูกค้าใหม่
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ name: customerName, phone })
        .select()
        .single();

      if (customerError) throw customerError;
      finalCustomerId = newCustomer.id;
    }

    // จัดการสัตว์เลี้ยงและบริการจาก petServicePairs
    const finalPetServiceData: Array<{ petId: number; serviceType: string }> =
      [];

    if (petServicePairs && petServicePairs.length > 0) {
      for (const pair of petServicePairs) {
        let petId = pair.petId;

        // ถ้าเป็นสัตว์เลี้ยงใหม่ ให้สร้างก่อน
        if (pair.newPet) {
          const pet = pair.newPet;
          // เช็คชื่อสัตว์เลี้ยงซ้ำ
          const { data: existingPet } = await supabase
            .from("pets")
            .select("id, name")
            .eq("customer_id", finalCustomerId)
            .ilike("name", pet.name)
            .single();

          if (existingPet) {
            return NextResponse.json(
              {
                error: `ลูกค้านี้มีสัตว์เลี้ยงชื่อ "${existingPet.name}" อยู่แล้ว`,
              },
              { status: 409 },
            );
          }

          // สร้างสัตว์เลี้ยงใหม่
          const { data: newPet, error: petError } = await supabase
            .from("pets")
            .insert({
              customer_id: finalCustomerId,
              name: pet.name,
              type: pet.type,
              breed: pet.breed || null,
              breed_2: pet.isMixedBreed ? pet.breed2 : null,
              is_mixed_breed: pet.isMixedBreed || false,
              weight: pet.weight,
              note: pet.note || null,
            })
            .select()
            .single();

          if (petError) throw petError;
          petId = newPet.id;
        }

        if (petId && pair.serviceType) {
          finalPetServiceData.push({
            petId: petId,
            serviceType: pair.serviceType,
          });
        }
      }
    }

    // สร้างนัดหมาย
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_id: finalCustomerId,
        customer_name: customerName,
        phone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        note: note || null,
        deposit_amount: depositAmount || 0,
        deposit_status: depositStatus || "NONE",
        status: status || "PENDING",
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // เชื่อมโยง booking กับ pets พร้อมบันทึก service_type แต่ละตัว
    if (finalPetServiceData.length > 0) {
      const bookingPets = finalPetServiceData.map((item) => ({
        booking_id: booking.id,
        pet_id: item.petId,
        service_type: item.serviceType,
      }));

      const { error: linkError } = await supabase
        .from("booking_pets")
        .insert(bookingPets);

      if (linkError) throw linkError;
    }

    // แปลงกลับเป็น camelCase
    const result = {
      id: booking.id,
      customerId: booking.customer_id,
      customerName: booking.customer_name,
      phone: booking.phone,
      petIds: finalPetServiceData.map((item) => item.petId),
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
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างนัดหมายได้" },
      { status: 500 },
    );
  }
}
