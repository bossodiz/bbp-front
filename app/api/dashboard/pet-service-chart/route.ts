import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Period = "weekly" | "monthly" | "yearly" | "last12months";
type PetType = "DOG" | "CAT";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") as Period) || "weekly";

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // tomorrow

    switch (period) {
      case "weekly":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case "monthly":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case "last12months":
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
    }

    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        created_at,
        sale_items (
          pet_id,
          pets (id, type)
        )
      `,
      )
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    const sales = (salesData ?? []).map((sale: any) => {
      const uniquePets = new Map<
        number,
        { id: number; type: PetType | null }
      >();

      for (const item of sale.sale_items ?? []) {
        const petId: number | null = item.pet_id ?? item.pets?.id ?? null;
        if (!petId) continue;

        if (!uniquePets.has(petId)) {
          uniquePets.set(petId, {
            id: petId,
            type: (item.pets?.type as PetType) ?? null,
          });
        }
      }

      return {
        id: sale.id,
        createdAt: sale.created_at,
        // จะได้รายการ pets แบบไม่ซ้ำแล้ว
        pets: Array.from(uniquePets.values()),
        // หรือถ้าคุณอยากคง items เป็น petType ก็ได้
        items: Array.from(uniquePets.values()).map((p) => ({
          petType: p.type,
        })),
      };
    });

    return NextResponse.json({
      sales,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกราฟสัตว์เข้ารับบริการได้" },
      { status: 500 },
    );
  }
}
