"use client";

import { Fragment, useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Dog,
  Cat,
  Calendar as CalendarIcon,
  DollarSign,
  CalendarDays,
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
import { formatPhoneDisplay, cn } from "@/lib/utils";
import { petTypeLabels } from "@/lib/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Mock service history data
interface ServiceHistory {
  id: number;
  customerId: number;
  date: Date;
  totalAmount: number;
  services: Array<{
    serviceName: string;
    petName: string;
    petType: "DOG" | "CAT";
    price: number;
  }>;
  discount: number;
  deposit: number;
  paymentMethod: string;
}

// Generate mock history data
const generateMockHistory = (): ServiceHistory[] => {
  return [
    {
      id: 1,
      customerId: 1,
      date: new Date("2026-01-25"),
      totalAmount: 1200,
      services: [
        {
          serviceName: "อาบน้ำตัดขน",
          petName: "มะลิ",
          petType: "DOG",
          price: 600,
        },
        { serviceName: "ตัดเล็บ", petName: "มะลิ", petType: "DOG", price: 150 },
        {
          serviceName: "อาบน้ำ",
          petName: "จัสมิน",
          petType: "CAT",
          price: 450,
        },
      ],
      discount: 0,
      deposit: 0,
      paymentMethod: "เงินสด",
    },
    {
      id: 2,
      customerId: 1,
      date: new Date("2026-01-15"),
      totalAmount: 800,
      services: [
        { serviceName: "อาบน้ำ", petName: "มะลิ", petType: "DOG", price: 400 },
        {
          serviceName: "อาบน้ำ",
          petName: "จัสมิน",
          petType: "CAT",
          price: 400,
        },
      ],
      discount: 100,
      deposit: 0,
      paymentMethod: "QR Code",
    },
    {
      id: 3,
      customerId: 2,
      date: new Date("2026-01-20"),
      totalAmount: 650,
      services: [
        {
          serviceName: "อาบน้ำตัดขน",
          petName: "กระต่าย",
          petType: "DOG",
          price: 550,
        },
        {
          serviceName: "ตัดเล็บ",
          petName: "กระต่าย",
          petType: "DOG",
          price: 100,
        },
      ],
      discount: 0,
      deposit: 0,
      paymentMethod: "บัตรเครดิต",
    },
  ];
};

export function ServiceHistoryList() {
  const { customers } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedBill, setSelectedBill] = useState<ServiceHistory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mockHistory = useMemo(() => generateMockHistory(), []);

  const toggleExpand = (customerId: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedIds(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Calculate customer stats
  const customerStats = useMemo(() => {
    return customers.map((customer) => {
      const customerHistory = mockHistory.filter(
        (h) => h.customerId === customer.id,
      );
      const totalSpent = customerHistory.reduce(
        (sum, h) => sum + h.totalAmount,
        0,
      );
      const lastVisit =
        customerHistory.length > 0
          ? new Date(Math.max(...customerHistory.map((h) => h.date.getTime())))
          : null;

      const dogCount = customer.pets.filter((p) => p.type === "DOG").length;
      const catCount = customer.pets.filter((p) => p.type === "CAT").length;

      return {
        customer,
        history: customerHistory.sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        ),
        totalSpent,
        lastVisit,
        dogCount,
        catCount,
      };
    });
  }, [customers, mockHistory]);

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

      // Date filter
      if (dateFilter !== "all" && stat.lastVisit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastVisit = new Date(stat.lastVisit);
        lastVisit.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "today":
            if (lastVisit.getTime() !== today.getTime()) return false;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (lastVisit < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (lastVisit < monthAgo) return false;
            break;
          case "custom":
            if (startDate) {
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              if (lastVisit < start) return false;
            }
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (lastVisit > end) return false;
            }
            break;
        }
      }

      return true;
    });
  }, [customerStats, searchQuery, dateFilter, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = filteredStats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
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

            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">ช่วงเวลา:</span>
              <div className="flex gap-2">
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

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>สัตว์เลี้ยง</TableHead>
                  <TableHead>เข้าใช้บริการล่าสุด</TableHead>
                  <TableHead className="text-right">ยอดเงินทั้งหมด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      ไม่พบข้อมูล
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
                            <div className="flex items-center gap-2">
                              {stat.dogCount > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Dog className="h-3 w-3 text-dog" />
                                  <span>{stat.dogCount}</span>
                                </Badge>
                              )}
                              {stat.catCount > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Cat className="h-3 w-3 text-cat" />
                                  <span>{stat.catCount}</span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stat.lastVisit ? formatDate(stat.lastVisit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(stat.totalSpent)}
                          </TableCell>
                        </TableRow>
                        {stat.history.length > 0 && isExpanded && (
                          <TableRow key={`${stat.customer.id}-details`}>
                            <TableCell colSpan={6} className="bg-muted/20 p-0">
                              <div className="p-4">
                                <h4 className="text-sm font-medium mb-3">
                                  ประวัติการใช้บริการ
                                </h4>
                                <div className="space-y-2">
                                  {stat.history.map((history) => (
                                    <div
                                      key={history.id}
                                      onClick={() => setSelectedBill(history)}
                                      className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                          <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {formatDate(history.date)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {history.services.length} บริการ •{" "}
                                            {history.paymentMethod}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-primary">
                                          {formatCurrency(history.totalAmount)}
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
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                แสดง {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, filteredStats.length)} จาก{" "}
                {filteredStats.length} รายการ
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ),
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
        </CardContent>
      </Card>

      {/* Bill Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>บิลการใช้บริการ</DialogTitle>
            <DialogDescription>
              {selectedBill && formatDate(selectedBill.date)}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">ลูกค้า</p>
                <p className="font-medium">
                  {
                    customers.find((c) => c.id === selectedBill.customerId)
                      ?.name
                  }
                </p>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">รายการบริการ</h4>
                {selectedBill.services.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {service.petType === "DOG" ? (
                        <Dog className="h-4 w-4 text-dog" />
                      ) : (
                        <Cat className="h-4 w-4 text-cat" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {service.serviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.petName} ({petTypeLabels[service.petType]})
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(service.price)}
                    </p>
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
                      selectedBill.services.reduce(
                        (sum, s) => sum + s.price,
                        0,
                      ),
                    )}
                  </span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>ส่วนลด</span>
                    <span>-{formatCurrency(selectedBill.discount)}</span>
                  </div>
                )}
                {selectedBill.deposit > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>หักมัดจำ</span>
                    <span>-{formatCurrency(selectedBill.deposit)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดชำระ</span>
                  <span className="text-primary">
                    {formatCurrency(selectedBill.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ชำระโดย</span>
                  <span>{selectedBill.paymentMethod}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
