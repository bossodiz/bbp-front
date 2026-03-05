import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/customers - ดึงรายชื่อลูกค้าทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const search = searchParams.get("search");

    let query = supabaseAdmin.from("customers").select("*, pets(*)");

    // ค้นหาตามเบอร์โทร
    if (phone) {
      query = query.eq("phone", phone);
    }

    // ค้นหาตามชื่อหรือเบอร์โทร หรือชื่อสัตว์เลี้ยง
    if (search) {
      // Query 1: ค้นหา customers ที่ชื่อ/เบอร์ตรง
      const { data: customerMatches, error: customerError } =
        await supabaseAdmin
          .from("customers")
          .select("*, pets(*)")
          .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
          .order("created_at", { ascending: false });

      if (customerError) throw customerError;

      // Query 2: ค้นหา pets ที่ชื่อตรง เพื่อเอา customer_id
      const { data: petMatches, error: petError } = await supabaseAdmin
        .from("pets")
        .select("customer_id")
        .ilike("name", `%${search}%`);

      if (petError) throw petError;

      // หา customer IDs จาก pet matches ที่ยังไม่อยู่ใน customerMatches
      const existingIds = new Set(
        (customerMatches || []).map((c: any) => c.id),
      );
      const petCustomerIds = [
        ...new Set((petMatches || []).map((p: any) => p.customer_id)),
      ].filter((id) => !existingIds.has(id));

      let allCustomers: any[] = customerMatches || [];

      if (petCustomerIds.length > 0) {
        const { data: petCustomers, error: petCustomersError } =
          await supabaseAdmin
            .from("customers")
            .select("*, pets(*)")
            .in("id", petCustomerIds)
            .order("created_at", { ascending: false });

        if (petCustomersError) throw petCustomersError;

        allCustomers = [...allCustomers, ...(petCustomers || [])];
      }

      return NextResponse.json({ data: allCustomers, error: null });
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
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

// POST /api/customers - สร้างลูกค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { data: null, error: "Name and phone are required" },
        { status: 400 },
      );
    }

    // เช็คเบอร์โทรซ้ำ
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id, name, phone")
      .eq("phone", phone)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        {
          data: null,
          error: `เบอร์โทรนี้มีในระบบแล้ว (${existingCustomer.name})`,
        },
        { status: 409 }, // 409 Conflict
      );
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({ name, phone })
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
