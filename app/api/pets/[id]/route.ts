import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/pets/[id] - ดึงข้อมูลสัตว์เลี้ยงตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*, customers(*)")
      .eq("id", id)
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

// PATCH /api/pets/[id] - อัพเดทข้อมูลสัตว์เลี้ยง
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, breed, breed_2, is_mixed_breed, weight, note } = body;

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

    const updateData: any = { name, type, breed, weight, note };

    if (is_mixed_breed !== undefined) {
      updateData.is_mixed_breed = is_mixed_breed;
      updateData.breed_2 = is_mixed_breed ? breed_2 : null;
    }

    const { data, error } = await supabaseAdmin
      .from("pets")
      .update(updateData)
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

// DELETE /api/pets/[id] - ลบสัตว์เลี้ยง
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from("pets").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ data: null, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}
