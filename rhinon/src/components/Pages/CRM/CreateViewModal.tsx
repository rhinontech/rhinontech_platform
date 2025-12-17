"use client";

import { BadgeDollarSign, Building, Kanban, Table, Users } from "lucide-react";
import { useState } from "react";

export default function CreateViewModal({
  open,
  setOpen,
  groupId,
  onCreate,
}: any) {
  const [name, setName] = useState("");
  const [type, setType] = useState("pipeline");
  const [manage, setManage] = useState("people");

  if (!open) return null;

  const closeModal = () => setOpen(null);

  const create = () => {
    if (!name.trim()) return;
    onCreate(groupId, name, type, manage);
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-[999]"
      onClick={closeModal}>
      <div
        className="bg-card text-card-foreground p-7 rounded-xl w-[430px] shadow-lg border border-border transition-all"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-semibold mb-2">New view</h2>

        <p className="text-muted-foreground mb-5 text-sm">
          Views let you segment contacts and visualise data in different ways.
        </p>

        <input
          className="w-full border border-border bg-background text-foreground rounded-lg p-3 mb-5 focus:ring-2 focus:ring-primary outline-none transition-colors placeholder-muted-foreground"
          placeholder="Untitled view"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="font-medium text-sm mb-3">What do you want to manage?</p>

        <div className="flex gap-2 mb-5">
          {["people", "company", "deal"].map((m) => (
            <button
              key={m}
              onClick={() => setManage(m)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                manage === m
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {m === "people" && <Users className="w-5 h-5" />}
              {m === "company" && <Building className="w-5 h-5" />}
              {m === "deal" && <BadgeDollarSign className="w-5 h-5" />}
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <p className="font-medium text-sm mb-3">View type</p>

        <div className="flex gap-2 mb-7">
          {["table", "pipeline"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                type === t
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {t === "table" && <Table className="w-5 h-5" />}
              {t === "pipeline" && <Kanban className="w-5 h-5" />}
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-5 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors font-medium text-sm"
            onClick={closeModal}>
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all font-medium text-sm"
            onClick={create}>
            Create view
          </button>
        </div>
      </div>
    </div>
  );
}
