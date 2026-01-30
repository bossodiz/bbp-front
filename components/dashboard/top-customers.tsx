"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { formatPhoneDisplay } from "@/lib/utils";
import { useTopCustomers } from "@/lib/hooks/use-top-customers";

export function TopCustomers() {
  const { data: topCustomers, loading } = useTopCustomers();
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
        <CardDescription>
          ลูกค้าที่มายอดเงินมากที่สุด{" "}
          {loading ? "..." : `${topCustomers.length} คน`}
        </CardDescription>
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
