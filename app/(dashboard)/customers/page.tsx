"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { useCustomers } from "@/lib/hooks/use-customers";

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { customers, loading, error, fetchCustomers } = useCustomers();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers(submittedQuery || undefined);
    setCurrentPage(1);
  }, [submittedQuery, fetchCustomers]);

  const handleSearch = () => {
    setSubmittedQuery(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            ลูกค้าและสัตว์เลี้ยง
          </h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลลูกค้าและสัตว์เลี้ยง
            {!loading && ` (${customers.length} รายการ)`}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มลูกค้าใหม่
        </Button>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, หรือชื่อสัตว์เลี้ยง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          ค้นหา
        </Button>
        {submittedQuery && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSubmittedQuery("");
            }}
          >
            ล้าง
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <CustomerList
        customers={paginatedCustomers}
        loading={loading}
        onRefresh={() => fetchCustomers(submittedQuery || undefined)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalCount={customers.length}
      />

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => fetchCustomers(submittedQuery || undefined)}
      />
    </div>
  );
}
