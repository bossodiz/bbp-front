import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CreatePromotionSchema } from "@/lib/schemas";
import { errorResponse } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

// GET /api/promotions - ดึงรายการโปรโมชั่นทั้งหมด
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
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
      applicableTo: promo.applicable_to || "ALL",
      active: promo.active,
      startDate: promo.start_date ? new Date(promo.start_date) : undefined,
      endDate: promo.end_date ? new Date(promo.end_date) : undefined,
      createdAt: new Date(promo.created_at),
      updatedAt: new Date(promo.updated_at),
    }));

    return NextResponse.json(promotions);
  } catch (error) {
    logger.error("promotions_fetch", {
      message: "Failed to fetch promotions",
      error: error instanceof Error ? error.message : String(error),
    });
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
    const parsed = CreatePromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error, "promotions_create");
    }
    const {
      name,
      type,
      value,
      freeServiceId,
      applicableTo,
      active,
      startDate,
      endDate,
    } = parsed.data;

    // แปลง camelCase เป็น snake_case สำหรับ database
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .insert({
        name,
        type,
        value,
        applicable_to: applicableTo,
        active: active,
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
      applicableTo: data.applicable_to || "ALL",
      active: data.active,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    logger.error("promotions_create", {
      message: "Failed to create promotion",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "ไม่สามารถสร้างโปรโมชั่นได้" },
      { status: 500 },
    );
  }
}
