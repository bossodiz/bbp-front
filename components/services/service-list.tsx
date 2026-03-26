"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Dog, Cat, Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Switch,
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
import { ServiceDialog } from "./service-dialog";
import { useServices } from "@/lib/hooks/use-services";
import type { UseServiceConfigReturn } from "@/lib/hooks/use-service-config";
import type { Service, PetType, PetSize } from "@/lib/types";
import { toast } from "sonner";

interface ServiceListProps {
  services: Service[];
  loading?: boolean;
  onRefresh?: () => void;
  petTypes: PetType[];
  getSizesForPetType: UseServiceConfigReturn["getSizesForPetType"];
}

export function ServiceList({
  services,
  loading,
  onRefresh,
  petTypes,
  getSizesForPetType,
}: ServiceListProps) {
  const {
    deleteService: deleteServiceAPI,
    toggleServiceStatus: toggleServiceAPI,
  } = useServices({ autoFetch: false });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const activePetTypes = useMemo(() => {
    return [...petTypes]
      .filter((p) => p.active)
      .sort((a, b) => a.order - b.order);
  }, [petTypes]);

  const handleDelete = async () => {
    if (deletingService) {
      try {
        await deleteServiceAPI(deletingService.id);
        toast.success("ลบบริการเรียบร้อยแล้ว");
        onRefresh?.();
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      } finally {
        setDeletingService(null);
      }
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      await toggleServiceAPI(service.id);
      toast.success(
        service.active ? "ปิดใช้งานบริการแล้ว" : "เปิดใช้งานบริการแล้ว",
      );
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </CardContent>
      </Card>
    );
  }

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
      <div className="space-y-8">
        {/* บริการพิเศษ */}
        {(() => {
          const specialServices = services.filter((s) => s.isSpecial);
          if (specialServices.length === 0) return null;

          return (
            <Card
              key="special"
              className="overflow-hidden border-primary/20 py-0"
            >
              {/* Header บริการพิเศษ */}
              <CardHeader className="bg-primary/5 border-b py-6 px-4 flex items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <div className="space-y-0">
                    <CardTitle className="text-sm font-semibold uppercase leading-none">
                      บริการพิเศษ
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      บริการที่ไม่เกี่ยวข้องกับประเภทสัตว์และขนาด
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* ตารางบริการพิเศษ */}
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="w-[200px] font-semibold text-sm h-6">
                          บริการ
                        </TableHead>
                        <TableHead className="text-center min-w-[100px] font-semibold text-sm h-6">
                          ราคา
                        </TableHead>
                        <TableHead className="w-[130px] text-center font-semibold text-sm h-8">
                          จัดการ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialServices.map((service) => (
                        <TableRow
                          key={service.id}
                          className={`hover:bg-muted/50 ${!service.active ? "opacity-50" : ""}`}
                        >
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground font-mono w-8">
                                #{service.order}
                              </span>
                              <span className="font-medium text-sm">
                                {service.name}
                              </span>
                              {!service.active && (
                                <Badge
                                  variant="outline"
                                  className="text-xs h-5 px-1.5"
                                >
                                  ปิด
                                </Badge>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 ml-9">
                                {service.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-2 px-2">
                            <Badge
                              variant="secondary"
                              className="font-medium text-sm h-6 px-2.5"
                            >
                              {formatCurrency(service.specialPrice || 0)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-2 px-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <Switch
                                checked={service.active}
                                onCheckedChange={() =>
                                  handleToggleStatus(service)
                                }
                                className="scale-75"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingService(service)}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingService(service)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* แยกตารางตามประเภทสัตว์ */}
        {activePetTypes.map((petType) => {
          const sizes = getSizesForPetType(petType.id).filter((s) => s.active);

          if (sizes.length === 0) return null;

          return (
            <Card
              key={petType.id}
              className={`overflow-hidden py-0 ${
                petType.id === "DOG"
                  ? "border-orange-200"
                  : petType.id === "CAT"
                    ? "border-sky-200"
                    : ""
              }`}
            >
              {/* Header ประเภทสัตว์ */}
              <CardHeader
                className={`border-b py-6 px-4 flex items-center ${
                  petType.id === "DOG"
                    ? "bg-orange-50"
                    : petType.id === "CAT"
                      ? "bg-sky-50"
                      : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPetTypeIcon(petType.id)}</span>
                  <div className="space-y-0">
                    <CardTitle className="text-sm font-semibold uppercase leading-none">
                      {petType.name} SERVICE
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      บริการสำหรับ{petType.name}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* ตารางบริการ */}
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="w-[160px] font-semibold text-sm h-6">
                          บริการ
                        </TableHead>
                        {sizes.map((size) => (
                          <TableHead
                            key={size.id}
                            className="text-center min-w-[75px] font-semibold text-sm h-6 px-2"
                          >
                            <div className="flex flex-col items-center">
                              <span>{size.name}</span>
                              {size.description && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {size.description}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="w-[130px] text-center font-semibold text-sm h-6">
                          จัดการ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services
                        .filter((service) => {
                          // กรองเฉพาะบริการปกติที่มีราคาสำหรับประเภทสัตว์นี้
                          return (
                            !service.isSpecial &&
                            service.prices?.some(
                              (p) => p.petTypeId === petType.id && p.price > 0,
                            )
                          );
                        })
                        .map((service) => {
                          return (
                            <TableRow
                              key={service.id}
                              className={`hover:bg-muted/50 ${!service.active ? "opacity-50" : ""}`}
                            >
                              <TableCell className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground font-mono w-8">
                                    #{service.order}
                                  </span>
                                  <span className="font-medium text-sm">
                                    {service.name}
                                  </span>
                                  {!service.active && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs h-5 px-1.5"
                                    >
                                      ปิด
                                    </Badge>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 ml-9">
                                    {service.description}
                                  </p>
                                )}
                              </TableCell>
                              {sizes.map((size) => {
                                const price = service.prices?.find(
                                  (p) =>
                                    p.petTypeId === petType.id &&
                                    p.sizeId === size.id,
                                );
                                return (
                                  <TableCell
                                    key={size.id}
                                    className="text-center py-2 px-2"
                                  >
                                    {price && price.price > 0 ? (
                                      <Badge
                                        variant="secondary"
                                        className="font-medium text-sm h-6 px-2.5"
                                      >
                                        {formatCurrency(price.price)}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center py-2 px-2">
                                <div className="flex items-center justify-center gap-0.5">
                                  <Switch
                                    checked={service.active}
                                    onCheckedChange={() =>
                                      handleToggleStatus(service)
                                    }
                                    className="scale-75"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingService(service)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingService(service)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Service Dialog */}
      <ServiceDialog
        open={editingService !== null}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onSuccess={onRefresh}
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
