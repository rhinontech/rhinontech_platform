"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Lead, Channel } from "@/types/crm";

interface AddLeadModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  statuses?: string[];
  onAdd: (lead: Omit<Lead, "id" | "createdAt">) => void;
  triggerText?: string;
  columnStatus?: string;
  pipelineType?: any;
}

const CHANNEL_OPTIONS: Channel[] = [
  "Email",
  "Phone",
  "LinkedIn",
  "In-Person",
  "Chat",
  "Website",
];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
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

export default function AddLeadModal({
  isOpen,
  onOpenChange,
  statuses,
  onAdd,
  triggerText = "Add people",
  pipelineType,
  columnStatus,
}: AddLeadModalProps) {
  const [open, setOpen] = useState(isOpen ?? false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [status, setStatus] = useState(columnStatus || "");
  const [pipeline, setPipeline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dealValue, setDealValue] = useState("10000");
  const [currency, setCurrency] = useState("USD");
  const [leadScore, setLeadScore] = useState("50");
  const [probability, setProbability] = useState("50");
  const [source, setSource] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([
    "Email",
  ]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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

  const handleAddLead = () => {
    if (!firstName.trim() || !lastName.trim() || !company.trim() || !status) {
      toast.error("Please fill in required fields");
      return;
    }

    const newLead: Omit<Lead, "id" | "createdAt"> = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      avatar: selectedAvatar,
      email,
      phone,
      linkedinUrl,
      company,
      companySize,
      industry,
      companyLocation,
      status,
      pipeline,
      priority: priority as "Low" | "Medium" | "High" | "Critical",
      dealValue: Number(dealValue),
      currency,
      leadScore: Number(leadScore),
      probability: Number(probability),
      source,
      channels: selectedChannels,
      lastActivityAt: new Date(),
      nextFollowupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags,
    };

    onAdd(newLead);

    // Reset form
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setLinkedinUrl("");
    setCompany("");
    setCompanySize("");
    setIndustry("");
    setCompanyLocation("");
    setStatus(columnStatus || "");
    setPipeline("");
    setPriority("Medium");
    setDealValue("10000");
    setCurrency("USD");
    setLeadScore("50");
    setProbability("50");
    setSource("");
    setSelectedChannels(["Email"]);
    setSelectedAvatar(AVATARS[0]);
    setTags([]);
    setTagInput("");

    handleOpenChange(false);
  };

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Add New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar Selection */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200">
              Avatar
            </Label>
            <div className="flex gap-3 mt-2 flex-wrap">
              {AVATARS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedAvatar(color)}
                  className={`
                    relative w-10 h-10 rounded-full overflow-hidden 
                    flex items-center justify-center transition-all border
                    ${
                      selectedAvatar === color
                        ? "ring-2 ring-blue-500 scale-110"
                        : "opacity-70 hover:opacity-100"
                    }
                  `}
                  style={{ backgroundColor: color }}>
                  <img
                    src="/image/sample-avatar.png"
                    alt="avatar"
                    className="w-10 h-10 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
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

          {/* Company Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Company *
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
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
                placeholder="500-1,000"
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
                placeholder="SaaS"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Location
              </Label>
              <Input
                value={companyLocation}
                onChange={(e) => setCompanyLocation(e.target.value)}
                placeholder="San Francisco, USA"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Deal Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Status *
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {statuses?.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Pipeline
              </Label>
              <Input
                value={pipeline}
                onChange={(e) => setPipeline(e.target.value)}
                placeholder="Enterprise"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Source
              </Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="LinkedIn Outreach"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Deal Value
              </Label>
              <Input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="10000"
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
                Lead Score
              </Label>
              <Input
                type="number"
                value={leadScore}
                onChange={(e) => setLeadScore(e.target.value)}
                placeholder="50"
                min="0"
                max="100"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
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

          {/* Channels */}
          <div>
            <Label className="text-sm font-medium dark:text-gray-200 block mb-2">
              Channels
            </Label>
            <div className="space-y-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel}
                    checked={selectedChannels.includes(channel)}
                    onCheckedChange={() => toggleChannel(channel)}
                  />
                  <label
                    htmlFor={channel}
                    className="text-sm cursor-pointer dark:text-gray-200">
                    {channel}
                  </label>
                </div>
              ))}
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
          <Button onClick={handleAddLead} className="flex-1">
            Add Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
