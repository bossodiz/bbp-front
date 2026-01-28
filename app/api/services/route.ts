import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/services - ดึงรายการบริการทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = supabaseAdmin.from("services").select(`
      *,
      service_prices (
        id,
        pet_type_id,
        size_id,
        price
      )
    `);

    if (activeOnly) {
      query = query.eq("active", true);
    }

    const { data, error } = await query.order("order_index", {
      ascending: true,
    });

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/services - สร้างบริการใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, prices, isSpecial, specialPrice } = body;

    // Validation for special vs regular services
    if (!name) {
      return NextResponse.json(
        { data: null, error: "Name is required" },
        { status: 400 },
      );
    }

    if (isSpecial) {
      if (!specialPrice || specialPrice <= 0) {
        return NextResponse.json(
          {
            data: null,
            error: "Special price is required for special services",
          },
          { status: 400 },
        );
      }
    } else {
      if (!prices || prices.length === 0) {
        return NextResponse.json(
          { data: null, error: "Prices are required for regular services" },
          { status: 400 },
        );
      }
    }

    // หา order_index ล่าสุดตาม type (แยกบริการปกติกับพิเศษ)
    const { data: lastService } = await supabaseAdmin
      .from("services")
      .select("order_index")
      .eq("is_special", isSpecial || false)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastService?.order_index || 0) + 1;

    // สร้างบริการ
    const serviceData: any = {
      name,
      description,
      active: true,
      order_index: nextOrder,
      is_special: isSpecial || false,
    };

    if (isSpecial) {
      serviceData.special_price = specialPrice;
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .insert(serviceData)
      .select()
      .single();

    if (serviceError) throw serviceError;

    // สร้างราคาบริการ (เฉพาะบริการปกติ)
    if (!isSpecial && prices && prices.length > 0) {
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
      .eq("id", service.id)
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
