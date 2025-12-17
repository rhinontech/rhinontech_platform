"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DropdownSelectProps {
  list: any[];
  triggerText: string;
  onSelect: (item: any) => void;
  onCreate?: () => void;
  hideCreate?: boolean; // ⬅ NEW
}

export default function DropdownSelect({
  list,
  triggerText,
  onSelect,
  onCreate,
  hideCreate = false,
}: DropdownSelectProps) {
  const [search, setSearch] = useState("");

  const filtered = list.filter((item: any) => {
    const name =
      item.full_name ||
      item.name ||
      item.custom_data?.name ||
      item.email ||
      "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full">
          {triggerText}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72 p-2" sideOffset={4}>
        <Input
          placeholder="Search"
          className="mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollArea className="max-h-60">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No items found
            </div>
          )}

          {filtered.map((item: any) => {
            const name =
              item.full_name ||
              item.name ||
              item.custom_data?.name ||
              item.email ||
              "Unnamed";

            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onSelect(item)}
                className="cursor-pointer flex items-center">
                {name}
              </DropdownMenuItem>
            );
          })}

          {/* ⛔ Hidden when hideCreate is true */}
          {!hideCreate && onCreate && (
            <Button className="w-full mt-2" onClick={onCreate}>
              Create New
            </Button>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
