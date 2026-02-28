import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { toUtcIsoFromBangkokLocal } from "@/lib/utils";

function getBangkokDateParts() {
  const now = new Date();
  const bkk = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return {
    year: bkk.getFullYear(),
    month: bkk.getMonth() + 1,
    day: bkk.getDate(),
  };
}

type Period = "weekly" | "monthly" | "yearly" | "last12months";
type PetType = "DOG" | "CAT";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") as Period) || "weekly";

    const { year, month, day } = getBangkokDateParts();
    const endUtc = toUtcIsoFromBangkokLocal(year, month, day + 1, 0, 0, 0);

    let startUtc: string;

    switch (period) {
      case "weekly":
        startUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
        break;
      case "monthly":
        startUtc = toUtcIsoFromBangkokLocal(year, month, 1, 0, 0, 0);
        break;
      case "yearly":
        startUtc = toUtcIsoFromBangkokLocal(year, 1, 1, 0, 0, 0);
        break;
      case "last12months":
        startUtc = toUtcIsoFromBangkokLocal(year - 1, month, day, 0, 0, 0);
        break;
      default:
        startUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
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
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
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
        start: startUtc,
        end: endUtc,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกราฟสัตว์เข้ารับบริการได้" },
      { status: 500 },
    );
  }
}
