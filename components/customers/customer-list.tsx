"use client";

import { useState, Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  Dog,
  Cat,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
import { CustomerDialog } from "./customer-dialog";
import { PetDialog } from "./pet-dialog";
import { useCustomers } from "@/lib/hooks/use-customers";
import type { Customer, Pet } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { cn, formatPhoneDisplay } from "@/lib/utils";
import { formatBreedDisplay } from "@/lib/utils/pet-utils";
import { toast } from "sonner";

interface CustomerListProps {
  customers: Customer[];
  loading?: boolean;
  onRefresh?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
}

export function CustomerList({
  customers,
  loading,
  onRefresh,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalCount,
}: CustomerListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingPet, setEditingPet] = useState<{
    customerId: number;
    pet: Pet | null;
  } | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );
  const [deletingPet, setDeletingPet] = useState<{
    customerId: number;
    pet: Pet;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { deleteCustomer, deletePet } = useCustomers();

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDeleteCustomer = async () => {
    if (deletingCustomer) {
      try {
        setIsDeleting(true);
        await deleteCustomer(deletingCustomer.id);
        toast.success("ลบลูกค้าเรียบร้อยแล้ว");
        setDeletingCustomer(null);
        onRefresh?.();
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeletePet = async () => {
    if (deletingPet) {
      try {
        setIsDeleting(true);
        await deletePet(deletingPet.pet.id);
        toast.success("ลบสัตว์เลี้ยงเรียบร้อยแล้ว");
        setDeletingPet(null);
        onRefresh?.();
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!loading && customers.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">ไม่พบข้อมูลลูกค้า</p>
          </CardContent>
        </Card>
        {/* Dialogs */}
        <CustomerDialog
          open={editingCustomer !== null}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          customer={editingCustomer}
          onSuccess={() => onRefresh?.()}
        />
        <PetDialog
          open={editingPet !== null}
          onOpenChange={(open) => !open && setEditingPet(null)}
          customerId={editingPet?.customerId ?? 0}
          pet={editingPet?.pet}
          onSuccess={() => onRefresh?.()}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <div className="rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>สัตว์เลี้ยง</TableHead>
                <TableHead className="text-right w-24">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <div className="h-10 rounded bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                : customers.map((customer) => {
                    const isExpanded = expandedIds.has(customer.id);
                    return (
                      <Fragment key={customer.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => toggleExpand(customer.id)}
                        >
                          <TableCell className="py-3">
                            <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="py-3 font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhoneDisplay(customer.phone)}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {customer.pets.length === 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              ) : (
                                customer.pets.map((pet) => (
                                  <Badge
                                    key={pet.id}
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      pet.type === "DOG"
                                        ? "bg-dog/10 text-dog border-dog/30"
                                        : "bg-cat/10 text-cat border-cat/30",
                                    )}
                                  >
                                    {pet.type === "DOG" ? (
                                      <Dog className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Cat className="h-3 w-3 mr-1" />
                                    )}
                                    {pet.name}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCustomer(customer);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingCustomer(customer);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={5} className="p-0">
                              <div className="border-t bg-muted/20 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    สัตว์เลี้ยง ({customer.pets.length} ตัว)
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      setEditingPet({
                                        customerId: customer.id,
                                        pet: null,
                                      })
                                    }
                                    className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 border-dashed bg-card/50 hover:bg-muted/50 transition-colors h-19 w-24 shrink-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <Plus className="h-5 w-5" />
                                    <span className="text-[11px] font-medium leading-none text-center">
                                      เพิ่มสัตว์เลี้ยง
                                    </span>
                                  </button>
                                  {customer.pets.map((pet) => (
                                    <div
                                      key={pet.id}
                                      className="flex items-center gap-3 p-3 rounded-lg bg-card border h-19 flex-1 min-w-[260px] max-w-[350px]"
                                    >
                                      <div
                                        className={cn(
                                          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                                          pet.type === "DOG"
                                            ? "bg-dog/10 text-dog"
                                            : "bg-cat/10 text-cat",
                                        )}
                                      >
                                        {pet.type === "DOG" ? (
                                          <Dog className="h-5 w-5" />
                                        ) : (
                                          <Cat className="h-5 w-5" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="text-sm font-medium">
                                            {pet.name}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {petTypeLabels[pet.type]}
                                          </Badge>
                                          {pet.weight != null &&
                                            pet.weight > 0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {pet.weight} kg
                                              </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {formatBreedDisplay(pet)}
                                          {pet.note && ` · ${pet.note}`}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            setEditingPet({
                                              customerId: customer.id,
                                              pet,
                                            })
                                          }
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            setDeletingPet({
                                              customerId: customer.id,
                                              pet,
                                            })
                                          }
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
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
                  })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {onPageChange && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              หน้า {currentPage} / {totalPages}
              {totalCount !== undefined && ` (${totalCount} รายการ)`}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) < p - 1)
                    acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-muted-foreground text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={currentPage === item ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => onPageChange(item as number)}
                    >
                      {item}
                    </Button>
                  ),
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Customer Dialog */}
      <CustomerDialog
        open={editingCustomer !== null}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
        customer={editingCustomer}
        onSuccess={() => onRefresh?.()}
      />

      {/* Add/Edit Pet Dialog */}
      <PetDialog
        open={editingPet !== null}
        onOpenChange={(open) => !open && setEditingPet(null)}
        customerId={editingPet?.customerId ?? 0}
        pet={editingPet?.pet}
        onSuccess={() => onRefresh?.()}
      />

      {/* Delete Customer Confirmation */}
      <AlertDialog
        open={deletingCustomer !== null}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบลูกค้า</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ &quot;{deletingCustomer?.name}&quot;
              และสัตว์เลี้ยงทั้งหมด
              {deletingCustomer?.pets && deletingCustomer.pets.length > 0 && (
                <> ({deletingCustomer.pets.length} ตัว)</>
              )}{" "}
              ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Pet Confirmation */}
      <AlertDialog
        open={deletingPet !== null}
        onOpenChange={(open) => !open && setDeletingPet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบสัตว์เลี้ยง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ &quot;{deletingPet?.pet.name}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
