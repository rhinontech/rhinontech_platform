// components/Kanban/LeadsColumn.tsx
"use client";

import { Plus, Trash2, MoreHorizontal } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Lead, StatusColumn } from "@/types/crm";
import LeadCard from "./LeadCard";
import PopoverSelect from "./PopoverSelect";

interface LeadsColumnProps {
  column: StatusColumn;
  pipelineType?: "people" | "company" | "deal" | "default_customers";
  onAddLead?: () => void;
  onDeleteColumn?: () => void;
  onLeadClick?: (lead: Lead) => void;
  onLeadDelete?: (leadId: string) => void;
  onAddLeadFromDropdown: any;
  allPeople: any;
  allCompanies: any;
  allCustomers?: any;
  columns: StatusColumn[];
}

export default function LeadsColumn({
  column,
  pipelineType = "people",
  onAddLead,
  onDeleteColumn,
  onLeadClick,
  onLeadDelete,
  onAddLeadFromDropdown,
  allPeople,
  allCompanies,
  allCustomers = [],
  columns,
}: LeadsColumnProps) {
  const totalValue = column.leads.reduce(
    (sum, lead) => sum + (lead.dealValue || 0),
    0
  );

  const getRealId = (leadId: string) => Number(leadId.split("-")[1]);

  // Collect all used ids in ALL columns
  const usedIds = new Set(
    columns.flatMap((col) =>
      col.leads.map((l) => {
        if (pipelineType === "people") return getRealId(l.id);
        if (pipelineType === "company") return l.companyId ?? null;
        if (pipelineType === "default_customers") return getRealId(l.id);
        return null;
      })
    )
  );

  let dropdownList: any[] = [];

  if (pipelineType === "people") {
    dropdownList = allPeople.filter((p: any) => !usedIds.has(p.id));
  } else if (pipelineType === "company") {
    dropdownList = allCompanies.filter((c: any) => !usedIds.has(c.id));
  } else if (pipelineType === "default_customers") {
    dropdownList = allCustomers.filter((cust: any) => !usedIds.has(cust.id));
  }

  return (
    <div className="shrink-0 w-80 flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* HEADER */}
      <div
        className="p-3 rounded-t-lg border-b border-gray-200 dark:border-gray-700 relative"
        style={{ backgroundColor: column.color }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900">
              {column.title}
            </h3>
            <span className="text-xs bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
              {column.leads.length}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-900 hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDeleteColumn}
                className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-xs text-gray-700">
          ${totalValue.toLocaleString()}
        </div>
      </div>

      {/* LEADS LIST */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 overflow-y-auto transition-colors ${snapshot.isDraggingOver
              ? "bg-gray-100 dark:bg-gray-800"
              : "bg-gray-50 dark:bg-gray-900/50"
              }`}>
            {column.leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(drag, snap) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    className={snap.isDragging ? "opacity-50" : ""}>
                    <LeadCard
                      lead={lead}
                      onClick={() => onLeadClick?.(lead)}
                      onDelete={() => onLeadDelete?.(lead.id)}
                      pipelineType={pipelineType}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* FOOTER — modified as per your request */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        {/* ✨ DEFAULT CUSTOMERS — ONLY SELECT EXISTING (NO CREATE BUTTON) */}
        {pipelineType === "default_customers" && (
          <PopoverSelect
            list={dropdownList}
            triggerText="Add Customer"
            onSelect={(cust: any) => onAddLeadFromDropdown(column.id, cust)}
            onCreate={undefined} // ⛔ DISABLED
            hideCreate // ⛔ completely removes the create button
          />
        )}

        {/* PEOPLE/COMPANY — same UI except create allowed */}
        {pipelineType !== "deal" && pipelineType !== "default_customers" && (
          <PopoverSelect
            list={dropdownList}
            triggerText={
              pipelineType === "people" ? "Add Person" : "Add Company"
            }
            onSelect={(item: any) => onAddLeadFromDropdown(column.id, item)}
            onCreate={() => onAddLead?.()}
          />
        )}

        {/* DEAL PIPELINE — same as before */}
        {pipelineType === "deal" && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onAddLead?.()}>
            Add Deal
          </Button>
        )}
      </div>
    </div>
  );
}
