// components/Kanban/LeadCard.tsx
"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Lead } from "@/types/crm";
import { CHANNEL_STYLES } from "@/lib/crm-data";
import { SecureImage } from "@/components/Common/SecureImage";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onDelete?: () => void;
  pipelineType?: "people" | "company" | "deal" | "default_customers";
}

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

export default function LeadCard({
  lead,
  onClick,
  onDelete,
  pipelineType = "people",
}: LeadCardProps) {
  const getPriorityColor = (p?: string) =>
  ({
    Low: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    Medium:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    High: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    Critical: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  }[p || "Medium"]);

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

  return (
    <div
      onClick={onClick}
      className="mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition cursor-pointer group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* -------------------- AVATAR LOGIC -------------------- */}
          <div className="w-7 h-7 flex-shrink-0">
            {(pipelineType === "people" || pipelineType === "company" || pipelineType === "default_customers") && (
              <>
                {hasAvatarImage(lead.avatar) ? (
                  <div
                    className="
                      w-7 h-7 rounded-full overflow-hidden
                      border border-gray-300 dark:border-gray-600
                      bg-gray-200 dark:bg-gray-700
                    ">
                    <SecureImage
                      src={lead.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600 overflow-hidden"
                    style={{ backgroundColor: getStableLightColor(lead.id) }}>
                    <img
                      src="/image/sample-avatar.png"
                      alt="avatar"
                      className="w-5 h-5 object-cover opacity-80"
                    />
                  </div>
                )}
              </>
            )}

            {pipelineType === "deal" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: getStableLightColor(lead.id) }}>
                <span className="text-base">💰</span>
              </div>
            )}
          </div>
          {/* ------------------------------------------------------- */}

          <div className="min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{lead.name}</h3>

            {pipelineType === "people" && lead.company && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {lead.company}
              </p>
            )}

            {pipelineType === "company" && lead.industry && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {lead.industry}
              </p>
            )}

            {pipelineType === "deal" && lead.company && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {lead.company}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* -------------------- DETAILS PER TYPE -------------------- */}

      {pipelineType === "people" && (
        <>
          <div className="text-xs mb-2">
            <div>🏢 {lead.company || "-"}</div>
            <div>📍 {lead.companyLocation || "-"}</div>
            <div>💼 {lead.industry || "-"}</div>
          </div>

          <div className="flex gap-2 mb-2 text-xs">
            <span className="px-2 py-1 rounded bg-indigo-100">
              Score: {lead.leadScore || 0}
            </span>
            <span className="px-2 py-1 rounded bg-teal-100">
              {lead.probability || 0}%
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {(Array.isArray(lead.channels) ? lead.channels : []).map((ch) => (
              <span
                key={ch}
                className={`text-xs px-1.5 py-0.5 rounded ${CHANNEL_STYLES[ch]}`}>
                {ch}
              </span>
            ))}
          </div>

          <div className="text-xs mb-2">🔎 {lead.source || "-"}</div>

          <div className="flex justify-between pt-2 border-t text-xs">
            <span
              className={`px-2 py-1 rounded ${getPriorityColor(
                lead.priority
              )}`}>
              {lead.priority || "Medium"}
            </span>

            <span className="font-semibold">
              ${Number(lead.dealValue || 0).toLocaleString()}{" "}
              {lead.currency || ""}
            </span>
          </div>
        </>
      )}

      {pipelineType === "company" && (
        <div className="text-xs mb-2 space-y-1">
          {lead.companyLocation && <div>📍 {lead.companyLocation}</div>}
          {lead.companySize && <div>👥 {lead.companySize}</div>}
          {lead.industry && <div>💼 {lead.industry}</div>}
        </div>
      )}

      {pipelineType === "deal" && (
        <div className="text-xs mb-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base">
              ${Number(lead.dealValue || 0).toLocaleString()}{" "}
              {lead.currency || "USD"}
            </span>

            <span className="px-2 py-1 rounded bg-teal-100 dark:bg-teal-900">
              {lead.probability || 0}%
            </span>
          </div>

          {lead.status && <div>📊 {lead.status}</div>}
        </div>
      )}

      {(pipelineType === "company" || pipelineType === "deal") &&
        lead.tags &&
        lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {lead.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                {tag}
              </span>
            ))}
            {lead.tags.length > 3 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                +{lead.tags.length - 3}
              </span>
            )}
          </div>
        )}

      {pipelineType === "deal" && (
        <div className="flex justify-between pt-2 border-t text-xs">
          <span
            className={`px-2 py-1 rounded ${getPriorityColor(lead.priority)}`}>
            {lead.priority || "Medium"}
          </span>
        </div>
      )}
    </div>
  );
}
