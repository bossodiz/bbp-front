"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPhoneDisplay } from "@/lib/utils";

// Mock data - จะเปลี่ยนเป็นข้อมูลจริงจาก database ภายหลัง
const topCustomers = [
  {
    id: 1,
    name: "คุณสมชาย ใจดี",
    phone: "081-234-5678",
    visits: 15,
    totalSpent: 12500,
    pets: ["มิกกี้", "โมจิ"],
  },
  {
    id: 2,
    name: "คุณสมหญิง รักสัตว์",
    phone: "082-345-6789",
    visits: 12,
    totalSpent: 9800,
    pets: ["ลัคกี้"],
  },
  {
    id: 3,
    name: "คุณมานี มีสุข",
    phone: "083-456-7890",
    visits: 10,
    totalSpent: 8200,
    pets: ["ทองดี", "เงินงาม"],
  },
  {
    id: 4,
    name: "คุณวิชัย สบายใจ",
    phone: "084-567-8901",
    visits: 8,
    totalSpent: 6500,
    pets: ["บีบี้"],
  },
  {
    id: 5,
    name: "คุณสุดา พิมพ์ใจ",
    phone: "085-678-9012",
    visits: 7,
    totalSpent: 5800,
    pets: ["มีมี่", "นีโม่"],
  },
];

export function TopCustomers() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ลูกค้าประจำ</CardTitle>
        <CardDescription>ลูกค้าที่มาใช้บริการบ่อยที่สุด</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCustomers.map((customer, index) => (
            <div
              key={customer.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-center w-6 text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {customer.name.charAt(3)}
                  {customer.name.charAt(4)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPhoneDisplay(customer.phone)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(customer.totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.visits} ครั้ง
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
