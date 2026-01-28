import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/services/[id] - ดึงข้อมูลบริการตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("services")
      .select(
        `
      *,
      service_prices (
        id,
        pet_type_id,
        size_id,
        price
      )
    `,
      )
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

// PATCH /api/services/[id] - อัพเดทข้อมูลบริการ
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, active, prices, isSpecial, specialPrice } = body;

    // อัพเดทข้อมูลบริการ
    const updateData: any = { name, description, active };

    if (isSpecial !== undefined) {
      updateData.is_special = isSpecial;
      updateData.special_price = isSpecial ? specialPrice : null;
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (serviceError) throw serviceError;

    // ถ้ามีการอัพเดทราคา (เฉพาะบริการปกติ)
    if (prices !== undefined) {
      // ลบราคาเดิม
      await supabaseAdmin.from("service_prices").delete().eq("service_id", id);

      // เพิ่มราคาใหม่ (ถ้าไม่ใช่บริการพิเศษ)
      if (!isSpecial && prices.length > 0) {
        const priceRecords = prices.map((price: any) => ({
          service_id: service.id,
          pet_type_id: price.petTypeId,
          size_id: price.sizeId,
          price: price.price,
        }));

        const { error: pricesError } = await supabaseAdmin
          .from("service_prices")
          .insert(priceRecords);

        if (pricesError) throw pricesError;
      }
    }

    // ดึงข้อมูลบริการพร้อมราคา
    const { data, error } = await supabaseAdmin
      .from("services")
      .select(
        `
      *,
      service_prices (
        id,
        pet_type_id,
        size_id,
        price
      )
    `,
      )
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

// DELETE /api/services/[id] - ลบบริการ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("services")
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
