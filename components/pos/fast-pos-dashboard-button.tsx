"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FastPOSModal } from "./fast-pos-modal";

export function FastPOSDashboardButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Zap className="h-5 w-5" />
        <span className="hidden sm:inline">สร้างรายการ POS</span>
        <span className="sm:hidden">POS</span>
      </Button>

      <FastPOSModal open={open} onOpenChange={setOpen} />
    </>
  );
}
