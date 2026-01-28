"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Dog,
  Cat,
  Pencil,
  Trash2,
  Plus,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
}

export function CustomerList({
  customers,
  loading,
  onRefresh,
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">ไม่พบข้อมูลลูกค้า</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {customers.map((customer) => {
          const isExpanded = expandedIds.has(customer.id);
          return (
            <Collapsible
              key={customer.id}
              open={isExpanded}
              onOpenChange={() => toggleExpand(customer.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {customer.name}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {customer.pets.length} สัตว์เลี้ยง
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhoneDisplay(customer.phone)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCustomer(customer);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 py-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        สัตว์เลี้ยง
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingPet({ customerId: customer.id, pet: null })
                        }
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        เพิ่มสัตว์เลี้ยง
                      </Button>
                    </div>
                    {customer.pets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        ยังไม่มีสัตว์เลี้ยง
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {customer.pets.map((pet) => (
                          <div
                            key={pet.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-card border"
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
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
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {pet.name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {petTypeLabels[pet.type]}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {pet.weight} kg
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatBreedDisplay(pet)}
                                {pet.note && ` - ${pet.note}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
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
                                className="h-8 w-8"
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
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

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
