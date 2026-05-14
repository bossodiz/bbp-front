import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  errorResponse,
  successResponse,
  DatabaseError,
  RateLimitError,
} from "@/lib/error-handler";
import { CreateProductSchema } from "@/lib/schemas";
import { validateCsrfFromRequest } from "@/lib/csrf";
import {
  checkRateLimit,
  getClientIp,
  rateLimitConfigs,
} from "@/lib/rate-limit";
import {
  PaginationParamsSchema,
  getOffset,
  createPaginationMeta,
  createPaginatedResponse,
} from "@/lib/pagination";
import { RawProduct } from "@/lib/api-types";

// GET /api/products - ดึงรายการสินค้าทั้งหมด (with pagination)
export async function GET(request: NextRequest) {
  try {
    console.log("Received request to GET /api/products");
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `products:get:${ip}`,
      rateLimitConfigs.standard,
    );
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    const { searchParams } = new URL(request.url);
    const paginationParams = PaginationParamsSchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const activeOnly = searchParams.get("active") === "true";
    const category = searchParams.get("category");

    const offset = getOffset(paginationParams.page, paginationParams.limit);

    let countQuery = supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true });
    let dataQuery = supabaseAdmin
      .from("products")
      .select("*")
      .order("name", { ascending: true })
      .range(offset, offset + paginationParams.limit - 1);

    if (activeOnly) {
      countQuery = countQuery.eq("active", true);
      dataQuery = dataQuery.eq("active", true);
    }
    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (error) throw new DatabaseError(error.message);

    const products = ((data as RawProduct[]) || []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      category: p.category,
      price: parseFloat(String(p.price)),
      cost: parseFloat(String(p.cost)),
      stockQuantity: p.stock_quantity,
      minStock: p.min_stock,
      unit: p.unit,
      active: p.active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    const pagination = createPaginationMeta(
      paginationParams.page,
      paginationParams.limit,
      count || 0,
    );

    return successResponse(createPaginatedResponse(products, pagination));
  } catch (error) {
    return errorResponse(
      error,
      "products_fetch",
      "ไม่สามารถดึงข้อมูลสินค้าได้",
    );
  }
}

// POST /api/products - สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `products:post:${ip}`,
      rateLimitConfigs.standard,
    );
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.retryAfter || 60);
    }

    validateCsrfFromRequest(request);
    const body = await request.json();
    const validated = CreateProductSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: validated.name,
        sku: validated.sku || null,
        description: validated.description || null,
        category: validated.category || null,
        price: validated.price,
        cost: validated.cost,
        stock_quantity: validated.stockQuantity,
        min_stock: validated.minStock,
        unit: validated.unit,
        active: validated.active,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);

    return successResponse(
      {
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
      201,
    );
  } catch (error) {
    return errorResponse(error, "products_create", "ไม่สามารถสร้างสินค้าได้");
  }
}
