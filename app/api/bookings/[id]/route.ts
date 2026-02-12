import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bookings/:id - ดึงข้อมูลนัดหมายตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        *,
        booking_pets(pet_id, service_type, pets(id, name, type, breed, weight))
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "ไม่พบนัดหมาย" }, { status: 404 });
    }

    // จัดรูปแบบข้อมูล pets
    const pets =
      data.booking_pets?.map((bp: any) => ({
        petId: bp.pets.id,
        name: bp.pets.name,
        type: bp.pets.type,
        breed: bp.pets.breed || "ไม่ระบุสายพันธุ์",
        service: bp.service_type,
      })) || [];

    // แปลง snake_case เป็น camelCase
    const booking = {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      phone: data.phone,
      pets,
      bookingDate: new Date(data.booking_date),
      bookingTime: data.booking_time,
      note: data.note,
      depositAmount: parseFloat(data.deposit_amount),
      depositStatus: data.deposit_status,
      depositForfeitedDate: data.deposit_forfeited_date
        ? new Date(data.deposit_forfeited_date)
        : undefined,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลนัดหมายได้" },
      { status: 500 },
    );
  }
}

// PUT /api/bookings/:id - อัพเดทนัดหมาย
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      customerId,
      customerName,
      phone,
      petServicePairs,
      bookingDate,
      bookingTime,
      note,
      depositAmount,
      depositStatus,
      depositForfeitedDate,
      status,
    } = body;

    // แปลง camelCase เป็น snake_case
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (customerId !== undefined) updateData.customer_id = customerId;
    if (customerName !== undefined) updateData.customer_name = customerName;
    if (phone !== undefined) updateData.phone = phone;
    if (bookingDate !== undefined) updateData.booking_date = bookingDate;
    if (bookingTime !== undefined) updateData.booking_time = bookingTime;
    if (note !== undefined) updateData.note = note;
    if (depositAmount !== undefined) updateData.deposit_amount = depositAmount;
    if (depositStatus !== undefined) updateData.deposit_status = depositStatus;
    if (depositForfeitedDate !== undefined)
      updateData.deposit_forfeited_date = depositForfeitedDate;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "ไม่พบนัดหมาย" }, { status: 404 });
    }

    // อัพเดท booking_pets ถ้ามีการส่งมา
    if (petServicePairs && Array.isArray(petServicePairs)) {
      const bookingIdNum = parseInt(id, 10);
      const createdPetIds: number[] = [];

      // Backup old rows to restore if replace fails.
      const { data: existingBookingPets, error: existingBookingPetsError } =
        await supabaseAdmin
          .from("booking_pets")
          .select("pet_id, service_type")
          .eq("booking_id", bookingIdNum);

      if (existingBookingPetsError) throw existingBookingPetsError;

      const petServiceData: Array<{
        petId: number;
        serviceType: string;
      }> = [];

      for (const pair of petServicePairs) {
        if (pair.petId) {
          petServiceData.push({
            petId: pair.petId,
            serviceType: pair.serviceType,
          });
        } else if (pair.newPet) {
          const pet = pair.newPet;
          const { data: existingPet } = await supabaseAdmin
            .from("pets")
            .select("id, name")
            .eq("customer_id", customerId)
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

          const { data: newPet, error: petError } = await supabaseAdmin
            .from("pets")
            .insert({
              customer_id: customerId,
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
          createdPetIds.push(newPet.id);

          petServiceData.push({
            petId: newPet.id,
            serviceType: pair.serviceType,
          });
        }
      }

      const { error: deleteBookingPetsError } = await supabaseAdmin
        .from("booking_pets")
        .delete()
        .eq("booking_id", bookingIdNum);

      if (deleteBookingPetsError) throw deleteBookingPetsError;

      try {
        if (petServiceData.length > 0) {
          const bookingPetsInserts = petServiceData.map((pet) => ({
            booking_id: bookingIdNum,
            pet_id: pet.petId,
            service_type: pet.serviceType,
          }));

          const { error: bookingPetsError } = await supabaseAdmin
            .from("booking_pets")
            .insert(bookingPetsInserts);

          if (bookingPetsError) throw bookingPetsError;
        }
      } catch (replaceError) {
        if (existingBookingPets && existingBookingPets.length > 0) {
          await supabaseAdmin.from("booking_pets").insert(
            existingBookingPets.map((item) => ({
              booking_id: bookingIdNum,
              pet_id: item.pet_id,
              service_type: item.service_type,
            })),
          );
        }

        if (createdPetIds.length > 0) {
          await supabaseAdmin.from("pets").delete().in("id", createdPetIds);
        }

        throw replaceError;
      }
    }
    // ดึงข้อมูลนัดหมายพร้อม pets
    const { data: bookingWithPets } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        *,
        booking_pets(pet_id, service_type, pets(id, name, type, breeds(name)))
      `,
      )
      .eq("id", id)
      .single();

    // จัดรูปแบบข้อมูล pets
    const pets =
      bookingWithPets?.booking_pets?.map((bp: any) => ({
        petId: bp.pets.id,
        name: bp.pets.name,
        type: bp.pets.type,
        breed: bp.pets.breeds?.name || "ไม่ระบุสายพันธุ์",
        service: bp.service_type,
      })) || [];

    // แปลงกลับเป็น camelCase
    const booking = {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      phone: data.phone,
      pets,
      bookingDate: new Date(data.booking_date),
      bookingTime: data.booking_time,
      note: data.note,
      depositAmount: parseFloat(data.deposit_amount),
      depositStatus: data.deposit_status,
      depositForfeitedDate: data.deposit_forfeited_date
        ? new Date(data.deposit_forfeited_date)
        : undefined,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทนัดหมายได้" },
      { status: 500 },
    );
  }
}

// DELETE /api/bookings/:id - ลบนัดหมาย
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "ลบนัดหมายเรียบร้อยแล้ว" });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถลบนัดหมายได้" },
      { status: 500 },
    );
  }
}
