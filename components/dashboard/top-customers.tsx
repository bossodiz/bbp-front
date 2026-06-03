"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatPhoneDisplay } from "@/lib/utils";
import {
  useTopCustomers,
  CustomerViewType,
} from "@/lib/hooks/use-top-customers";

export function TopCustomers() {
  const [viewType, setViewType] = useState<CustomerViewType>("frequent_visits");
  const { data, loading } = useTopCustomers(viewType);
  const topCustomers = Array.isArray(data) ? data : [];

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
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>ลูกค้าสำคัญ</CardTitle>
            <CardDescription>
              {loading ? "กำลังโหลด..." : `ทั้งหมด ${topCustomers.length} รายการ`}
            </CardDescription>
          </div>
          <Select
            value={viewType}
            onValueChange={(value) => setViewType(value as CustomerViewType)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequent_visits">มาใช้บริการบ่อย</SelectItem>
              <SelectItem value="high_revenue">สร้างรายได้สูง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : topCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">ยังไม่มีข้อมูลลูกค้า</p>
            <p className="text-xs mt-1">เริ่มต้นโดยการสร้างการจองหรือขายสินค้า</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {customer.customerName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    title={customer.customerName}
                  >
                    {customer.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.customerPhone
                      ? formatPhoneDisplay(customer.customerPhone)
                      : "ไม่มีข้อมูล"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer.visitCount} ครั้ง
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
