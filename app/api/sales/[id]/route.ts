import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const saleId = parseInt(id);

    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: "รหัสรายการขายไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const saleDate = body.saleDate;

    if (!saleDate) {
      return NextResponse.json(
        { error: "กรุณาระบุวันที่และเวลา" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(saleDate);

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "วันที่และเวลาไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("sales")
      .update({ created_at: parsedDate.toISOString() })
      .eq("id", saleId)
      .select("id, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        id: data.id,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating sale timestamp:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถแก้ไขวันที่และเวลาได้" },
      { status: 500 },
    );
  }
}
