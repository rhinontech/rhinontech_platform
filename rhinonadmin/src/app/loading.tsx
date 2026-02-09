"use client";

import { Loader2 } from "lucide-react";

export default function Loading({ areaOnly = false }: { areaOnly?: boolean }) {
  return (
    <div
      className={
        areaOnly
          ? "absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-sm"
          : "fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />
      </div>
    </div>
  );
}
