import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/products - ดึงรายการสินค้าทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("active", true);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    const products = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      category: p.category,
      price: parseFloat(p.price || 0),
      cost: parseFloat(p.cost || 0),
      stockQuantity: p.stock_quantity,
      minStock: p.min_stock,
      unit: p.unit,
      active: p.active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ data: products });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถดึงข้อมูลสินค้าได้" },
      { status: 500 },
    );
  }
}

// POST /api/products - สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, description, category, price, cost, stockQuantity, minStock, unit, active } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อสินค้า" },
        { status: 400 },
      );
    }

    if (price === undefined || price < 0) {
      return NextResponse.json(
        { error: "กรุณาระบุราคาขาย" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        category: category || null,
        price,
        cost: cost || 0,
        stock_quantity: stockQuantity || 0,
        min_stock: minStock || 0,
        unit: unit || "ชิ้น",
        active: active !== false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price as any),
        cost: parseFloat(data.cost as any),
        stockQuantity: data.stock_quantity,
        minStock: data.min_stock,
        unit: data.unit,
        active: data.active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถสร้างสินค้าได้" },
      { status: 500 },
    );
  }
}
