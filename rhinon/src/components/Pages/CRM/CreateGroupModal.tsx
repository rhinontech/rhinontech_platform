"use client";
import { Users, Building, BadgeDollarSign } from "lucide-react";
import { useState } from "react";

export default function CreateGroupModal({ open, setOpen, onCreate }: any) {
  const [name, setName] = useState("");
  const [type, setType] = useState("people");

  if (!open) return null;

  const closeModal = () => setOpen(false);

  const create = () => {
    if (!name.trim()) return;
    onCreate(name, type);
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-[999]"
      onClick={closeModal}>
      <div
        className="bg-card text-card-foreground p-7 rounded-xl w-[430px] shadow-lg border border-border transition-all"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-semibold mb-2">New group</h2>

        <p className="text-muted-foreground mb-5 text-sm">
          Groups let you organize your contacts and build customized workflows.
        </p>

        <input
          className="w-full border border-border bg-background text-foreground rounded-lg p-3 mb-5 focus:ring-2 focus:ring-primary outline-none transition-colors placeholder-muted-foreground"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="font-medium text-sm mb-3">What do you want to manage?</p>

        <div className="flex gap-2 mb-7">
          {["people", "company", "deal"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                type === t
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {t === "people" && <Users className="w-5 h-5" />}
              {t === "company" && <Building className="w-5 h-5" />}
              {t === "deal" && <BadgeDollarSign className="w-5 h-5" />}
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
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
