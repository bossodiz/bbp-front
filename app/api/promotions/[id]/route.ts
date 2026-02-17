import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/promotions/:id - ดึงข้อมูลโปรโมชั่นตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "ไม่พบโปรโมชั่น" }, { status: 404 });
    }

    // แปลง snake_case เป็น camelCase
    const promotion = {
      id: data.id,
      name: data.name,
      type: data.type,
      value: parseFloat(data.value),
      applicableTo: data.applicable_to || "ALL",
      active: data.active,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}

// PUT /api/promotions/:id - อัพเดทโปรโมชั่น
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      value,
      freeServiceId,
      applicableTo,
      active,
      startDate,
      endDate,
    } = body;

    // แปลง camelCase เป็น snake_case
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (applicableTo !== undefined) updateData.applicable_to = applicableTo;
    if (active !== undefined) updateData.active = active;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;

    const { data, error } = await supabaseAdmin
      .from("promotions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "ไม่พบโปรโมชั่น" }, { status: 404 });
    }

    // แปลงกลับเป็น camelCase
    const promotion = {
      id: data.id,
      name: data.name,
      type: data.type,
      value: parseFloat(data.value),
      applicableTo: data.applicable_to || "ALL",
      active: data.active,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}

// DELETE /api/promotions/:id - ลบโปรโมชั่น
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "ลบโปรโมชั่นเรียบร้อยแล้ว" });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถลบโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}
