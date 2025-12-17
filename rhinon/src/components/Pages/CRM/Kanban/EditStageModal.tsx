"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export default function EditStageModal({ stage, onSave }: any) {
  const [name, setName] = useState(stage.title);
  const [color, setColor] = useState(stage.color);
  const [order, setOrder] = useState(stage.order);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-xs text-blue-600">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="space-y-4">
        <h2 className="font-semibold text-lg">Edit Stage</h2>

        <div className="space-y-2">
          <label className="text-sm">Stage Name</label>
          <input
            className="border p-2 rounded w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Stage Color</label>
          <input
            type="color"
            className="h-10 w-full rounded border p-1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Order</label>
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </div>

        <Button
          onClick={() => onSave({ name, color, order })}
          className="w-full mt-3">
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
