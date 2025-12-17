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
import { createCompany } from "@/services/crm/entitiesServices";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";

interface AddCompanyModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  statuses: string[];
  // onAdd: when createOnServer=false -> receives Omit<Lead,...>
  // when createOnServer=true -> receives backend created object
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

export default function AddCompanyModal({
  isOpen,
  onOpenChange,
  statuses,
  onAdd,
  triggerText = "Add Company",
  columnStatus,
  createOnServer = false,
}: AddCompanyModalProps) {
  const [open, setOpen] = useState(isOpen ?? false);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    setOpen(isOpen ?? false);
  }, [isOpen]);

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

  const handleAddCompany = async () => {
    if (!companyName.trim()) {
      toast.error("Please fill in company name");
      return;
    }

    const newCompanyUI: Omit<Lead, "id" | "createdAt"> = {
      firstName: "",
      lastName: "",
      name: companyName,
      avatar: selectedAvatar,

      email: "",
      phone: "",
      linkedinUrl: "",

      company: companyName, // UI visible
      companyId: null, // will be set after backend create
      companySize,
      industry,
      companyLocation: location,

      status: columnStatus || "",
      pipeline: "",
      priority: "Medium",
      dealValue: 0,
      currency: "USD",
      leadScore: 0,
      probability: 0,

      source: "",
      channels: [],
      lastActivityAt: new Date(),
      nextFollowupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags,
    };

    // If no backend create → return UI object only
    if (!createOnServer) {
      onAdd(newCompanyUI);
      resetCompanyForm();
      return;
    }

    // Backend create
    const payload = {
      name: companyName,
      domain,
      website,
      industry,
      size: companySize,
      location,
      tags,
      pipeline_id: null,
      pipeline_stage_id: null,
      custom_fields: {
        avatar: selectedAvatar,
      },
    };

    try {
      const res = await createCompany(payload);
      const created = res.company ?? res;

      // Hydrate UI object using backend-created id
      const hydrated = {
        ...newCompanyUI,
        companyId: created.id,
        name: created.name,
        company: created.name,
      };

      onAdd(hydrated);

      resetCompanyForm();
    } catch (err) {
      console.error("create company error", err);
      toast.error("Failed to create company");
    }
  };

  function resetCompanyForm() {
    setCompanyName("");
    setDomain("");
    setWebsite("");
    setIndustry("");
    setCompanySize("");
    setLocation("");
    setSelectedAvatar(AVATARS[0]);
    setTags([]);
    setTagInput("");
    handleOpenChange(false);
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const result = await uploadFileAndGetFullUrl(file);
      const fileUrl = result?.fileUrl || result?.url;
      if (!fileUrl) throw new Error("Upload returned no URL");

      setSelectedAvatar(fileUrl);
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error("Profile upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Add New Company
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar Selection */}
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

          {/* Company Information */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              Company Name *
            </Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corporation"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Domain
              </Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.com"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Website
              </Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Industry
              </Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Technology"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Company Size
              </Label>
              <Input
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                placeholder="100-500"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              Location
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
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
                onKeyPress={(e) => {
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
            onClick={() => handleOpenChange(false)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
            Cancel
          </Button>
          <Button onClick={handleAddCompany} className="flex-1">
            Add Company
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
