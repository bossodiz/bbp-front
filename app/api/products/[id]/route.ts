import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/products/[id] - ดึงข้อมูลสินค้าตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
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
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถดึงข้อมูลสินค้าได้" },
      { status: 500 },
    );
  }
}

// PUT /api/products/[id] - แก้ไขสินค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.sku !== undefined) updateData.sku = body.sku?.trim() || null;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.cost !== undefined) updateData.cost = body.cost;
    if (body.stockQuantity !== undefined) updateData.stock_quantity = body.stockQuantity;
    if (body.minStock !== undefined) updateData.min_stock = body.minStock;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.active !== undefined) updateData.active = body.active;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updateData)
      .eq("id", productId)
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
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถแก้ไขสินค้าได้" },
      { status: 500 },
    );
  }
}

// DELETE /api/products/[id] - ลบสินค้า
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถลบสินค้าได้" },
      { status: 500 },
    );
  }
}
