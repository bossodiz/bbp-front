import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/config/pet-types - ดึงรายการประเภทสัตว์
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pet_type_configs")
      .select("*")
      .order("order_index");

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/config/pet-types - สร้างประเภทสัตว์ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, icon, order_index, active } = body;

    const { data, error } = await supabaseAdmin
      .from("pet_type_configs")
      .insert({ id, name, icon, order_index, active })
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

// PATCH /api/config/pet-types - อัพเดทประเภทสัตว์
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, icon, order_index, active } = body;

    const { data, error } = await supabaseAdmin
      .from("pet_type_configs")
      .update({ name, icon, order_index, active })
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

// DELETE /api/config/pet-types - ลบประเภทสัตว์
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { data: null, error: "Pet type ID is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pet_type_configs")
      .delete()
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
