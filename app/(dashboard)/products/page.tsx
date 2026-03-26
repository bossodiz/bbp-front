"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductList } from "@/components/products/product-list";

export default function ProductsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">สินค้า</h1>
          <p className="text-muted-foreground">
            จัดการสินค้าและสต็อกสินค้าในร้าน
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มสินค้า
        </Button>
      </div>

      <ProductList
        addDialogOpen={addDialogOpen}
        onAddDialogChange={setAddDialogOpen}
      />
    </div>
  );
}
