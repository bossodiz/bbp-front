"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServiceConfigStore } from "@/lib/store";
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
    sizes,
    addPetType,
    updatePetType,
    deletePetType,
    addSize,
    updateSize,
    deleteSize,
  } = useServiceConfigStore();

  const [newPetType, setNewPetType] = useState({ id: "", name: "" });
  const [newSize, setNewSize] = useState({ id: "", name: "", description: "" });

  const sortedPetTypes = [...petTypes].sort((a, b) => a.order - b.order);
  const sortedSizes = [...sizes].sort((a, b) => a.order - b.order);

  const handleAddPetType = () => {
    if (!newPetType.id.trim() || !newPetType.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อประเภท");
      return;
    }
    if (petTypes.some((p) => p.id === newPetType.id.toUpperCase())) {
      toast.error("รหัสประเภทนี้มีอยู่แล้ว");
      return;
    }
    addPetType({
      id: newPetType.id.toUpperCase(),
      name: newPetType.name,
    });
    setNewPetType({ id: "", name: "" });
    toast.success("เพิ่มประเภทสัตว์เรียบร้อยแล้ว");
  };

  const handleDeletePetType = (id: string) => {
    if (petTypes.length <= 1) {
      toast.error("ต้องมีประเภทสัตว์อย่างน้อย 1 ประเภท");
      return;
    }
    deletePetType(id);
    toast.success("ลบประเภทสัตว์เรียบร้อยแล้ว");
  };

  const handleAddSize = () => {
    if (!newSize.id.trim() || !newSize.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อขนาด");
      return;
    }
    if (sizes.some((s) => s.id === newSize.id.toUpperCase())) {
      toast.error("รหัสขนาดนี้มีอยู่แล้ว");
      return;
    }
    addSize({
      id: newSize.id.toUpperCase(),
      name: newSize.name,
      description: newSize.description || undefined,
    });
    setNewSize({ id: "", name: "", description: "" });
    toast.success("เพิ่มขนาดเรียบร้อยแล้ว");
  };

  const handleDeleteSize = (id: string) => {
    if (sizes.length <= 1) {
      toast.error("ต้องมีขนาดอย่างน้อย 1 ขนาด");
      return;
    }
    deleteSize(id);
    toast.success("ลบขนาดเรียบร้อยแล้ว");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ตั้งค่าประเภทและขนาด</DialogTitle>
          <DialogDescription>
            จัดการประเภทสัตว์และขนาดสำหรับกำหนดราคาบริการ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="petTypes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="petTypes">ประเภทสัตว์</TabsTrigger>
            <TabsTrigger value="sizes">ขนาด</TabsTrigger>
          </TabsList>

          <TabsContent value="petTypes" className="space-y-4 mt-4">
            {/* Existing Pet Types */}
            <div className="space-y-2">
              {sortedPetTypes.map((petType) => (
                <div
                  key={petType.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={petType.id}
                      disabled
                      className="bg-muted"
                    />
                    <Input
                      value={petType.name}
                      onChange={(e) =>
                        updatePetType(petType.id, { name: e.target.value })
                      }
                      placeholder="ชื่อ"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePetType(petType.id)}
                    disabled={petTypes.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Pet Type */}
            <div className="pt-2 border-t">
              <Label className="text-sm text-muted-foreground">เพิ่มประเภทใหม่</Label>
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
                <Button size="icon" onClick={handleAddPetType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sizes" className="space-y-4 mt-4">
            {/* Existing Sizes */}
            <div className="space-y-2">
              {sortedSizes.map((size) => (
                <div
                  key={size.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      value={size.id}
                      disabled
                      className="bg-muted"
                    />
                    <Input
                      value={size.name}
                      onChange={(e) =>
                        updateSize(size.id, { name: e.target.value })
                      }
                      placeholder="ชื่อ"
                    />
                    <Input
                      value={size.description || ""}
                      onChange={(e) =>
                        updateSize(size.id, { description: e.target.value })
                      }
                      placeholder="คำอธิบาย (เช่น 2-4kg)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSize(size.id)}
                    disabled={sizes.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Size */}
            <div className="pt-2 border-t">
              <Label className="text-sm text-muted-foreground">เพิ่มขนาดใหม่</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="รหัส (เช่น XXL)"
                  value={newSize.id}
                  onChange={(e) =>
                    setNewSize((prev) => ({ ...prev, id: e.target.value }))
                  }
                  className="w-24"
                />
                <Input
                  placeholder="ชื่อ"
                  value={newSize.name}
                  onChange={(e) =>
                    setNewSize((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-20"
                />
                <Input
                  placeholder="คำอธิบาย (เช่น 30kg+)"
                  value={newSize.description}
                  onChange={(e) =>
                    setNewSize((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button size="icon" onClick={handleAddSize}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>เสร็จสิ้น</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
