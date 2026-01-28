"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServiceConfig } from "@/lib/hooks/use-service-config";
import type { PetSize } from "@/lib/hooks/use-service-config";
import { toast } from "sonner";

interface ServiceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceConfigDialog({
  open,
  onOpenChange,
}: ServiceConfigDialogProps) {
  const {
    petTypes,
    petSizes,
    getSizesForPetType,
    createPetType,
    updatePetType,
    deletePetType,
    createSize,
    updateSize,
    deleteSize,
  } = useServiceConfig();

  const [newPetType, setNewPetType] = useState({ id: "", name: "" });
  const [newSize, setNewSize] = useState({
    petTypeId: "",
    name: "",
    minWeight: "",
    maxWeight: "",
    description: "",
  });
  const [selectedPetTypeForSize, setSelectedPetTypeForSize] = useState<string>(
    petTypes.find((p) => p.active)?.id || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track pending changes for sizes (only save on "เสร็จสิ้น")
  const [pendingSizeChanges, setPendingSizeChanges] = useState<
    Map<string, Partial<PetSize>>
  >(new Map());

  // Local state for sizes with pending changes
  const [localSizes, setLocalSizes] = useState<PetSize[]>(petSizes);

  // Sync local sizes with API data
  useEffect(() => {
    setLocalSizes(petSizes);
    setPendingSizeChanges(new Map());
  }, [petSizes]);

  const sortedPetTypes = [...petTypes].sort((a, b) => a.order - b.order);
  const activePetTypes = sortedPetTypes.filter((p) => p.active);

  const handleAddPetType = async () => {
    if (!newPetType.id.trim() || !newPetType.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อประเภท");
      return;
    }
    if (petTypes.some((p) => p.id === newPetType.id.toUpperCase())) {
      toast.error("รหัสประเภทนี้มีอยู่แล้ว");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPetType({
        id: newPetType.id.toUpperCase(),
        name: newPetType.name,
        active: true,
      });
      setNewPetType({ id: "", name: "" });
      toast.success("เพิ่มประเภทสัตว์เรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่มประเภทสัตว์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePetType = async (id: string) => {
    if (petTypes.length <= 1) {
      toast.error("ต้องมีประเภทสัตว์อย่างน้อย 1 ประเภท");
      return;
    }

    setIsSubmitting(true);
    try {
      await deletePetType(id);
      toast.success("ลบประเภทสัตว์เรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบประเภทสัตว์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePetType = async (
    id: string,
    updates: { name?: string; active?: boolean },
  ) => {
    setIsSubmitting(true);
    try {
      await updatePetType(id, updates);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัพเดทประเภทสัตว์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSize = async () => {
    if (!newSize.petTypeId) {
      toast.error("กรุณาเลือกประเภทสัตว์");
      return;
    }
    if (!newSize.name.trim()) {
      toast.error("กรุณากรอกชื่อขนาด");
      return;
    }

    const petType = petTypes.find((p) => p.id === newSize.petTypeId);
    if (!petType) {
      toast.error("ไม่พบประเภทสัตว์ที่เลือก");
      return;
    }

    const minWeight = newSize.minWeight
      ? parseFloat(newSize.minWeight)
      : undefined;
    const maxWeight = newSize.maxWeight
      ? parseFloat(newSize.maxWeight)
      : undefined;

    if (
      minWeight !== undefined &&
      maxWeight !== undefined &&
      minWeight >= maxWeight
    ) {
      toast.error("น้ำหนักต่ำสุดต้องน้อยกว่าน้ำหนักสูงสุด");
      return;
    }

    // สร้าง ID ในรูปแบบ PETTYPE_SIZENAME (เช่น CAT_XL, DOG_XL)
    const sizeId = `${newSize.petTypeId}_${newSize.name.toUpperCase()}`;
    
    // ตรวจสอบว่า ID ซ้ำหรือไม่
    if (localSizes.some((s) => s.id === sizeId)) {
      toast.error("ขนาดนี้มีอยู่แล้วสำหรับประเภทสัตว์นี้");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSize({
        id: sizeId,
        petTypeId: newSize.petTypeId,
        name: newSize.name,
        minWeight,
        maxWeight,
        description: newSize.description || undefined,
        active: true,
      });
      setNewSize({
        petTypeId: newSize.petTypeId,
        name: "",
        minWeight: "",
        maxWeight: "",
        description: "",
      });
      toast.success("เพิ่มขนาดเรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่มขนาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSize = async (id: string) => {
    const sizesForType = petSizes.filter(
      (s) => s.petTypeId === selectedPetTypeForSize,
    );
    if (sizesForType.length <= 1) {
      toast.error("ต้องมีขนาดอย่างน้อย 1 ขนาดสำหรับแต่ละประเภทสัตว์");
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteSize(id);
      toast.success("ลบขนาดเรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบขนาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSize = (
    id: string,
    updates: {
      name?: string;
      minWeight?: number;
      maxWeight?: number;
      description?: string;
      active?: boolean;
    },
  ) => {
    // Update local state immediately
    setLocalSizes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );

    // Track pending changes
    setPendingSizeChanges((prev) => {
      const newMap = new Map(prev);
      const existingChanges = newMap.get(id) || {};
      newMap.set(id, { ...existingChanges, ...updates });
      return newMap;
    });
  };

  const handleSaveSizeChanges = async () => {
    if (pendingSizeChanges.size === 0) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save all pending changes
      await Promise.all(
        Array.from(pendingSizeChanges.entries()).map(([id, updates]) =>
          updateSize(id, updates),
        ),
      );

      setPendingSizeChanges(new Map());
      toast.success("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>ตั้งค่าประเภทสัตว์และขนาด</DialogTitle>
          <DialogDescription>
            จัดการประเภทสัตว์และขนาดสำหรับกำหนดราคาบริการ
            แต่ละประเภทสัตว์สามารถมีขนาดที่แตกต่างกัน
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="petTypes"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="petTypes">ประเภทสัตว์</TabsTrigger>
            <TabsTrigger value="sizes">ขนาด (แยกตามประเภท)</TabsTrigger>
          </TabsList>

          <TabsContent
            value="petTypes"
            className="space-y-4 mt-4 overflow-y-auto flex-1"
          >
            {/* Existing Pet Types */}
            <div className="space-y-2">
              {sortedPetTypes.map((petType) => (
                <div
                  key={petType.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1 flex items-center gap-3">
                    <Switch
                      checked={petType.active}
                      onCheckedChange={(checked) =>
                        handleUpdatePetType(petType.id, { active: checked })
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      value={petType.id}
                      disabled
                      className="bg-muted w-32"
                    />
                    <Input
                      value={petType.name}
                      onChange={(e) =>
                        handleUpdatePetType(petType.id, {
                          name: e.target.value,
                        })
                      }
                      placeholder="ชื่อ"
                      className="flex-1"
                      disabled={!petType.active || isSubmitting}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePetType(petType.id)}
                    disabled={petTypes.length <= 1 || isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Pet Type */}
            <div className="pt-2 border-t">
              <Label className="text-sm text-muted-foreground">
                เพิ่มประเภทใหม่
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="รหัส (เช่น RABBIT)"
                  value={newPetType.id}
                  onChange={(e) =>
                    setNewPetType((prev) => ({ ...prev, id: e.target.value }))
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="ชื่อ (เช่น กระต่าย)"
                  value={newPetType.name}
                  onChange={(e) =>
                    setNewPetType((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleAddPetType}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="sizes"
            className="space-y-4 mt-4 overflow-y-auto flex-1"
          >
            {/* Select Pet Type */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium whitespace-nowrap">
                แสดงขนาดสำหรับ:
              </Label>
              <Select
                value={selectedPetTypeForSize}
                onValueChange={setSelectedPetTypeForSize}
              >
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue placeholder="เลือกประเภทสัตว์" />
                </SelectTrigger>
                <SelectContent>
                  {activePetTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Existing Sizes for Selected Pet Type */}
            {selectedPetTypeForSize && (
              <div className="space-y-2">
                {localSizes
                  .filter((s) => s.petTypeId === selectedPetTypeForSize)
                  .sort((a, b) => a.order - b.order)
                  .map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex-1 flex items-center gap-2">
                        <Switch
                          checked={size.active}
                          onCheckedChange={(checked) =>
                            handleUpdateSize(size.id, { active: checked })
                          }
                          disabled={isSubmitting}
                        />
                        <Input
                          value={size.name}
                          onChange={(e) =>
                            handleUpdateSize(size.id, { name: e.target.value })
                          }
                          placeholder="ชื่อ"
                          className="w-20"
                          disabled={!size.active || isSubmitting}
                        />
                        <Input
                          type="number"
                          value={size.minWeight ?? ""}
                          onChange={(e) =>
                            handleUpdateSize(size.id, {
                              minWeight: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="น้ำหนักต่ำสุด (kg)"
                          className="flex-1"
                          disabled={!size.active || isSubmitting}
                        />
                        <Input
                          type="number"
                          value={size.maxWeight ?? ""}
                          onChange={(e) =>
                            handleUpdateSize(size.id, {
                              maxWeight: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="น้ำหนักสูงสุด (kg)"
                          className="flex-1"
                          disabled={!size.active || isSubmitting}
                        />
                        <Input
                          value={size.description || ""}
                          onChange={(e) =>
                            handleUpdateSize(size.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="คำอธิบาย (เช่น 2-4kg)"
                          className="flex-1"
                          disabled={!size.active || isSubmitting}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSize(size.id)}
                        disabled={
                          localSizes.filter(
                            (s) => s.petTypeId === selectedPetTypeForSize,
                          ).length <= 1 || isSubmitting
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {/* Add New Size */}
            {selectedPetTypeForSize && (
              <div className="pt-2 border-t">
                <Label className="text-sm text-muted-foreground">
                  เพิ่มขนาดใหม่สำหรับ{" "}
                  {petTypes.find((p) => p.id === selectedPetTypeForSize)?.name}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="ชื่อ (เช่น XXL)"
                    value={newSize.name}
                    onChange={(e) =>
                      setNewSize((prev) => ({
                        ...prev,
                        name: e.target.value,
                        petTypeId: selectedPetTypeForSize,
                      }))
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="น้ำหนักต่ำสุด"
                    value={newSize.minWeight}
                    onChange={(e) =>
                      setNewSize((prev) => ({
                        ...prev,
                        minWeight: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="น้ำหนักสูงสุด"
                    value={newSize.maxWeight}
                    onChange={(e) =>
                      setNewSize((prev) => ({
                        ...prev,
                        maxWeight: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="คำอธิบาย (เช่น 30kg+)"
                    value={newSize.description}
                    onChange={(e) =>
                      setNewSize((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddSize}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!selectedPetTypeForSize && activePetTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                กรุณาเพิ่มและเปิดใช้งานประเภทสัตว์ก่อน
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button onClick={handleSaveSizeChanges} disabled={isSubmitting}>
            {isSubmitting ? "กำลังบันทึก..." : "เสร็จสิ้น"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
