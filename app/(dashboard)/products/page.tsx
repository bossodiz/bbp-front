"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
import { ProductList } from "@/components/products/product-list";

export default function ProductsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <PageShell>
      <PageHeader
        title="สินค้า"
        description="จัดการสินค้าและสต็อกสินค้าในร้าน"
        actions={
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มสินค้า
          </Button>
        }
      />

      <div className="flex flex-col lg:min-h-0 lg:flex-1">
        <ProductList
          addDialogOpen={addDialogOpen}
          onAddDialogChange={setAddDialogOpen}
        />
      </div>
    </PageShell>
  );
}
