"use client";

import { useEffect, useState } from "react";
import { Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import LeadDetailSidebar from "./LeadDetailSidebar";
import { SecureImage } from "@/components/Common/SecureImage";

interface LeadsListProps {
  type: "people" | "company" | "deal" | "default_customers";
  columns: { key: string; label: string; visible: boolean }[];
  rows: any[];
  statuses: string[];
  onDelete: (id: string | number) => void;
  onUpdate: (lead: any) => void;
}

/* ------------------ NESTED KEY HELPERS ------------------ */
const getNestedValue = (obj: any, path: string) => {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

/* ------------------ MAP ROW DATA TO FULL LEAD ------------------ */
const mapToLead = (item: any, type: LeadsListProps["type"]) => {
  // DEFAULT CUSTOMER
  if (type === "default_customers") {
    return {
      ...item,
      id: `default_customers-${item.id}`,
      name: item.custom_data?.name || "Unnamed",
      email: item.email,
      phone: item.custom_data?.phone || "",
      avatar: "#dbeafe",
      company: "",
      companyId: null,
      createdAt: new Date(item.created_at || Date.now()),
    };
  }

  // PREVIOUS PIPELINE TYPES
  const companyObj = item.company || null;

  const lead: any = {
    ...item,
    id: `${type}-${item.id}`,
    pipeline: type,
    avatar: item.custom_fields?.avatar ?? item.avatar ?? "#dbeafe",
    name: item.full_name ?? item.name ?? item.title ?? "Untitled",

    company: companyObj?.name ?? item.company_name ?? item.companyName ?? item.company ?? item.name ?? "",
    companyId: companyObj?.id ?? item.company_id ?? item.companyId ?? item.id ?? null,
    industry: companyObj?.industry ?? item.industry ?? item.industry ?? "",
    companyLocation: companyObj?.location ?? item.location ?? "",
    companySize: companyObj?.size ?? item.companySize ?? item.size ?? "",

    priority: item.custom_fields?.priority ?? "Medium",
    dealValue: item.custom_fields?.dealValue ?? item.deal_value ?? 0,
    currency: item.custom_fields?.currency ?? "USD",
    probability: item.custom_fields?.probability ?? 0,

    createdAt: new Date(item.created_at || Date.now()),
  };

  if (type === "people") {
    const parts = (item.full_name ?? "").split(" ");
    lead.full_name = item.full_name ?? item.name ?? item.title ?? "";
    lead.firstName = item.firstName ?? parts[0] ?? "";
    lead.lastName = item.lastName ?? parts.slice(1).join(" ");
    lead.email = item.emails?.[0] ?? item.email ?? "";
    lead.phone = item.phones?.[0] ?? item.phone ?? "";
  }

  if (type === "company") {
    // For company type, ensure company-specific fields are properly set
    lead.company = item.name || "";
    lead.companyId = item.id;
    lead.size = item.size ?? item.companySize ?? "";
    lead.industry = item.industry ?? "";
    lead.location = item.location ?? item.companyLocation ?? "";
    lead.domain = item.domain ?? "";
    lead.website = item.website ?? "";
  }

  if (type === "deal") {
    lead.contactId = item.contact_id ?? null;
    lead.title = item.name ?? item.title ?? "";
  }

  return lead;
};

export default function LeadsList({
  type,
  columns,
  rows,
  statuses,
  onDelete,
  onUpdate,
}: LeadsListProps) {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const mapped = rows.map((r) => mapToLead(r, type));

  // Remove avatar column ALWAYS, because avatar is already in fixed left section
  const filteredColumns = columns
    .filter((c) => c.key !== "avatar")
    .filter((c) => !(type === "default_customers" && c.key === "email"));

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Check if avatar is an actual image (S3 key or URL)
  const hasAvatarImage = (avatar: any) => {
    if (!avatar || typeof avatar !== "string") return false;
    // If it's a color code, it's not an image
    if (avatar.startsWith("#")) return false;
    // If it's a placeholder path, treat as no image
    if (avatar.includes("sample-avatar")) return false;
    return true;
  };

  const getAvatarBg = (avatar: any) => {
    // if avatar is a color like "#fee2e2"
    if (typeof avatar === "string" && avatar.startsWith("#")) return avatar;

    return "transparent";
  };

  // Helper to generate stable light color for deal avatars based on ID
  const getStableLightColor = (id: string) => {
    const lightColors = [
      "#FEE2E2", // red-100
      "#DBEAFE", // blue-100
      "#D1FAE5", // green-100
      "#FEF3C7", // yellow-100
      "#FCE7F3", // pink-100
      "#E0E7FF", // indigo-100
      "#F3E8FF", // purple-100
      "#FED7AA", // orange-100
    ];

    // Simple hash function to get consistent index from ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % lightColors.length;
    return lightColors[index];
  };

  return (
    <>
      {/* SELECTED BAR */}
      {selected.size > 0 && (
        <div className="m-4 p-3 bg-blue-50 dark:bg-blue-900/20 border rounded-lg flex justify-between items-center">
          <span className="text-sm">{selected.size} selected</span>

          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                selected.forEach((id) => onDelete(id));
                setSelected(new Set());
              }}>
              <Trash2 className="h-4 w-4 text-red-600" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden">
        <div className="flex">
          {/* FIXED LEFT COLUMN */}
          <div className="w-80 border-r bg-background">
            <Table>
              <TableHeader>
                <TableHead className="h-12 flex items-center gap-3 px-4">
                  <Checkbox
                    checked={selected.size === mapped.length}
                    onCheckedChange={(c) => {
                      if (c) setSelected(new Set(mapped.map((r) => r.id)));
                      else setSelected(new Set());
                    }}
                  />
                  <span className="font-medium">Name</span>
                </TableHead>
              </TableHeader>

              <TableBody>
                {mapped.map((lead) => (
                  <div
                    key={lead.id}
                    className="h-[54px] flex items-center gap-3 px-4 border-b cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                    onMouseEnter={() => setHoveredRow(lead.id)}
                    onMouseLeave={() => setHoveredRow(null)}>
                    <div onClick={(e) => e.stopPropagation()}>
                      {hoveredRow === lead.id || selected.has(lead.id) ? (
                        <Checkbox
                          checked={selected.has(lead.id)}
                          onCheckedChange={(c) =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              c ? next.add(lead.id) : next.delete(lead.id);
                              return next;
                            })
                          }
                        />
                      ) : type === "deal" ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: getStableLightColor(lead.id) }}>
                          💰
                        </div>
                      ) : hasAvatarImage(lead.avatar) ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                          <SecureImage
                            src={lead.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600 overflow-hidden"
                          style={{ backgroundColor: getStableLightColor(lead.id) }}>
                          <img
                            src="/image/sample-avatar.png"
                            alt="avatar"
                            className="w-4 h-4 object-cover opacity-80"
                          />
                        </div>
                      )}
                    </div>

                    <span className="font-medium truncate">{lead.name}</span>
                  </div>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* SCROLLABLE RIGHT SIDE */}
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  {type === 'default_customers' && <TableHead className="min-w-[150px] px-4">
                    Email
                  </TableHead>}

                  {/* FIX: Use filteredColumns */}
                  {filteredColumns
                    .filter((c) => c.visible)
                    .map((c) => (
                      <TableHead key={c.key} className="min-w-[150px] px-4">
                        {c.label}
                      </TableHead>
                    ))}

                  <TableHead className="min-w-[80px] px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {mapped.map((lead) => (
                  <TableRow key={lead.id} className="h-[54px]">
                    {type === "default_customers" && <TableCell className="px-4">
                      {lead.email}
                    </TableCell>}

                    {/* FIX: Use filteredColumns */}
                    {filteredColumns
                      .filter((c) => c.visible)
                      .map((c) => (
                        <TableCell key={c.key} className="px-4">
                          {String(getNestedValue(lead, c.key) ?? "")}
                        </TableCell>
                      ))}

                    <TableCell className="px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(lead.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      {selectedLead && (
        <LeadDetailSidebar
          lead={selectedLead}
          statuses={statuses}
          pipelineType={type}
          onClose={() => setSelectedLead(null)}
          onDelete={(id) => onDelete(id)}
          onUpdate={(u) => {
            onUpdate(u);
            setSelectedLead(u);
          }}
        />
      )}
    </>
  );
}
