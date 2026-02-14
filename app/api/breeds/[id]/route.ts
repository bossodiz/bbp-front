import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/breeds/[id] - ดึงข้อมูลสายพันธุ์ตาม ID พร้อมข้อมูล parent breeds
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("breeds")
      .select(
        `
        *
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch breed" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Breed not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/breeds/[id] - แก้ไขข้อมูลสายพันธุ์
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("breeds")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update breed", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Breed not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/breeds/[id] - ลบสายพันธุ์
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if breed is being used by any pets
    const { count } = await supabaseAdmin
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq("breed", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete breed. It is currently used by ${count} pet(s)`,
        },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("breeds").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete breed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Breed deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
