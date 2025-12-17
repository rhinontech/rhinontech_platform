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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";
import { createPerson } from "@/services/crm/entitiesServices";
import { getCompany } from "@/services/crm/entitiesServices";
import AddCompanyModal from "./AddCompanyModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";

interface AddPersonModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  statuses: string[];
  // when createOnServer === false (default), onAdd receives Omit<Lead, "id" | "createdAt">
  // when createOnServer === true, onAdd receives the backend-created object (with id)
  onAdd: (arg: any) => void;
  triggerText?: string;
  columnStatus?: string;
  createOnServer?: boolean; // default false
}

const AVATARS = [
  "#fee2e2",
  "#fef3c7",
  "#d9f99d",
  "#a7f3d0",
  "#a5f3fc",
  "#dbeafe",
  "#ede9fe",
  "#fae8ff",
  "#ffe4e6",
  "#fef08a",
];

export default function AddPersonModal({
  isOpen,
  onOpenChange,
  statuses,
  onAdd,
  triggerText = "Add Person",
  columnStatus,
  createOnServer = false,
}: AddPersonModalProps) {
  const [open, setOpen] = useState(isOpen ?? false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // company dropdown for person modal (user requested)
  const [companies, setCompanies] = useState<any[]>([]);
  const [openCreateCompany, setOpenCreateCompany] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setOpen(isOpen ?? false);
  }, [isOpen]);

  useEffect(() => {
    // fetch companies so person modal shows company dropdown
    getCompany()
      .then((res) => {
        setCompanies(Array.isArray(res.companies) ? res.companies : []);
      })
      .catch((err) => {
        console.error("getCompany error", err);
      });
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Create on server OR return UI object depending on createOnServer prop
  const handleAddPerson = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please fill in first name and last name");
      return;
    }

    // Find full company object (from dropdown)
    const selectedCompany = companyId
      ? companies.find((c) => c.id === Number(companyId))
      : null;

    const newPersonUI: Omit<Lead, "id" | "createdAt"> = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      avatar: selectedAvatar,

      email,
      phone,
      linkedinUrl,

      // PERSON COMPANY INFO (FULL)
      company: selectedCompany?.name || "",
      companyId: selectedCompany?.id || null,
      companySize: selectedCompany?.size || "",
      industry: selectedCompany?.industry || "",
      companyLocation: selectedCompany?.location || "",

      jobTitle,

      status: columnStatus || "",
      pipeline: "",
      priority: "Medium",
      dealValue: 0,
      currency: "USD",
      leadScore: 0,
      probability: 0,
      source: "",
      channels: [],
      tags,

      lastActivityAt: new Date(),
      nextFollowupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };

    // ================================
    // UI-ONLY MODE (no backend)
    // ================================
    if (!createOnServer) {
      onAdd(newPersonUI);
      resetForm();
      return;
    }

    // ================================
    // BACKEND MODE
    // ================================
    const payload = {
      full_name: `${firstName} ${lastName}`,
      emails: email ? [email] : [],
      phones: phone ? [phone] : [],
      company_id: selectedCompany?.id || null,
      job_title: jobTitle,

      pipeline_id: null,
      pipeline_stage_id: null,

      custom_fields: {
        avatar: selectedAvatar,
        linkedinUrl,
        tags,
        priority: "Medium",
        dealValue: 0,
        currency: "USD",
        probability: 0,
        source: "",
        channels: [],
      },
    };

    try {
      const res = await createPerson(payload);
      const created = res.person ?? res;

      // HYDRATE BACKEND RESPONSE WITH COMPANY DETAILS FOR UI
      const enriched = {
        ...created,
        company: selectedCompany?.name || "",
        companyId: selectedCompany?.id || null,
        companySize: selectedCompany?.size || "",
        industry: selectedCompany?.industry || "",
        companyLocation: selectedCompany?.location || "",
        jobTitle,
      };

      onAdd(enriched);

      resetForm();
    } catch (err) {
      console.error("create person error", err);
      toast.error("Failed to create contact");
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const result = await uploadFileAndGetFullUrl(file);
      const fileUrl = result?.fileUrl || result?.url;
      if (!fileUrl) throw new Error("Upload returned no URL");

      setSelectedAvatar(fileUrl); // set avatar for person
      toast.success("Profile image uploaded");
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error("Profile upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  // Helper reset fn
  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setLinkedinUrl("");
    setJobTitle("");
    setCompany("");
    setCompanyId("");
    setSelectedAvatar(AVATARS[0]);
    setTags([]);
    setTagInput("");
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Add New Person
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar Upload + Preview */}
          {/* Company Avatar Upload */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              Company Logo
            </Label>

            <div className="flex items-center gap-4 mt-2">
              <div
                onClick={() =>
                  document.getElementById("companyAvatarInput")?.click()
                }
                className="
        w-14 h-14 rounded-full cursor-pointer
        flex items-center justify-center
        overflow-hidden border 
        bg-gray-300 hover:bg-gray-400 transition
      ">
                {selectedAvatar && !AVATARS.includes(selectedAvatar) ? (
                  <img
                    src={selectedAvatar}
                    alt="company avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/image/sample-avatar.png"
                    alt="avatar"
                    className="w-10 h-10 opacity-70"
                  />
                )}
              </div>

              <input
                type="file"
                id="companyAvatarInput"
                accept="image/*"
                className="hidden"
                onChange={handleUploadImage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                First Name *
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Last Name *
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Phone
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0123"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              LinkedIn URL
            </Label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Company
              </Label>

              <Select
                value={companyId || ""}
                onValueChange={(value) => {
                  if (value === "__create_company__") {
                    setOpenCreateCompany(true);
                    return;
                  }
                  setCompanyId(value);
                  const selected = companies.find(
                    (c) => String(c.id) === value
                  );
                  setCompany(selected?.name || "");
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>

                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}

                  <SelectItem value="__create_company__">
                    ➕ Add New Company
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Job Title
              </Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Sales Manager"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200 block mb-2">
              Tags
            </Label>
            <div className="flex gap-2 mb-2">
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
              <Button size="sm" onClick={handleAddTag}>
                Add
              </Button>
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
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddPerson} className="flex-1">
            Add Person
          </Button>
        </div>
      </DialogContent>

      {/* Inline company creation modal (creates on server and returns created object) */}
      <AddCompanyModal
        isOpen={openCreateCompany}
        onOpenChange={setOpenCreateCompany}
        statuses={statuses}
        columnStatus={columnStatus}
        createOnServer={true}
        onAdd={(createdCompany) => {
          setOpenCreateCompany(false);
          if (!createdCompany) return;
          // refresh dropdown list immediately: re-fetch or push locally
          setCompanies((prev) => [...prev, createdCompany]);
          // auto-select newly created company
          setCompanyId(String(createdCompany.id));
        }}
      />
    </Dialog>
  );
}
