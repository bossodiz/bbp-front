import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/breeds - ดึงข้อมูลสายพันธุ์ทั้งหมด
// Query params: ?petTypeId=DOG หรือ CAT (optional), ?active=true (optional)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const petTypeId = searchParams.get("petTypeId");
    const active = searchParams.get("active");

    let query = supabaseAdmin.from("breeds").select("*").order("order_index");

    // Filter by pet type
    if (petTypeId) {
      query = query.eq("pet_type_id", petTypeId);
    }

    // Filter by active status
    if (active === "true") {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch breeds" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/breeds - สร้างสายพันธุ์ใหม่ (pure breed หรือ mixed breed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pet_type_id, name, order_index, active = true } = body;

    // Validation
    if (!pet_type_id || !name || order_index === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: pet_type_id, name, order_index" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("breeds")
      .insert({
        pet_type_id,
        name,
        order_index,
        active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create breed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
