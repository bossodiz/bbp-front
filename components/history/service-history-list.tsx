"use client";

import { Fragment, useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Dog,
  Cat,
  Calendar as CalendarIcon,
  Loader2,
  RefreshCcw,
  Scissors,
  BedDouble,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  Input,
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@/components/ui";
import { useCustomerStore } from "@/lib/store";
import { useSales } from "@/lib/hooks/use-sales";
import { formatPhoneDisplay, cn, toUtcIsoFromBangkokLocal } from "@/lib/utils";
import {
  petTypeLabels,
  paymentMethodLabels,
  saleTypeLabels,
  itemTypeLabels,
} from "@/lib/types";
import type { Sale, SaleType, ItemType } from "@/lib/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";

function getBangkokMidnightUtc(offsetDays = 0): string {
  const now = new Date();
  const bkk = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return toUtcIsoFromBangkokLocal(
    bkk.getFullYear(),
    bkk.getMonth() + 1,
    bkk.getDate() + offsetDays,
    0,
    0,
    0,
  );
}

export function ServiceHistoryList() {
  const customers = useCustomerStore((s) => s.customers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "week" | "month" | "custom"
  >("today");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [componentError, setComponentError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Calculate date range for API using Bangkok timezone
  const dateRange = useMemo(() => {
    let start: string | undefined;
    let end: string | undefined;

    switch (dateFilter) {
      case "today":
        start = getBangkokMidnightUtc(0);
        end = getBangkokMidnightUtc(1);
        break;

      case "yesterday":
        start = getBangkokMidnightUtc(-1);
        end = getBangkokMidnightUtc(0);
        break;

      case "week":
        start = getBangkokMidnightUtc(-7);
        end = getBangkokMidnightUtc(1);
        break;

      case "month":
        start = getBangkokMidnightUtc(-30);
        end = getBangkokMidnightUtc(1);
        break;

      case "custom":
        if (startDate) {
          const bkk = new Date(
            startDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
          );
          start = toUtcIsoFromBangkokLocal(
            bkk.getFullYear(),
            bkk.getMonth() + 1,
            bkk.getDate(),
            0,
            0,
            0,
          );
        }
        if (endDate) {
          const bkk = new Date(
            endDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
          );
          end = toUtcIsoFromBangkokLocal(
            bkk.getFullYear(),
            bkk.getMonth() + 1,
            bkk.getDate() + 1,
            0,
            0,
            0,
          );
        }
        break;

      // case "all" - don't set start/end
    }

    return { start, end };
  }, [dateFilter, startDate, endDate]);

  const { sales, isLoading, error, refetch } = useSales({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const toggleExpand = (customerId: number) => {
    try {
      const newExpanded = new Set(expandedIds);
      if (newExpanded.has(customerId)) {
        newExpanded.delete(customerId);
      } else {
        newExpanded.add(customerId);
      }
      setExpandedIds(newExpanded);
    } catch (err) {
      setComponentError("เกิดข้อผิดพลาดในการขยายรายการ");
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    try {
      const value = amount || 0;
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
      }).format(value);
    } catch (err) {
      return `฿${amount || 0}`;
    }
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return "ไม่ระบุวันที่";
    }
    // DB stores real UTC → convert to Bangkok local time for display
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }).format(dateObj);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return "ไม่ระบุวันที่";
    }
    // DB stores real UTC → convert to Bangkok local time for display
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(dateObj);
  };

  // Calculate customer stats from sales
  const customerStats = useMemo(() => {
    try {
      const statsMap = new Map<
        number | string,
        {
          customer: any;
          sales: Sale[];
          totalSpent: number;
          lastVisit: Date | null;
          dogCount: number;
          catCount: number;
        }
      >();

      // Build stats directly from sales data
      sales.forEach((sale) => {
        try {
          const customerId = sale.customerId || `unknown-${sale.customerName}`;

          if (!statsMap.has(customerId)) {
            // Find customer from store if available
            const customerFromStore = customers.find(
              (c) => c.id === sale.customerId,
            );

            statsMap.set(customerId, {
              customer: customerFromStore || {
                id: customerId,
                name: sale.customerName || "ไม่ระบุ",
                phone: sale.customerPhone || "",
                pets: [],
              },
              sales: [],
              totalSpent: 0,
              lastVisit: null,
              dogCount:
                customerFromStore?.pets.filter((p) => p.type === "DOG")
                  .length || 0,
              catCount:
                customerFromStore?.pets.filter((p) => p.type === "CAT")
                  .length || 0,
            });
          }

          const stat = statsMap.get(customerId)!;
          stat.sales.push(sale);
          // Gross bill value = payable now + deposit used (if any)
          stat.totalSpent += (sale.totalAmount || 0) + (sale.depositUsed || 0);
          const saleDate =
            typeof sale.createdAt === "string"
              ? new Date(sale.createdAt)
              : sale.createdAt;
          if (
            saleDate &&
            !isNaN(saleDate.getTime()) &&
            (!stat.lastVisit || saleDate > stat.lastVisit)
          ) {
            stat.lastVisit = saleDate;
          }

          // Count unique pets from sale items
          const uniquePets = new Set<string>();
          (sale.items || []).forEach((item) => {
            if (item.petId) {
              uniquePets.add(`${item.petType}-${item.petId}`);
              if (item.petType === "DOG" && stat.dogCount === 0) {
                stat.dogCount++;
              } else if (item.petType === "CAT" && stat.catCount === 0) {
                stat.catCount++;
              }
            }
          });
        } catch (saleErr) {
          // Error processing sale, skip it
        }
      });

      // Convert map to array and sort by most recent visit first
      const result = Array.from(statsMap.values()).sort((a, b) => {
        // Sort by most recent visit first
        if (a.lastVisit && b.lastVisit) {
          return b.lastVisit.getTime() - a.lastVisit.getTime();
        }
        if (a.lastVisit) return -1;
        if (b.lastVisit) return 1;
        return b.totalSpent - a.totalSpent;
      });

      return result;
    } catch (err) {
      setComponentError("เกิดข้อผิดพลาดในการคำนวณสถิติลูกค้า");
      return [];
    }
  }, [customers, sales]);

  // Filter customers
  const filteredStats = useMemo(() => {
    return customerStats.filter((stat) => {
      // Text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          stat.customer.name.toLowerCase().includes(query) ||
          stat.customer.phone.includes(searchQuery);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [customerStats, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = filteredStats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCustomers = filteredStats.length;
    const totalVisits = filteredStats.reduce(
      (sum, stat) => sum + stat.sales.length,
      0,
    );
    const totalRevenue = filteredStats.reduce(
      (sum, stat) => sum + stat.totalSpent,
      0,
    );

    return {
      totalCustomers,
      totalVisits,
      totalRevenue,
    };
  }, [filteredStats]);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อลูกค้าหรือเบอร์โทร..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCcw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </div>

            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">ช่วงเวลา:</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={dateFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter("today");
                    setCurrentPage(1);
                  }}
                >
                  วันนี้
                </Button>
                <Button
                  variant={dateFilter === "yesterday" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter("yesterday");
                    setCurrentPage(1);
                  }}
                >
                  เมื่อวาน
                </Button>
                <Button
                  variant={dateFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter("week");
                    setCurrentPage(1);
                  }}
                >
                  7 วันล่าสุด
                </Button>
                <Button
                  variant={dateFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter("month");
                    setCurrentPage(1);
                  }}
                >
                  30 วันล่าสุด
                </Button>
                <Button
                  variant={dateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("custom")}
                >
                  กำหนดเอง
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">จาก:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-50 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP", { locale: th })
                        ) : (
                          <span className="text-muted-foreground">
                            เลือกวันที่
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ถึง:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-50 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP", { locale: th })
                        ) : (
                          <span className="text-muted-foreground">
                            เลือกวันที่
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {(error || componentError) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">
                {error || componentError}
              </p>
              {componentError && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setComponentError(null);
                    window.location.reload();
                  }}
                >
                  รีเฟรชหน้า
                </Button>
              )}
            </div>
          )}

          {/* Table */}
          {!isLoading && !(error || componentError) && (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ชื่อลูกค้า</TableHead>
                      <TableHead>เบอร์โทร</TableHead>
                      <TableHead>จำนวนการเข้าใช้บริการ</TableHead>
                      <TableHead>เข้าใช้บริการล่าสุด</TableHead>
                      <TableHead className="text-right">
                        ยอดเงินทั้งหมด
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchQuery.trim()
                            ? "ไม่พบลูกค้าที่ค้นหา"
                            : "ยังไม่มีประวัติการใช้บริการ"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStats.map((stat) => {
                        const isExpanded = expandedIds.has(stat.customer.id);
                        return (
                          <Fragment key={stat.customer.id}>
                            <TableRow
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => toggleExpand(stat.customer.id)}
                            >
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {stat.customer.name}
                              </TableCell>
                              <TableCell>
                                {formatPhoneDisplay(stat.customer.phone)}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {stat.sales.length} ครั้ง
                                </span>
                              </TableCell>
                              <TableCell>
                                {stat.lastVisit
                                  ? formatDate(stat.lastVisit)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(stat.totalSpent)}
                              </TableCell>
                            </TableRow>
                            {stat.sales.length > 0 && isExpanded && (
                              <TableRow key={`${stat.customer.id}-details`}>
                                <TableCell
                                  colSpan={6}
                                  className="bg-muted/20 p-0"
                                >
                                  <div className="p-4">
                                    <h4 className="text-sm font-medium mb-3">
                                      ประวัติการใช้บริการ
                                    </h4>
                                    <div className="space-y-2">
                                      {stat.sales.map((sale) => (
                                        <div
                                          key={sale.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBill(sale);
                                          }}
                                          className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-colors"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                                sale.saleType === "HOTEL"
                                                  ? "bg-chart-2/10 text-chart-2"
                                                  : sale.saleType === "PRODUCT"
                                                    ? "bg-chart-3/10 text-chart-3"
                                                    : "bg-primary/10 text-primary",
                                              )}
                                            >
                                              {sale.saleType === "HOTEL" ? (
                                                <BedDouble className="h-5 w-5" />
                                              ) : sale.saleType ===
                                                "PRODUCT" ? (
                                                <Package className="h-5 w-5" />
                                              ) : (
                                                <Scissors className="h-5 w-5" />
                                              )}
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">
                                                  {formatDateTime(
                                                    sale.createdAt,
                                                  )}
                                                </p>
                                                {(() => {
                                                  const itemTypes = new Set(
                                                    (sale.items || [])
                                                      .map(
                                                        (item) => item.itemType,
                                                      )
                                                      .filter(Boolean),
                                                  );
                                                  return Array.from(
                                                    itemTypes,
                                                  ).map((type) => (
                                                    <Badge
                                                      key={type}
                                                      variant="outline"
                                                      className="text-xs px-1.5 py-0"
                                                    >
                                                      {
                                                        itemTypeLabels[
                                                          type as ItemType
                                                        ]
                                                      }
                                                    </Badge>
                                                  ));
                                                })()}
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                {(sale.items || []).length}{" "}
                                                รายการ •{" "}
                                                {paymentMethodLabels[
                                                  sale.paymentMethod
                                                ] || sale.paymentMethod}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-semibold text-primary">
                                              {formatCurrency(
                                                (sale.totalAmount || 0) +
                                                  (sale.depositUsed || 0),
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={3} className="font-bold text-base">
                        สรุปทั้งหมด
                      </TableCell>
                      <TableCell className="font-bold text-base">
                        {summaryStats.totalVisits} ครั้ง
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {summaryStats.totalCustomers} ลูกค้า
                      </TableCell>
                      <TableCell className="text-right font-bold text-base text-primary">
                        {formatCurrency(summaryStats.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    แสดง {startIndex + 1}-
                    {Math.min(startIndex + itemsPerPage, filteredStats.length)}{" "}
                    จาก {filteredStats.length} รายการ
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      ก่อนหน้า
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              className="w-8"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        },
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bill Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>บิลการใช้บริการ</DialogTitle>
            <DialogDescription>
              {selectedBill &&
                (() => {
                  try {
                    return formatDateTime(selectedBill.createdAt);
                  } catch {
                    return "ไม่ระบุวันที่";
                  }
                })()}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">ลูกค้า</p>
                <p className="font-medium">
                  {selectedBill.customerName}
                  {selectedBill.customerPhone && (
                    <> ({formatPhoneDisplay(selectedBill.customerPhone)})</>
                  )}
                </p>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">รายการ</h4>
                  <Badge variant="outline" className="text-xs">
                    {saleTypeLabels[selectedBill.saleType as SaleType] ||
                      "บริการ"}
                  </Badge>
                </div>
                {(selectedBill.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {item.petType && (
                        <>
                          {item.petType === "DOG" ? (
                            <Dog className="h-4 w-4 text-dog" />
                          ) : (
                            <Cat className="h-4 w-4 text-cat" />
                          )}
                        </>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {item.serviceName}
                        </p>
                        <div className="flex items-center gap-1">
                          {item.petName && (
                            <p className="text-xs text-muted-foreground">
                              {item.petName}
                              {item.petType &&
                                ` (${petTypeLabels[item.petType]})`}
                            </p>
                          )}
                          {item.itemType && item.itemType !== "SERVICE" && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              {itemTypeLabels[item.itemType as ItemType]}
                            </Badge>
                          )}
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.isPriceModified && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.originalPrice)}
                        </p>
                      )}
                      <p className="text-sm font-medium">
                        {formatCurrency(item.finalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ยอดรวม</span>
                  <span>
                    {formatCurrency(
                      (selectedBill.totalAmount || 0) +
                        (selectedBill.depositUsed || 0),
                    )}
                  </span>
                </div>
                {selectedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>ส่วนลดโปรโมชั่น</span>
                    <span>-{formatCurrency(selectedBill.discountAmount)}</span>
                  </div>
                )}
                {selectedBill.customDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>ส่วนลดเพิ่มเติม</span>
                    <span>-{formatCurrency(selectedBill.customDiscount)}</span>
                  </div>
                )}
                {selectedBill.depositUsed > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>หักมัดจำ</span>
                    <span>-{formatCurrency(selectedBill.depositUsed)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดชำระเพิ่ม</span>
                  <span className="text-primary">
                    {formatCurrency(selectedBill.totalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ชำระโดย</span>
                  <span>
                    {paymentMethodLabels[selectedBill.paymentMethod] ||
                      selectedBill.paymentMethod}
                  </span>
                </div>
                {selectedBill.paymentMethod === "CASH" &&
                  selectedBill.cashReceived && (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>รับเงินมา</span>
                        <span>{formatCurrency(selectedBill.cashReceived)}</span>
                      </div>
                      {selectedBill.change && selectedBill.change > 0 && (
                        <div className="flex justify-between text-xs text-success">
                          <span>เงินทอน</span>
                          <span>{formatCurrency(selectedBill.change)}</span>
                        </div>
                      )}
                    </>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
