import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/promotions - ดึงรายการโปรโมชั่นทั้งหมด
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // แปลง snake_case เป็น camelCase
    const promotions = data.map((promo) => ({
      id: promo.id,
      name: promo.name,
      type: promo.type,
      value: parseFloat(promo.value),
      freeServiceId: promo.free_service_id,
      active: promo.active,
      startDate: promo.start_date ? new Date(promo.start_date) : undefined,
      endDate: promo.end_date ? new Date(promo.end_date) : undefined,
      createdAt: new Date(promo.created_at),
      updatedAt: new Date(promo.updated_at),
    }));

    return NextResponse.json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}

// POST /api/promotions - สร้างโปรโมชั่นใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, value, freeServiceId, active, startDate, endDate } =
      body;

    // Validation
    if (!name || !type || value === undefined) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    if (type === "FREE_SERVICE" && !freeServiceId) {
      return NextResponse.json(
        { error: "กรุณาเลือกบริการฟรี" },
        { status: 400 },
      );
    }

    // แปลง camelCase เป็น snake_case สำหรับ database
    const { data, error } = await supabase
      .from("promotions")
      .insert({
        name,
        type,
        value,
        free_service_id: freeServiceId || null,
        active: active !== undefined ? active : true,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select()
      .single();

    if (error) throw error;

    // แปลงกลับเป็น camelCase
    const promotion = {
      id: data.id,
      name: data.name,
      type: data.type,
      value: parseFloat(data.value),
      freeServiceId: data.free_service_id,
      active: data.active,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}
