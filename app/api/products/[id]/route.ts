import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  errorResponse,
  successResponse,
  ValidationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
} from "@/lib/error-handler";
import { UpdateProductSchema } from "@/lib/schemas";
import { validateCsrfFromRequest } from "@/lib/csrf";
import {
  checkRateLimit,
  getClientIp,
  rateLimitConfigs,
} from "@/lib/rate-limit";
import { RawProduct } from "@/lib/api-types";

// GET /api/products/[id] - ดึงข้อมูลสินค้าตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`products:get:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      throw new ValidationError("รหัสสินค้าไม่ถูกต้อง");
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("ไม่พบสินค้าที่ระบุ");

    return successResponse({
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description,
      category: data.category,
      price: parseFloat(String(data.price)),
      cost: parseFloat(String(data.cost)),
      stockQuantity: data.stock_quantity,
      minStock: data.min_stock,
      unit: data.unit,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    return errorResponse(error, "products_get_by_id", "ไม่สามารถดึงข้อมูลสินค้าได้");
  }
}

// PUT /api/products/[id] - แก้ไขสินค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`products:put:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    validateCsrfFromRequest(request);
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      throw new ValidationError("รหัสสินค้าไม่ถูกต้อง");
    }

    const body = await request.json();
    const validated = UpdateProductSchema.parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.sku !== undefined) updateData.sku = validated.sku;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.cost !== undefined) updateData.cost = validated.cost;
    if (validated.stockQuantity !== undefined) updateData.stock_quantity = validated.stockQuantity;
    if (validated.minStock !== undefined) updateData.min_stock = validated.minStock;
    if (validated.unit !== undefined) updateData.unit = validated.unit;
    if (validated.active !== undefined) updateData.active = validated.active;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);

    return successResponse({
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description,
      category: data.category,
      price: parseFloat(String(data.price)),
      cost: parseFloat(String(data.cost)),
      stockQuantity: data.stock_quantity,
      minStock: data.min_stock,
      unit: data.unit,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    return errorResponse(error, "products_update", "ไม่สามารถแก้ไขสินค้าได้");
  }
}

// DELETE /api/products/[id] - ลบสินค้า
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`products:delete:${ip}`, rateLimitConfigs.standard);
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    validateCsrfFromRequest(request);
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      throw new ValidationError("รหัสสินค้าไม่ถูกต้อง");
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw new DatabaseError(error.message);

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error, "products_delete", "ไม่สามารถลบสินค้าได้");
  }
}
