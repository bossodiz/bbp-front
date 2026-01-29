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
        *,
        parent_breed_1:parent_breed_1_id(id, name),
        parent_breed_2:parent_breed_2_id(id, name)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching breed:", error);
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
    console.error("Error in GET /api/breeds/[id]:", error);
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

    // Validate mixed breed constraints if changing
    if (body.is_mixed !== undefined) {
      if (
        body.is_mixed &&
        (!body.parent_breed_1_id || !body.parent_breed_2_id)
      ) {
        return NextResponse.json(
          {
            error:
              "Mixed breed requires both parent_breed_1_id and parent_breed_2_id",
          },
          { status: 400 },
        );
      }

      if (
        !body.is_mixed &&
        (body.parent_breed_1_id || body.parent_breed_2_id)
      ) {
        return NextResponse.json(
          { error: "Pure breed cannot have parent breeds" },
          { status: 400 },
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("breeds")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating breed:", error);
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
    console.error("Error in PATCH /api/breeds/[id]:", error);
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

    // Check if breed is parent of any mixed breed
    const { count: mixedCount1 } = await supabaseAdmin
      .from("breeds")
      .select("id", { count: "exact", head: true })
      .eq("parent_breed_1_id", id);

    const { count: mixedCount2 } = await supabaseAdmin
      .from("breeds")
      .select("id", { count: "exact", head: true })
      .eq("parent_breed_2_id", id);

    const totalMixedCount = (mixedCount1 || 0) + (mixedCount2 || 0);

    if (totalMixedCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete breed. It is parent of ${totalMixedCount} mixed breed(s)`,
        },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("breeds").delete().eq("id", id);

    if (error) {
      console.error("Error deleting breed:", error);
      return NextResponse.json(
        { error: "Failed to delete breed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Breed deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/breeds/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
