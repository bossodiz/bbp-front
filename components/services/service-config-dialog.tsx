"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  useServiceConfig,
  type UseServiceConfigReturn,
} from "@/lib/hooks/use-service-config";
import { toast } from "sonner";
import { PetSize, PetType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ServiceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceConfigDialog({
  open,
  onOpenChange,
}: ServiceConfigDialogProps) {
  const serviceConfig = useServiceConfig({ autoFetch: false });
  const {
    petTypes,
    petSizes,
    createPetType,
    updatePetType,
    deletePetType,
    reorderPetType,
    createPetSize,
    updatePetSize,
    deletePetSize,
    reorderPetSize,
    fetchPetTypes,
    fetchPetSizes,
  } = serviceConfig;

  useEffect(() => {
    if (open) {
      fetchPetTypes();
      fetchPetSizes();
    }
  }, [open]);

  const [newPetType, setNewPetType] = useState({ key: "", name: "" });
  const [newSize, setNewSize] = useState({
    petTypeId: null,
    key: null,
    name: "",
    minWeight: "",
    maxWeight: "",
    description: "",
  });
  const [selectedPetTypeForSize, setSelectedPetTypeForSize] = useState<
    number | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPetTypes, setLocalPetTypes] = useState<PetType[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const nameDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize selectedPetTypeForSize when petTypes loads
  useEffect(() => {
    if (petTypes.length > 0 && selectedPetTypeForSize === null) {
      const firstActive = petTypes.find((p) => p.active !== false);
      if (firstActive?.id) setSelectedPetTypeForSize(firstActive.id);
    }
  }, [petTypes]);

  // Sync localPetTypes from petTypes
  useEffect(() => {
    setLocalPetTypes(
      [...petTypes].sort((a, b) => (a.order || 0) - (b.order || 0)),
    );
  }, [petTypes]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...localPetTypes];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, removed);
    setLocalPetTypes(reordered);
    setDragIndex(index);
  };

  const handleDrop = async () => {
    setDragIndex(null);
    const previousOrder = [...localPetTypes];
    setIsSubmitting(true);
    try {
      await reorderPetType(
        localPetTypes
          .filter((pt): pt is PetType & { id: number } => pt.id !== undefined)
          .map((pt, i) => ({ id: pt.id, order: i + 1 })),
      );
      await toast.success("เรียงลำดับประเภทสัตว์เรียบร้อยแล้ว");
    } catch (error: any) {
      setLocalPetTypes(previousOrder);
      toast.error(error.message || "เกิดข้อผิดพลาดในการเรียงลำดับ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track pending changes for sizes (only save on "เสร็จสิ้น")
  const [pendingSizeChanges, setPendingSizeChanges] = useState<
    Map<number, Partial<PetSize>>
  >(new Map());

  // Local state for sizes with pending changes
  const [localSizes, setLocalSizes] = useState<PetSize[]>(petSizes);

  // Sync local sizes with API data
  useEffect(() => {
    setLocalSizes(petSizes);
    setPendingSizeChanges(new Map());
  }, [petSizes]);

  const activePetTypes = localPetTypes.filter((p) => p.active);

  const handleAddPetType = async () => {
    if (!newPetType.key.trim() || !newPetType.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อประเภท");
      return;
    }
    if (petTypes.some((p) => p.key === newPetType.key.toUpperCase())) {
      toast.error("รหัสประเภทนี้มีอยู่แล้ว");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPetType({
        key: newPetType.key.toUpperCase(),
        name: newPetType.name,
      });
      setNewPetType({ key: "", name: "" });
      toast.success("เพิ่มประเภทสัตว์เรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่มประเภทสัตว์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePetType = async (id: number) => {
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
    id: number,
    updates: { name?: string; active?: boolean },
  ) => {
    const current = localPetTypes.find((p) => p.id === id);
    if (!current) return;
    // Apply optimistic update for active toggle
    if (updates.active !== undefined) {
      setLocalPetTypes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: updates.active } : p)),
      );
    }
    setIsSubmitting(true);
    try {
      await updatePetType(id, {
        name: updates.name ?? current.name,
        active: updates.active ?? current.active,
        icon: current.icon,
      });
      await toast.success("อัพเดทประเภทสัตว์เรียบร้อยแล้ว");
    } catch (error: any) {
      // Rollback on failure
      setLocalPetTypes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...current } : p)),
      );
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัพเดทประเภทสัตว์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePetTypeNameChange = (id: number, name: string) => {
    // Update local state immediately (optimistic)
    setLocalPetTypes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
    // Debounce API call by 1 second
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => {
      handleUpdatePetType(id, { name });
    }, 1000);
  };

  const handleAddPetSize = async () => {
    if (!selectedPetTypeForSize) {
      toast.error("กรุณาเลือกประเภทสัตว์");
      return;
    }
    if (!newSize.name.trim()) {
      toast.error("กรุณากรอกชื่อขนาด");
      return;
    }

    const petType = petTypes.find((p) => p.id === selectedPetTypeForSize);
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

    if (
      localSizes.some(
        (s) =>
          s.petTypeId === selectedPetTypeForSize &&
          s.name?.toUpperCase() === newSize.name.toUpperCase(),
      )
    ) {
      toast.error("ขนาดนี้มีอยู่แล้วสำหรับประเภทสัตว์นี้");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPetSize({
        petTypeId: selectedPetTypeForSize,
        key: `${petType.key}_${newSize.name.toUpperCase()}`,
        name: newSize.name,
        minWeight,
        maxWeight,
        description: newSize.description || undefined,
      });
      setNewSize({
        petTypeId: null,
        key: null,
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

  const handleDeletePetSize = async (id: number) => {
    const sizesForType = petSizes.filter(
      (s) => s.petTypeId === selectedPetTypeForSize,
    );
    if (sizesForType.length <= 1) {
      toast.error("ต้องมีขนาดอย่างน้อย 1 ขนาดสำหรับแต่ละประเภทสัตว์");
      return;
    }

    setIsSubmitting(true);
    try {
      await deletePetSize(id);
      toast.success("ลบขนาดเรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบขนาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePetSize = (
    id: number,
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
      newMap.set(id, { ...existingChanges, ...updates } as Partial<PetSize>);
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
          updatePetSize(id, updates),
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
              {localPetTypes.map((petType, index) => (
                <div
                  key={petType.key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border bg-card transition-opacity",
                    dragIndex === index && "opacity-40",
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <div className="flex-1 flex items-center gap-3">
                    <Switch
                      checked={petType.active ?? true}
                      onCheckedChange={(checked) =>
                        handleUpdatePetType(petType.id!, { active: checked })
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      value={petType.key}
                      disabled
                      className="bg-muted w-32"
                    />
                    <Input
                      value={petType.name}
                      onChange={(e) =>
                        handlePetTypeNameChange(petType.id!, e.target.value)
                      }
                      placeholder="ชื่อ"
                      className="flex-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePetType(petType.id!)}
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
                  value={newPetType.key}
                  onChange={(e) =>
                    setNewPetType((prev) => ({ ...prev, key: e.target.value }))
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
                value={
                  selectedPetTypeForSize !== null
                    ? String(selectedPetTypeForSize)
                    : ""
                }
                onValueChange={(v) =>
                  setSelectedPetTypeForSize(v ? Number(v) : null)
                }
              >
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue placeholder="เลือกประเภทสัตว์" />
                </SelectTrigger>
                <SelectContent>
                  {activePetTypes.map((pt) => (
                    <SelectItem key={pt.id!} value={String(pt.id!)}>
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
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex-1 flex items-center gap-2">
                        <Switch
                          checked={size.active ?? true}
                          onCheckedChange={(checked) =>
                            handleUpdatePetSize(size.id!, { active: checked })
                          }
                          disabled={isSubmitting}
                        />
                        <Input
                          value={size.name}
                          onChange={(e) =>
                            handleUpdatePetSize(size.id!, {
                              name: e.target.value,
                            })
                          }
                          placeholder="ชื่อ"
                          className="w-20"
                          disabled={isSubmitting}
                        />
                        <Input
                          type="number"
                          value={size.minWeight ?? ""}
                          onChange={(e) =>
                            handleUpdatePetSize(size.id!, {
                              minWeight: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="น้ำหนักต่ำสุด (kg)"
                          className="flex-1"
                          disabled={isSubmitting}
                        />
                        <Input
                          type="number"
                          value={size.maxWeight ?? ""}
                          onChange={(e) =>
                            handleUpdatePetSize(size.id!, {
                              maxWeight: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="น้ำหนักสูงสุด (kg)"
                          className="flex-1"
                          disabled={isSubmitting}
                        />
                        <Input
                          value={size.description || ""}
                          onChange={(e) =>
                            handleUpdatePetSize(size.id!, {
                              description: e.target.value,
                            })
                          }
                          placeholder="คำอธิบาย (เช่น 2-4kg)"
                          className="flex-1"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePetSize(size.id!)}
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
                    onClick={handleAddPetSize}
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
