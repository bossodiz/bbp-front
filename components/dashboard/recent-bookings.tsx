"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dog, Cat, Clock, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Mock data - จะเปลี่ยนเป็นข้อมูลจริงจาก database ภายหลัง
const recentBookings = [
  {
    id: 1,
    customerName: "คุณสมชาย ใจดี",
    phone: "081-234-5678",
    petName: "โกลเด้น",
    petType: "DOG" as const,
    serviceType: "อาบน้ำ + ตัดขน",
    bookingTime: "10:00",
    depositAmount: 300,
    depositStatus: "HELD" as const,
    notes: "ตัดขนสั้นมาก ไม่ชอบโดนเป่าขน",
  },
  {
    id: 2,
    customerName: "คุณสมหญิง รักสัตว์",
    phone: "082-345-6789",
    petName: "มิ้นท์",
    petType: "CAT" as const,
    serviceType: "อาบน้ำ",
    bookingTime: "11:30",
    depositAmount: 0,
    depositStatus: "NONE" as const,
    notes: "",
  },
  {
    id: 3,
    customerName: "คุณมานี มีสุข",
    phone: "083-456-7890",
    petName: "บราวนี่",
    petType: "DOG" as const,
    serviceType: "ตัดขน",
    bookingTime: "13:00",
    depositAmount: 500,
    depositStatus: "HELD" as const,
    notes: "มีปัญหาผิวหนัง ใช้แชมพูสูตรอ่อนโยน",
  },
  {
    id: 4,
    customerName: "คุณวิชัย สบายใจ",
    phone: "084-567-8901",
    petName: "ปุยฝ้าย",
    petType: "DOG" as const,
    serviceType: "อาบน้ำ + ตัดขน",
    bookingTime: "14:30",
    depositAmount: 0,
    depositStatus: "NONE" as const,
    notes: "",
  },
  {
    id: 5,
    customerName: "คุณสุดา พิมพ์ใจ",
    phone: "085-678-9012",
    petName: "ส้มโอ",
    petType: "CAT" as const,
    serviceType: "อาบน้ำ",
    bookingTime: "16:00",
    depositAmount: 200,
    depositStatus: "HELD" as const,
    notes: "ขี้กลัว ต้องค่อยๆ ทำ",
  },
];

const depositStatusMap = {
  NONE: { label: "ไม่มีมัดจำ", variant: "secondary" as const },
  HELD: { label: "มีมัดจำ", variant: "default" as const },
  USED: { label: "ใช้แล้ว", variant: "outline" as const },
  FORFEITED: { label: "ยึดมัดจำ", variant: "destructive" as const },
};

export function RecentBookings() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>นัดหมายวันนี้</CardTitle>
          <CardDescription>รายการนัดหมายที่รอรับบริการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                    booking.petType === "DOG"
                      ? "bg-dog/10 text-dog"
                      : "bg-cat/10 text-cat"
                  )}
                >
                  {booking.petType === "DOG" ? (
                    <Dog className="h-5 w-5" />
                  ) : (
                    <Cat className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {booking.petName}
                    </p>
                    {booking.depositStatus !== "NONE" && (
                      <Badge
                        variant={depositStatusMap[booking.depositStatus].variant}
                        className="text-xs"
                      >
                        {formatCurrency(booking.depositAmount)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {booking.customerName} - {booking.serviceType}
                  </p>
                  {booking.notes && (
                    <div className="flex items-start gap-1 mt-1.5 text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{booking.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                  <span>{booking.bookingTime}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
