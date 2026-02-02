import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/pets - ดึงรายการสัตว์เลี้ยงทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    let query = supabaseAdmin.from("pets").select("*, customers(*)");

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/pets - เพิ่มสัตว์เลี้ยงใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      name,
      type,
      breed,
      breed_2,
      is_mixed_breed,
      weight,
      note,
    } = body;

    if (!customer_id || !name || !type) {
      return NextResponse.json(
        {
          data: null,
          error: "Customer ID, name, type are required",
        },
        { status: 400 },
      );
    }

    // เช็คชื่อสัตว์เลี้ยงซ้ำภายในลูกค้าเดียวกัน
    const { data: existingPet } = await supabaseAdmin
      .from("pets")
      .select("id, name")
      .eq("customer_id", customer_id)
      .ilike("name", name)
      .single();

    if (existingPet) {
      return NextResponse.json(
        {
          data: null,
          error: `ลูกค้านี้มีสัตว์เลี้ยงชื่อ "${existingPet.name}" อยู่แล้ว`,
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // Validate mixed breed
    if (is_mixed_breed && (!breed || !breed_2)) {
      return NextResponse.json(
        {
          data: null,
          error: "Mixed breed requires both breed and breed_2",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pets")
      .insert({
        customer_id,
        name,
        type,
        breed,
        breed_2: is_mixed_breed ? breed_2 : null,
        is_mixed_breed: is_mixed_breed || false,
        weight,
        note,
      })
      .select()
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
