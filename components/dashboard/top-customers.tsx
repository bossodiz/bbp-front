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
  const { data: topCustomers, loading } = useTopCustomers(viewType);

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
            <CardTitle>ลูกค้าที่มาใช้บริการบ่อยและสร้างรายได้สูง</CardTitle>
            <CardDescription>
              {loading ? "..." : `รายการ 5 อันดับแรก`}
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
          <div className="text-center py-12 text-muted-foreground">
            ยังไม่มีข้อมูลลูกค้า
          </div>
        ) : (
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-6 text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {customer.customerName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {customer.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer.customerPhone
                      ? formatPhoneDisplay(customer.customerPhone)
                      : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
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
