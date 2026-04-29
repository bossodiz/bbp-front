"use client";

import { Fragment, useState, useMemo, useRef } from "react";
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
  Pencil,
  CalendarClock,
  Printer,
  Download,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCustomerStore } from "@/lib/store";
import { useSales } from "@/lib/hooks/use-sales";
import {
  formatPhoneDisplay,
  cn,
  toUtcIsoFromBangkokLocal,
  convertUTCToBangkok,
} from "@/lib/utils";
import {
  petTypeLabels,
  paymentMethodLabels,
  saleTypeLabels,
  itemTypeLabels,
} from "@/lib/types";
import type { Sale, SaleType, ItemType } from "@/lib/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

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
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const customers = useCustomerStore((s) => s.customers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "week" | "month" | "custom"
  >("today");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [isEditingBillDate, setIsEditingBillDate] = useState(false);
  const [billDate, setBillDate] = useState<Date | null>(null);
  const [billDateOpen, setBillDateOpen] = useState(false);
  const [isSavingBillDate, setIsSavingBillDate] = useState(false);
  const [isExportingReceipt, setIsExportingReceipt] = useState(false);
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

  const toBangkokDateTime = (date: Date | string) => convertUTCToBangkok(date);

  const isSameDay = (left: Date, right: Date) => {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  };

  const resetBillDateEditor = () => {
    setIsEditingBillDate(false);
    setBillDate(null);
    setBillDateOpen(false);
    setIsSavingBillDate(false);
  };

  const handleBillDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedBill(null);
      resetBillDateEditor();
    }
  };

  const startEditingBillDate = () => {
    if (!selectedBill) return;
    setBillDate(toBangkokDateTime(selectedBill.createdAt));
    setIsEditingBillDate(true);
    setBillDateOpen(true);
  };

  const cancelEditingBillDate = () => {
    setIsEditingBillDate(false);
    setBillDate(
      selectedBill ? toBangkokDateTime(selectedBill.createdAt) : null,
    );
    setBillDateOpen(false);
  };

  const handleSaveBillDate = async () => {
    if (!selectedBill || !billDate) {
      toast.error("กรุณาระบุวันที่และเวลา");
      return;
    }

    setIsSavingBillDate(true);

    try {
      const saleDate = toUtcIsoFromBangkokLocal(
        billDate.getFullYear(),
        billDate.getMonth() + 1,
        billDate.getDate(),
        billDate.getHours(),
        billDate.getMinutes(),
        0,
      );
      const response = await fetch(`/api/sales/${selectedBill.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ saleDate }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถแก้ไขวันที่และเวลาได้");
      }

      const updatedCreatedAt = result.data?.createdAt || saleDate;
      setSelectedBill({
        ...selectedBill,
        createdAt: updatedCreatedAt,
      });
      setBillDate(toBangkokDateTime(updatedCreatedAt));
      setBillDateOpen(false);
      setIsEditingBillDate(false);
      await refetch();
      toast.success("บันทึกวันที่และเวลาสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถแก้ไขวันที่และเวลาได้");
    } finally {
      setIsSavingBillDate(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedBill || !receiptRef.current) {
      toast.error("ไม่พบข้อมูลใบเสร็จสำหรับพิมพ์");
      return;
    }

    const printWindow = window.open("", "_blank", "width=420,height=720");

    if (!printWindow) {
      toast.error("ไม่สามารถเปิดหน้าต่างพิมพ์ได้");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${selectedBill.id}</title>
          <style>
            body {
              font-family: "Prompt", "Segoe UI", sans-serif;
              background: #f6f4ef;
              margin: 0;
              padding: 24px;
              color: #18181b;
            }
            .print-shell {
              display: flex;
              justify-content: center;
            }
            .receipt-card {
              width: 320px;
              background: #ffffff;
              border: 1px solid #d6d3d1;
              border-radius: 20px;
              padding: 18px;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .receipt-card {
                border: none;
                box-shadow: none;
                border-radius: 0;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-shell">
            <div class="receipt-card">${receiptRef.current.innerHTML}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const cloneNodeWithInlineStyles = (sourceNode: HTMLElement) => {
    const clonedNode = sourceNode.cloneNode(true) as HTMLElement;

    const syncStyles = (source: Element, target: Element) => {
      if (
        !(source instanceof HTMLElement) ||
        !(target instanceof HTMLElement)
      ) {
        return;
      }

      const computedStyle = window.getComputedStyle(source);
      const styleText = Array.from(computedStyle)
        .map(
          (property) =>
            `${property}:${computedStyle.getPropertyValue(property)};`,
        )
        .join("");

      target.setAttribute("style", styleText);

      const sourceChildren = Array.from(source.children);
      const targetChildren = Array.from(target.children);

      sourceChildren.forEach((child, index) => {
        const targetChild = targetChildren[index];
        if (targetChild) {
          syncStyles(child, targetChild);
        }
      });
    };

    syncStyles(sourceNode, clonedNode);
    return clonedNode;
  };

  const getReceiptImageBlob = async () => {
    if (!receiptRef.current) {
      throw new Error("ไม่พบใบเสร็จสำหรับสร้างรูปภาพ");
    }

    const receiptElement = receiptRef.current;
    const clonedReceipt = cloneNodeWithInlineStyles(receiptElement);
    const width = receiptElement.offsetWidth;
    const height = receiptElement.offsetHeight;

    clonedReceipt.style.margin = "0";

    const serializedReceipt = new XMLSerializer().serializeToString(
      clonedReceipt,
    );
    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${serializedReceipt}</div>
        </foreignObject>
      </svg>
    `;
    const svgBlob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });

    return svgBlob;
  };

  const handleDownloadReceiptImage = async () => {
    if (!selectedBill) {
      toast.error("ไม่พบข้อมูลใบเสร็จ");
      return;
    }

    setIsExportingReceipt(true);

    try {
      const blob = await getReceiptImageBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `receipt-${selectedBill.id}.svg`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("ดาวน์โหลดรูปใบเสร็จแล้ว");
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถดาวน์โหลดรูปใบเสร็จได้");
    } finally {
      setIsExportingReceipt(false);
    }
  };

  const handleCopyReceiptImage = async () => {
    if (!selectedBill) {
      toast.error("ไม่พบข้อมูลใบเสร็จ");
      return;
    }

    if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") {
      toast.error("เบราว์เซอร์นี้ยังไม่รองรับการคัดลอกรูปภาพ");
      return;
    }

    setIsExportingReceipt(true);

    try {
      const blob = await getReceiptImageBlob();
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/svg+xml": blob,
        }),
      ]);
      toast.success("คัดลอกรูปใบเสร็จแล้ว");
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถคัดลอกรูปใบเสร็จได้");
    } finally {
      setIsExportingReceipt(false);
    }
  };

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
      <Dialog open={!!selectedBill} onOpenChange={handleBillDialogChange}>
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
              <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">วันที่และเวลาทำรายการ</p>
                    <p className="text-xs text-muted-foreground">
                      แก้ไขเวลาบันทึกรายการย้อนหลังได้
                    </p>
                  </div>
                  {!isEditingBillDate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startEditingBillDate}
                    >
                      <Pencil className="h-4 w-4" />
                      แก้ไข
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingBillDate}
                      disabled={isSavingBillDate}
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>

                {isEditingBillDate ? (
                  billDate && (
                    <Popover open={billDateOpen} onOpenChange={setBillDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-between px-3 text-sm",
                            !isSameDay(
                              billDate,
                              toBangkokDateTime(new Date()),
                            ) && "border-warning/50 bg-warning/10 text-warning",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            {isSameDay(billDate, toBangkokDateTime(new Date()))
                              ? "วันนี้"
                              : format(billDate, "dd/MM/yy HH:mm", {
                                  locale: th,
                                })}
                          </span>
                          {isSavingBillDate ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="border-b p-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            ปรับวันที่และเวลาทำรายการ
                          </p>
                          <p className="mt-0.5 text-xs font-semibold">
                            {format(billDate, "d MMM yyyy HH:mm", {
                              locale: th,
                            })}
                          </p>
                        </div>
                        <Calendar
                          mode="single"
                          selected={billDate}
                          onSelect={(date) => {
                            if (!date) return;
                            const updated = new Date(date);
                            updated.setHours(
                              billDate.getHours(),
                              billDate.getMinutes(),
                              0,
                              0,
                            );
                            setBillDate(updated);
                          }}
                          initialFocus
                        />
                        <div className="space-y-2 border-t p-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            เวลา
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={23}
                                value={String(billDate.getHours()).padStart(
                                  2,
                                  "0",
                                )}
                                onChange={(e) => {
                                  const hours = Math.max(
                                    0,
                                    Math.min(23, Number(e.target.value)),
                                  );
                                  const updated = new Date(billDate);
                                  updated.setHours(hours);
                                  setBillDate(updated);
                                }}
                                className="h-8 w-14 text-center text-sm tabular-nums"
                              />
                              <span className="font-bold text-muted-foreground">
                                :
                              </span>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                value={String(billDate.getMinutes()).padStart(
                                  2,
                                  "0",
                                )}
                                onChange={(e) => {
                                  const minutes = Math.max(
                                    0,
                                    Math.min(59, Number(e.target.value)),
                                  );
                                  const updated = new Date(billDate);
                                  updated.setMinutes(minutes);
                                  setBillDate(updated);
                                }}
                                className="h-8 w-14 text-center text-sm tabular-nums"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="h-8 flex-1 text-xs"
                              onClick={handleSaveBillDate}
                              disabled={isSavingBillDate}
                            >
                              {isSavingBillDate ? "กำลังบันทึก..." : "ยืนยัน"}
                            </Button>
                          </div>
                          {!isSameDay(
                            billDate,
                            toBangkokDateTime(new Date()),
                          ) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-full text-xs"
                              onClick={() => {
                                setBillDate(toBangkokDateTime(new Date()));
                                setBillDateOpen(false);
                              }}
                            >
                              กลับเป็นวันนี้
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )
                ) : (
                  <p className="text-sm font-medium">
                    {formatDateTime(selectedBill.createdAt)}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border bg-gradient-to-b from-background to-muted/30 p-3">
                <div
                  ref={receiptRef}
                  className="mx-auto w-full max-w-[320px] rounded-2xl border border-border/80 bg-white p-4 text-black shadow-sm"
                >
                  <div className="mb-4 text-center">
                    <p className="text-lg font-semibold tracking-tight">
                      Bloom Bloom Paw
                    </p>
                    <p className="text-xs text-neutral-500">ใบเสร็จรับเงิน</p>
                  </div>

                  <div className="space-y-1 border-b border-dashed border-neutral-300 pb-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">เลขที่</span>
                      <span className="font-medium">#{selectedBill.id}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">วันที่</span>
                      <span>
                        {format(selectedBill.createdAt, "dd/MM/yyyy", {
                          locale: th,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-dashed border-neutral-300 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">ลูกค้า</span>
                      <span className="max-w-[180px] text-right font-medium">
                        {selectedBill.customerName || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">เบอร์โทร</span>
                      <span>
                        {selectedBill.customerPhone
                          ? formatPhoneDisplay(selectedBill.customerPhone)
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="py-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      <span>รายการ</span>
                      <span>ราคา</span>
                    </div>
                    <div className="space-y-2">
                      {(selectedBill.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {item.petType === "DOG" ? (
                                <Dog className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                              ) : item.petType === "CAT" ? (
                                <Cat className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                              ) : null}
                              <p className="truncate font-medium">
                                {item.serviceName}
                              </p>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 pl-5 text-[11px] text-neutral-500">
                              {item.petName ? (
                                <span>
                                  {item.petName}
                                  {item.petType
                                    ? ` (${petTypeLabels[item.petType]})`
                                    : ""}
                                </span>
                              ) : null}
                              {item.itemType && item.itemType !== "SERVICE" ? (
                                <span>
                                  • {itemTypeLabels[item.itemType as ItemType]}
                                </span>
                              ) : null}
                              {item.quantity > 1 ? (
                                <span>• x{item.quantity}</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            {item.isPriceModified ? (
                              <p className="text-[11px] text-neutral-400 line-through">
                                {formatCurrency(item.originalPrice)}
                              </p>
                            ) : null}
                            <p className="font-medium">
                              {formatCurrency(item.finalPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-dashed border-neutral-300 pt-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">ยอดรวม</span>
                      <span>
                        {formatCurrency(
                          (selectedBill.totalAmount || 0) +
                            (selectedBill.depositUsed || 0),
                        )}
                      </span>
                    </div>
                    {selectedBill.discountAmount > 0 ? (
                      <div className="flex justify-between gap-3 text-emerald-700">
                        <span>ส่วนลดโปรโมชั่น</span>
                        <span>
                          -{formatCurrency(selectedBill.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                    {selectedBill.customDiscount > 0 ? (
                      <div className="flex justify-between gap-3 text-emerald-700">
                        <span>ส่วนลดเพิ่มเติม</span>
                        <span>
                          -{formatCurrency(selectedBill.customDiscount)}
                        </span>
                      </div>
                    ) : null}
                    {selectedBill.depositUsed > 0 ? (
                      <div className="flex justify-between gap-3 text-sky-700">
                        <span>หักมัดจำ</span>
                        <span>-{formatCurrency(selectedBill.depositUsed)}</span>
                      </div>
                    ) : null}
                    <div className="mt-2 flex justify-between gap-3 border-t border-neutral-200 pt-2 text-base font-semibold">
                      <span>ยอดชำระเพิ่ม</span>
                      <span>
                        {formatCurrency(selectedBill.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-neutral-500">ชำระโดย</span>
                      <span>
                        {paymentMethodLabels[selectedBill.paymentMethod] ||
                          selectedBill.paymentMethod}
                      </span>
                    </div>
                    {selectedBill.paymentMethod === "CASH" &&
                    selectedBill.cashReceived ? (
                      <>
                        <div className="flex justify-between gap-3 text-xs text-neutral-500">
                          <span>รับเงินมา</span>
                          <span>
                            {formatCurrency(selectedBill.cashReceived)}
                          </span>
                        </div>
                        {selectedBill.change && selectedBill.change > 0 ? (
                          <div className="flex justify-between gap-3 text-xs text-emerald-700">
                            <span>เงินทอน</span>
                            <span>{formatCurrency(selectedBill.change)}</span>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <div className="mt-4 border-t border-dashed border-neutral-300 pt-3 text-center text-xs text-neutral-500">
                    <p className="font-medium text-neutral-700">
                      ขอบคุณที่ใช้บริการ
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrintReceipt}
                    disabled={isExportingReceipt}
                  >
                    <Printer className="h-4 w-4" />
                    พิมพ์ใบเสร็จ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadReceiptImage}
                    disabled={isExportingReceipt}
                  >
                    <Download className="h-4 w-4" />
                    ดาวน์โหลดรูป
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleCopyReceiptImage}
                    disabled={isExportingReceipt}
                  >
                    {isExportingReceipt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    คัดลอกรูป
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
