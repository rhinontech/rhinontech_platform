"use client";

import { useState } from "react";
import { useKBar } from "kbar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function SearchForm({ className }: { className?: string }) {
  const { query } = useKBar();
  const [activeMac, setActiveMac] = useState(false);

  return (
    <Button
      variant="outline"
      className={`justify-start text-muted-foreground py-2 ${className}`}
      onClick={() => {
        query.toggle();
        setActiveMac((prev) => !prev);
      }}
    >
      <Search className="mr-2 h-4 w-4" />
      Search or ask
      <div className="ml-auto flex justify-end">
        <div className="ml-auto flex justify-end">
  <div className="flex items-center  font-mono text-[12px] font-medium text-gray  px-3 py-1">
    <span>Ctrl</span>
    <span className="ml-1">K</span>
    <span className="mx-1">/</span>
    <span style={{ fontSize: "10px", fontWeight: "bold" }}>⌘</span>
    <span className="ml-1 text-[14px] mb-1">K</span>


  </div>
</div>
        {/* <div className="ml-auto flex justify-end">
          <div className="flex items-center rounded-lg border font-mono text-[14px] font-medium text-[#1a2753] shadow bg-gray-200 px-1">
           
            <div
              className={`flex items-center px-2 py-1 ${
                !activeMac ? "bg-white rounded-lg" : "bg-transparent"
              }`}
            >
              <span>Ctrl</span>
              <span className="ml-1">K</span>
            </div>

           
            <div
              className={`flex items-center px-2 py-1 ${
                activeMac ? "bg-white rounded-lg" : "bg-transparent"
              }`}
            >
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>⌘</span>
              <span className="ml-1">K</span>
            </div>
          </div>
        </div> */}
      </div>
    </Button>
  );
}
