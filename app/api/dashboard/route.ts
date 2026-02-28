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

function formatYmd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// GET /api/dashboard - ดึงข้อมูล dashboard ครบถ้วน
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "weekly"; // weekly, monthly, yearly

    // คำนวณ date range ตาม period โดยใช้ Bangkok timezone
    const { year, month, day } = getBangkokDateParts();
    const todayDateYmd = formatYmd(year, month, day);
    const endDateUtc = toUtcIsoFromBangkokLocal(year, month, day + 1, 0, 0, 0);

    let startDateUtc: string;

    switch (period) {
      case "weekly":
        startDateUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
        break;
      case "monthly":
        startDateUtc = toUtcIsoFromBangkokLocal(year, month, day - 29, 0, 0, 0);
        break;
      case "yearly":
        startDateUtc = toUtcIsoFromBangkokLocal(year - 1, month, day, 0, 0, 0);
        break;
      default:
        startDateUtc = toUtcIsoFromBangkokLocal(year, month, day - 6, 0, 0, 0);
    }

    // 1. ดึงข้อมูล sales
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        *,
        customers(id, name, phone),
        sale_items (
          *,
          pets (id, name, type)
        )
      `,
      )
      .gte("created_at", startDateUtc)
      .lt("created_at", endDateUtc)
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    // 2. ดึงข้อมูล bookings (เฉพาะ PENDING)
    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        *,
        customers(id, name, phone),
        booking_pets (
          pet_id,
          service_type,
          pets (id, name, type, breed, breed_2, is_mixed_breed)
        )
      `,
      )
      .eq("status", "PENDING")
      .gte(
        "booking_date",
        formatYmd(
          year,
          month,
          day - (period === "weekly" ? 6 : period === "monthly" ? 29 : 365),
        ),
      )
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (bookingsError) throw bookingsError;

    // 3. Process sales data
    const sales = salesData.map((sale) => ({
      id: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customers?.name || "ไม่ระบุลูกค้า",
      customerPhone: sale.customers?.phone || null,
      totalAmount: parseFloat(sale.total_amount),
      items: sale.sale_items.map((item: any) => ({
        id: item.id,
        petId: item.pet_id,
        petType: item.pets?.type || null,
        serviceId: item.service_id,
        serviceName: item.service_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        pet: item.pets
          ? {
              id: item.pets.id,
              name: item.pets.name,
              type: item.pets.type,
            }
          : null,
      })),
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
    }));

    // 4. Process bookings data
    const bookings = bookingsData.map((booking) => ({
      id: booking.id,
      customerId: booking.customer_id,
      customerName: booking.customers?.name || "ไม่ระบุลูกค้า",
      phone: booking.customers?.phone || null,
      pets:
        booking.booking_pets?.map((bp: any) => ({
          petId: bp.pet_id,
          name: bp.pets?.name || "ไม่ระบุชื่อ",
          type: bp.pets?.type || "DOG",
          breed:
            bp.pets?.is_mixed_breed && bp.pets?.breed_2
              ? `${bp.pets.breed} × ${bp.pets.breed_2}`
              : bp.pets?.breed || "ไม่ระบุสายพันธุ์",
          service: bp.service_type,
        })) || [],
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      note: booking.note,
      depositAmount: parseFloat(booking.deposit_amount || 0),
      depositStatus: booking.deposit_status,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    }));

    // คำนวณ stats สำหรับวันนี้ โดยใช้ Bangkok timezone
    const todayStartUtc = toUtcIsoFromBangkokLocal(year, month, day, 0, 0, 0);

    const { data: todaySalesData } = await supabaseAdmin
      .from("sales")
      .select(
        `
        *,
        sale_items (
          *,
          pets (id, type)
        )
      `,
      )
      .gte("created_at", todayStartUtc)
      .lt("created_at", endDateUtc);

    const { data: todayBookingsData } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("status", "PENDING")
      .eq("booking_date", todayDateYmd);

    // คำนวณ today stats
    const todayRevenue =
      todaySalesData?.reduce(
        (sum, sale) => sum + parseFloat(sale.total_amount),
        0,
      ) || 0;

    const todayPets = new Set<number>();
    todaySalesData?.forEach((sale) => {
      sale.sale_items.forEach((item: any) => {
        if (item.pet_id) todayPets.add(item.pet_id);
      });
    });

    const todayDogs = Array.from(todayPets).filter((petId) => {
      const sale = todaySalesData?.find((s) =>
        s.sale_items.some((item: any) => item.pet_id === petId),
      );
      const item = sale?.sale_items.find((item: any) => item.pet_id === petId);
      return item?.pets?.type === "DOG";
    }).length;

    const todayCats = Array.from(todayPets).filter((petId) => {
      const sale = todaySalesData?.find((s) =>
        s.sale_items.some((item: any) => item.pet_id === petId),
      );
      const item = sale?.sale_items.find((item: any) => item.pet_id === petId);
      return item?.pets?.type === "CAT";
    }).length;

    const todayBookingsCount = todayBookingsData?.length || 0;

    // 6. คำนวณ top customers จาก sales data
    const customerStats = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        visits: number;
        totalSpent: number;
      }
    >();

    sales.forEach((sale) => {
      const customerKey = sale.customerId
        ? `id-${sale.customerId}`
        : `name-${sale.customerName}`;
      if (customerStats.has(customerKey)) {
        const customer = customerStats.get(customerKey)!;
        customer.visits++;
        customer.totalSpent += sale.totalAmount;
      } else {
        customerStats.set(customerKey, {
          id: customerKey,
          name: sale.customerName,
          phone: sale.customerPhone || "",
          visits: 1,
          totalSpent: sale.totalAmount,
        });
      }
    });

    const topCustomers = Array.from(customerStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 7. กรอง recent bookings (วันนี้)
    const recentBookings = bookings
      .filter((booking) => booking.bookingDate === todayDateYmd)
      .slice(0, 5); // แสดงแค่ 5 รายการล่าสุด

    return NextResponse.json({
      // ข้อมูลสำหรับกราฟและ stats
      sales,
      bookings,

      // Stats สำหรับวันนี้
      todayStats: {
        revenue: todayRevenue,
        dogs: todayDogs,
        cats: todayCats,
        bookings: todayBookingsCount,
      },

      // ข้อมูลสำหรับ components
      topCustomers,
      recentBookings,

      // Metadata
      period,
      dateRange: {
        start: startDateUtc,
        end: endDateUtc,
        bkkStart: todayStartUtc,
        bkkEnd: endDateUtc,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล dashboard ได้" },
      { status: 500 },
    );
  }
}
