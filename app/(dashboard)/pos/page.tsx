"use client";

import { Suspense } from "react";
import { POSContent } from "@/components/pos/pos-content";

export default function POSPage() {
  return (
    <Suspense fallback={<POSLoading />}>
      <POSContent />
    </Suspense>
  );
}

function POSLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
