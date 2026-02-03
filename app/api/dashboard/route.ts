import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dashboard - ดึงข้อมูล dashboard ครบถ้วน
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "weekly"; // weekly, monthly, yearly

    // คำนวณ date range ตาม period (ข้อมูลใน DB เป็น UTC+7 อยู่แล้ว)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // tomorrow

    switch (period) {
      case "weekly":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case "monthly":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        break;
      case "yearly":
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
    }

    // 1. ดึงข้อมูล sales
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (
          *,
          pets (id, name, type)
        )
      `,
      )
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    // 2. ดึงข้อมูล bookings (เฉพาะ PENDING)
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        booking_pets (
          pet_id,
          service_type,
          pets (id, name, type, breed, breed_2, is_mixed_breed)
        )
      `,
      )
      .eq("status", "PENDING")
      .gte("booking_date", startDate.toISOString().split("T")[0])
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (bookingsError) throw bookingsError;

    // 3. Process sales data
    const sales = salesData.map((sale) => ({
      id: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name,
      customerPhone: sale.customer_phone,
      totalAmount: parseFloat(sale.total_amount),
      items: sale.sale_items.map((item: any) => ({
        id: item.id,
        petId: item.pet_id,
        petType: item.pet_type,
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
      customerName: booking.customer_name,
      phone: booking.phone,
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
      serviceType: booking.service_type,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      note: booking.note,
      depositAmount: parseFloat(booking.deposit_amount || 0),
      depositStatus: booking.deposit_status,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    }));

    // 5. คำนวณ stats สำหรับวันนี้ (ข้อมูลใน DB เป็น UTC+7 อยู่แล้ว)
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const { data: todaySalesData } = await supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (*)
      `,
      )
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", todayEnd.toISOString());

    const { data: todayBookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "PENDING")
      .eq("booking_date", today.toISOString().split("T")[0]);

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
      return item?.pet_type === "DOG";
    }).length;

    const todayCats = Array.from(todayPets).filter((petId) => {
      const sale = todaySalesData?.find((s) =>
        s.sale_items.some((item: any) => item.pet_id === petId),
      );
      const item = sale?.sale_items.find((item: any) => item.pet_id === petId);
      return item?.pet_type === "CAT";
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
      .filter((booking) => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate >= today && bookingDate < todayEnd;
      })
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
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        bkkStart: today.toISOString(),
        bkkEnd: todayEnd.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล dashboard ได้" },
      { status: 500 },
    );
  }
}
