"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { useCustomers } from "@/lib/hooks/use-customers";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { customers, loading, error, fetchCustomers } = useCustomers();

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchCustomers(searchQuery);
      } else {
        fetchCustomers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            ลูกค้าและสัตว์เลี้ยง
          </h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลลูกค้าและสัตว์เลี้ยง
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มลูกค้าใหม่
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, หรือชื่อสัตว์เลี้ยง..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <CustomerList
        customers={customers}
        loading={loading}
        onRefresh={fetchCustomers}
      />

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => fetchCustomers()}
      />
    </div>
  );
}
