import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/config/pet-sizes - ดึงรายการไซต์
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const petTypeId = searchParams.get("petTypeId");

    let query = supabaseAdmin.from("size_configs").select("*");

    if (petTypeId) {
      query = query.eq("pet_type_id", petTypeId);
    }

    const { data, error } = await query.order("order_index");

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/config/pet-sizes - สร้างไซต์ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      pet_type_id,
      name,
      min_weight,
      max_weight,
      description,
      order_index,
      active,
    } = body;

    const { data, error } = await supabaseAdmin
      .from("size_configs")
      .insert({
        id,
        pet_type_id,
        name,
        min_weight,
        max_weight,
        description,
        order_index,
        active,
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

// PATCH /api/config/pet-sizes - อัพเดทไซต์
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      min_weight,
      max_weight,
      description,
      order_index,
      active,
    } = body;

    const { data, error } = await supabaseAdmin
      .from("size_configs")
      .update({
        name,
        min_weight,
        max_weight,
        description,
        order_index,
        active,
      })
      .eq("id", id)
      .select()
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

// DELETE /api/config/pet-sizes - ลบไซต์
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { data: null, error: "Size ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("size_configs")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ data: null, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
