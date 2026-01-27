"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Dog, Cat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ServiceDialog } from "./service-dialog";
import { useServiceStore, useServiceConfigStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { toast } from "sonner";

export function ServiceList() {
  const { services, deleteService } = useServiceStore();
  const { petTypes, sizes } = useServiceConfigStore();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const sortedPetTypes = useMemo(() => {
    return [...petTypes].sort((a, b) => a.order - b.order);
  }, [petTypes]);

  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => a.order - b.order);
  }, [sizes]);

  const handleDelete = () => {
    if (deletingService) {
      deleteService(deletingService.id);
      toast.success("ลบบริการเรียบร้อยแล้ว");
      setDeletingService(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPetTypeIcon = (petTypeId: string) => {
    if (petTypeId === "DOG") return <Dog className="h-4 w-4 text-dog" />;
    if (petTypeId === "CAT") return <Cat className="h-4 w-4 text-cat" />;
    return null;
  };

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">ยังไม่มีบริการในระบบ</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingService(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingService(service)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ประเภท</TableHead>
                      {sortedSizes.map((size) => (
                        <TableHead
                          key={size.id}
                          className="text-center min-w-[70px]"
                        >
                          <div className="flex flex-col items-center">
                            <span>{size.name}</span>
                            {size.description && (
                              <span className="text-xs text-muted-foreground font-normal">
                                {size.description}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPetTypes.map((petType) => (
                      <TableRow key={petType.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPetTypeIcon(petType.id)}
                            <span className="text-sm">{petType.name}</span>
                          </div>
                        </TableCell>
                        {sortedSizes.map((size) => {
                          const price = service.prices.find(
                            (p) =>
                              p.petTypeId === petType.id &&
                              p.sizeId === size.id,
                          );
                          return (
                            <TableCell key={size.id} className="text-center">
                              {price && price.price > 0 ? (
                                <Badge variant="secondary">
                                  {formatCurrency(price.price)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Service Dialog */}
      <ServiceDialog
        open={editingService !== null}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingService !== null}
        onOpenChange={(open) => !open && setDeletingService(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบบริการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบบริการ &quot;{deletingService?.name}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
