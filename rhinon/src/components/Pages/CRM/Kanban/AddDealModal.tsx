"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

import AddPersonModal from "./AddPersonModal";
import AddCompanyModal from "./AddCompanyModal";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

interface AddDealModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  statuses: string[];
  people?: any[];
  companies?: any[];
  onPersonCreated?: (p: any) => void;
  onCompanyCreated?: (c: any) => void;
  onAdd: (lead: Omit<Lead, "id" | "createdAt">) => void;
  triggerText?: string;
  columnStatus?: string;
}

export default function AddDealModal({
  isOpen,
  onOpenChange,
  statuses,
  people = [],
  companies = [],
  onPersonCreated,
  onCompanyCreated,
  onAdd,
  triggerText = "Add Deal",
  columnStatus,
}: AddDealModalProps) {
  const [dealTitle, setDealTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState(columnStatus || "");
  const [priority, setPriority] = useState("Medium");
  const [dealValue, setDealValue] = useState("10000");
  const [currency, setCurrency] = useState("USD");
  const [probability, setProbability] = useState("50");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [openAddPerson, setOpenAddPerson] = useState(false);
  const [openAddCompany, setOpenAddCompany] = useState(false);

  // local dropdown lists (so we can immediately append newly created items)
  const [localPeople, setLocalPeople] = useState<any[]>(people);
  const [localCompanies, setLocalCompanies] = useState<any[]>(companies);

  // keep local lists in sync when parent passes new props
  useEffect(() => setLocalPeople(people), [people]);
  useEffect(() => setLocalCompanies(companies), [companies]);


  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddDeal = () => {
    if (!dealTitle.trim()) {
      toast.error("Please fill in deal title");
      return;
    }

    const newDeal: Omit<Lead, "id" | "createdAt"> = {
      firstName: "",
      lastName: "",
      name: dealTitle,
      avatar: "#dbeafe",

      email: "",
      phone: "",
      linkedinUrl: "",

      // IMPORTANT: Keep ID + UI label
      contactId: contactId ? Number(contactId) : null,
      companyId: companyId ? Number(companyId) : null,

      // store UI visible company name
      company:
        companyId && localCompanies.find((c) => c.id === Number(companyId))
          ? localCompanies.find((c) => c.id === Number(companyId))!.name
          : "",

      companySize: "",
      industry: "",
      companyLocation: "",

      status: status || columnStatus || "",
      pipeline: "",
      priority: priority as any,
      dealValue: Number(dealValue),
      currency,
      leadScore: 0,
      probability: Number(probability),

      source: "",
      channels: [],
      lastActivityAt: new Date(),
      nextFollowupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags,
    };

    onAdd(newDeal);

    // Reset
    setDealTitle("");
    setContactId("");
    setCompanyId("");
    setStatus(columnStatus || "");
    setPriority("Medium");
    setDealValue("10000");
    setCurrency("USD");
    setProbability("50");
    setTags([]);
    setTagInput("");

    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Add New Deal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deal Title */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              Deal Title *
            </Label>
            <Input
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="Enterprise Software License"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Contact + Company Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Contact
              </Label>
              <Select
                value={contactId}
                onValueChange={(value) => {
                  if (value === "__create_contact__") {
                    setOpenAddPerson(true);
                    return;
                  }
                  setContactId(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Contact" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(localPeople) &&
                    localPeople.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.full_name ??
                          p.name ??
                          `${p.firstName ?? ""} ${p.lastName ?? ""}`}
                      </SelectItem>
                    ))}
                  <SelectItem value="__create_contact__">
                    ➕ Add New Contact
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Company
              </Label>
              <Select
                value={companyId}
                onValueChange={(value) => {
                  if (value === "__create_company__") {
                    setOpenAddCompany(true);
                    return;
                  }
                  setCompanyId(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(localCompanies) &&
                    localCompanies.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  <SelectItem value="__create_company__">
                    ➕ Add New Company
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Deal Value
              </Label>
              <Input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="1000"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Probability (%)
              </Label>
              <Input
                type="number"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                placeholder="50"
                min="0"
                max="100"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200 block mb-2">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 flex-1"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}>
                  {tag} ✕
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
            Cancel
          </Button>
          <Button onClick={handleAddDeal} className="flex-1">
            Add Deal
          </Button>
        </div>
      </DialogContent>

      {/* Add NEW Contact (created on server) */}
      <AddPersonModal
        isOpen={openAddPerson}
        onOpenChange={setOpenAddPerson}
        statuses={statuses}
        columnStatus={status}
        createOnServer={true} // IMPORTANT: create on server and return created object
        onAdd={(created) => {
          setOpenAddPerson(false);
          if (!created) return;
          setLocalPeople((prev) => [...prev, created]);
          onPersonCreated?.(created);
          setContactId(String(created.id));
        }}
      />

      {/* Add NEW Company (created on server) */}
      <AddCompanyModal
        isOpen={openAddCompany}
        onOpenChange={setOpenAddCompany}
        statuses={statuses}
        columnStatus={status}
        createOnServer={true}
        onAdd={(created) => {
          setOpenAddCompany(false);
          if (!created) return;
          setLocalCompanies((prev) => [...prev, created]);
          onCompanyCreated?.(created);
          setCompanyId(String(created.id));
        }}
      />
    </Dialog>
  );
}
