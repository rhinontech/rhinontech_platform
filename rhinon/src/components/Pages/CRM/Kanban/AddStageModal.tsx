"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#60A5FA", // blue
  "#A855F7", // purple
  "#22C55E", // green
  "#F97316", // orange
  "#EAB308", // yellow
  "#10B981", // emerald
  "#FDE68A", // light yellow
  "#FCE7F3", // pink
  "#E0F2FE", // light blue
];

export default function AddStageModal({ onAdd, nextOrder }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#E0F2FE");

  const handleSubmit = () => {
    if (!title.trim()) return;

    onAdd({
      name: title,
      color,
      order: nextOrder,
    });

    setOpen(false);
    setTitle("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Stage</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Stage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Stage Name</label>
            <input
              className="w-full border p-2 rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stage name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Choose Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border ${
                    color === c ? "ring-2 ring-black dark:ring-white" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
