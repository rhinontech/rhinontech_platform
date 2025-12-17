// components/Pages/CRM/Kanban/CrmBoard.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { Lead, StatusColumn } from "@/types/crm";
import AddPersonModal from "./AddPersonModal";
import AddCompanyModal from "./AddCompanyModal";
import AddDealModal from "./AddDealModal";
import LeadDetailSidebar from "./LeadDetailSidebar";
import LeadsColumn from "./LeadsColumn";
import AddStageModal from "./AddStageModal";

import {
  updatePipeline,
  deleteStage,
  reorderStages,
  moveEntityStageService,
  deleteEntityService,
} from "@/services/crm/pipelineServices";

import {
  createPerson,
  createCompany,
  createLead,
  getPerson,
  getCompany,
  getCustomers,
} from "@/services/crm/entitiesServices";

interface CrmBoardProps {
  initialColumns: StatusColumn[];
  onColumnsChange?: (columns: StatusColumn[]) => void;
  pipelineId: number;
  pipelineType: "people" | "company" | "deal" | "default_customers";
  onRefreshPipeline?: () => void;
}

export default function CrmBoard({
  initialColumns,
  onColumnsChange,
  pipelineId,
  pipelineType,
  onRefreshPipeline,
}: CrmBoardProps) {
  const [columns, setColumns] = useState<StatusColumn[]>(initialColumns);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addLeadColumnId, setAddLeadColumnId] = useState<string | null>(null);

  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  // fetch for deal dropdowns
  // fetch people & companies for deal dropdowns and company create modal
  useEffect(() => {
    // People list needed only for deals or people
    if (pipelineType === "deal" || pipelineType === "people") {
      getPerson()
        .then((res) => {
          setAllPeople(Array.isArray(res.people) ? res.people : []);
        })
        .catch((err) => console.error("getPerson error", err));
    }

    // Companies for deal & company pipeline
    if (pipelineType === "deal" || pipelineType === "company") {
      getCompany()
        .then((res) => {
          setAllCompanies(Array.isArray(res.companies) ? res.companies : []);
        })
        .catch((err) => console.error("getCompany error", err));
    }

    // ⭐ FETCH CUSTOMERS for default customers pipeline
    if (pipelineType === "default_customers") {
      getCustomers()
        .then((res) => {
          setAllCustomers(Array.isArray(res.customers) ? res.customers : []);
        })
        .catch((err) => console.error("getCustomers error", err));
    }
  }, [pipelineType]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const updateColumns = (newColumns: StatusColumn[]) => {
    setColumns(newColumns);
    onColumnsChange?.(newColumns);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find((c) => c.id === source.droppableId);
    const destColumn = columns.find((c) => c.id === destination.droppableId);
    if (!sourceColumn || !destColumn) return;

    const lead = sourceColumn.leads.find((l) => l.id === draggableId);
    if (!lead) return;

    const entityId = parseInt(String(draggableId).split("-").pop() || "0", 10);
    if (!entityId || isNaN(entityId)) {
      toast.error("Invalid entity id");
      return;
    }

    if (sourceColumn.id === destColumn.id) {
      const updatedLeads = Array.from(sourceColumn.leads);
      const [moved] = updatedLeads.splice(source.index, 1);
      updatedLeads.splice(destination.index, 0, moved);

      const newColumns = columns.map((c) =>
        c.id === sourceColumn.id ? { ...c, leads: updatedLeads } : c
      );
      setColumns(newColumns);
      return;
    }

    const toStageId = Number(destColumn.id.replace("col-", ""));
    try {
      await moveEntityStageService(
        pipelineType,
        entityId,
        toStageId,
        pipelineId
      );
    } catch (err) {
      toast.error("Failed to update backend");
      return;
    }

    const newColumns = columns.map((col) => {
      if (col.id === sourceColumn.id) {
        return {
          ...col,
          leads: col.leads.filter((l) => l.id !== draggableId),
        };
      }
      if (col.id === destColumn.id) {
        const updatedLeads = [...col.leads];
        updatedLeads.splice(destination.index, 0, lead);
        return { ...col, leads: updatedLeads };
      }
      return col;
    });

    setColumns(newColumns);
    toast.success(`Moved to ${destColumn.title}`);
  };

  const handleDeleteLead = async (leadId: string) => {
    const entityId = parseInt(String(leadId).split("-").pop() || "0", 10);
    if (!entityId || isNaN(entityId)) {
      toast.error("Invalid id");
      return;
    }

    try {
      await deleteEntityService(pipelineType, entityId, pipelineId);
    } catch (e) {
      toast.error("Failed to delete");
      return;
    }

    const newColumns = columns.map((col) => ({
      ...col,
      leads: col.leads.filter((lead) => lead.id !== leadId),
    }));

    updateColumns(newColumns);
    setSelectedLead(null);
    toast.success("Deleted successfully");
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const newColumns = columns.map((col) => ({
      ...col,
      leads: col.leads.map((lead) =>
        lead.id === updatedLead.id ? updatedLead : lead
      ),
    }));

    updateColumns(newColumns);
    setSelectedLead(updatedLead);
  };

  // NOTE: handleAddLead calls backend (createPerson/createCompany/createLead)
  // For default_customers: *do not create* — show error and return (per your requirement)
  const handleAddLead = useCallback(
    async (columnId: string, newLead: Omit<Lead, "id" | "createdAt">) => {
      if (!pipelineId) {
        toast.error("Pipeline not found.");
        return;
      }

      // Block creation for default_customers
      if (pipelineType === "default_customers") {
        toast.error(
          "Cannot create customers from pipeline — use Customers list."
        );
        return;
      }

      const stageId = Number(columnId.replace("col-", ""));
      let created: any = null;

      try {
        // CREATE PERSON
        if (pipelineType === "people") {
          const payload = {
            full_name: newLead.name,
            emails: newLead.email ? [newLead.email] : [],
            phones: newLead.phone ? [newLead.phone] : [],
            company_id: newLead.companyId ?? null,
            job_title: newLead.jobTitle ?? "",
            pipeline_id: pipelineId,
            pipeline_stage_id: stageId,
            custom_fields: {
              avatar: newLead.avatar,
              tags: newLead.tags,
              linkedinUrl: newLead.linkedinUrl,
              priority: newLead.priority,
              dealValue: newLead.dealValue,
              source: newLead.source,
              channels: newLead.channels,
            },
          };

          const res = await createPerson(payload);
          created = res.person ?? res;
          await moveEntityStageService(
            pipelineType,
            created.id,
            stageId,
            pipelineId
          );

          setAllPeople((p) => [...p, created]);
        }

        // CREATE COMPANY
        else if (pipelineType === "company") {
          const payload = {
            name: newLead.company || newLead.name,
            domain: newLead.domain || "",
            website: newLead.website || "",
            industry: newLead.industry || "",
            size: newLead.companySize || "",
            location: newLead.companyLocation || "",
            tags: newLead.tags || [],
            pipeline_id: pipelineId,
            pipeline_stage_id: stageId,
            custom_fields: {
              avatar: newLead.avatar,
            },
          };

          const res = await createCompany(payload);
          created = res.company ?? res;
          await moveEntityStageService(
            pipelineType,
            created.id,
            stageId,
            pipelineId
          );
          setAllCompanies((c) => [...c, created]);
        }

        //CREATE DEAL
        else {
          const payload = {
            title: newLead.name,
            contact_id: newLead.contactId ?? null,
            company_id: newLead.companyId ?? null,
            status: newLead.status,
            tags: newLead.tags || [],
            pipeline_id: pipelineId,
            pipeline_stage_id: stageId,
            sort_order: 0,
            custom_fields: {
              avatar: newLead.avatar,
              priority: newLead.priority,
              dealValue: newLead.dealValue,
              currency: newLead.currency,
              probability: newLead.probability,
              source: newLead.source,
              channels: newLead.channels,
            },
          };

          const res = await createLead(payload);
          created = res.deal ?? res.lead ?? res;
          await moveEntityStageService(
            pipelineType,
            created.id,
            stageId,
            pipelineId
          );
          if (created.contact) setAllPeople((p) => [...p, created.contact]);
          if (created.company) setAllCompanies((c) => [...c, created.company]);
        }

        // -----------------------------------------------------
        //  BUILD UI LEAD (hydrate UI values)
        // -----------------------------------------------------
        const createdId = created?.id;

        const prefix =
          pipelineType === "people"
            ? "people"
            : pipelineType === "company"
              ? "company"
              : "deal";

        const leadWithId: Lead = {
          ...newLead,
          id: `${prefix}-${createdId}`,
          createdAt: new Date(),

          jobTitle: created.job_title ?? newLead.jobTitle,
          companyId: created.company_id ?? newLead.companyId,
          company: created.company?.name ?? newLead.company,
        };

        // add lead to UI column
        const newColumns = columns.map((col) =>
          col.id === columnId
            ? { ...col, leads: [...col.leads, leadWithId] }
            : col
        );

        updateColumns(newColumns);
        toast.success("Created successfully");
      } catch (err) {
        console.error("Create entity error:", err);
        toast.error("Failed to create entry");
      }
    },
    [columns, pipelineId, pipelineType, updateColumns]
  );

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const stageId = Number(columnId.replace("col-", ""));
      await deleteStage(pipelineId, stageId);

      const newColumns = columns.filter((c) => c.id !== columnId);
      updateColumns(newColumns);

      toast.success("Stage deleted");
    } catch (e) {
      toast.error("Failed to delete stage");
    }
  };

  const handleAddStage = async (stage: any) => {
    try {
      const newStages = [
        ...columns.map((c, index) => ({
          id: Number(c.id.replace("col-", "")),
          name: c.title,
          color: c.color,
          order: (c as any).order ?? index,
        })),
        {
          id: null,
          name: stage.name,
          color: stage.color,
          order: stage.order,
        },
      ];

      const response = await updatePipeline(pipelineId, {
        name: "Pipeline",
        stages: newStages,
      });

      const updatedStages = response?.stages;

      if (!updatedStages) {
        throw new Error("Backend did not return updated stages.");
      }

      const updatedColumns: StatusColumn[] = updatedStages.map((s: any) => ({
        id: `col-${s.id}`,
        title: s.name,
        color: s.color,
        order: s.order,
        leads: [],
      }));

      updatedColumns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setColumns(updatedColumns);

      toast.success("Stage added");
    } catch (err) {
      console.log("ADD STAGE ERROR:", err);
      toast.error("Failed to add stage");
    }
  };

  const handleColumnReorder = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination || type !== "COLUMN") return;

    const reordered = Array.from(columns);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    const newStages = reordered.map((c, index) => ({
      id: Number(c.id.replace("col-", "")),
      name: c.title,
      color: c.color,
      order: index,
    }));

    setColumns(reordered);

    try {
      await reorderStages(pipelineId, newStages);
      toast.success("Stage order updated");
    } catch (err) {
      toast.error("Failed to reorder stages");
    }
  };

  const buildLeadFromExisting = (
    selectedItem: any,
    columnStatus: string
  ): Omit<Lead, "id" | "createdAt"> => {
    // For default_customers we expect `selectedItem` shape { id, email, custom_data, ... }
    if (pipelineType === "default_customers") {
      return {
        name:
          selectedItem.custom_data?.name ??
          selectedItem.custom_data?.full_name ??
          selectedItem.email ??
          "",
        avatar: "#dbeafe",
        email: selectedItem.email ?? "",
        phone:
          selectedItem.custom_data?.phone ??
          selectedItem.custom_data?.phone_number ??
          "",
        contactId: null,
        companyId: null,
        firstName: "",
        lastName: "",
        linkedinUrl: "",
        company: "",
        companySize: "",
        companyLocation: "",
        industry: "",
        pipeline: "default_customers",
        status: columnStatus,
        priority: "Medium",
        dealValue: 0,
        currency: "USD",
        leadScore: 0,
        probability: 0,
        source: "",
        channels: [],
        tags: [],
        lastActivityAt: new Date(),
        nextFollowupAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        custom_data: selectedItem.custom_data ?? {},
      };
    }

    // PEOPLE pipeline
    if (pipelineType === "people") {
      let first = "";
      let last = "";
      if (selectedItem.full_name) {
        const parts = selectedItem.full_name.split(" ");
        first = parts[0] ?? "";
        last = parts.slice(1).join(" ");
      }

      return {
        name: selectedItem.full_name || "",
        firstName: first,
        lastName: last,
        avatar: selectedItem.custom_fields?.avatar ?? "#dbeafe",
        email: selectedItem.emails?.[0] ?? "",
        phone: selectedItem.phones?.[0] ?? "",
        linkedinUrl: selectedItem.custom_fields?.linkedinUrl ?? "",
        jobTitle: selectedItem.job_title ?? "",
        contactId: selectedItem.id ?? null,
        companyId: selectedItem.company_id ?? null,
        company: selectedItem.company?.name ?? "",
        companySize: selectedItem.company?.size ?? "",
        companyLocation: selectedItem.company?.location ?? "",
        industry: selectedItem.company?.industry ?? "",
        domain: selectedItem.company?.domain ?? "",
        website: selectedItem.company?.website ?? "",
        pipeline: "people",
        status: columnStatus,
        priority: selectedItem.custom_fields?.priority ?? "Medium",
        dealValue: selectedItem.custom_fields?.dealValue ?? 0,
        currency: selectedItem.custom_fields?.currency ?? "USD",
        leadScore: 0,
        probability: selectedItem.custom_fields?.probability ?? 0,
        source: selectedItem.custom_fields?.source ?? "",
        channels: selectedItem.custom_fields?.channels ?? [],
        tags: selectedItem.tags ?? [],
        lastActivityAt: new Date(),
        nextFollowupAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        custom_fields: selectedItem.custom_fields ?? {},
      };
    }

    // COMPANY pipeline
    if (pipelineType === "company") {
      return {
        name: selectedItem.name || "",
        firstName: "",
        lastName: "",
        avatar: selectedItem.custom_fields?.avatar ?? "#dbeafe",
        email: "",
        phone: "",
        linkedinUrl: "",
        jobTitle: "",
        contactId: null,
        companyId: selectedItem.id ?? null,
        company: selectedItem.name || "",
        companySize: selectedItem.size ?? "",
        companyLocation: selectedItem.location ?? "",
        industry: selectedItem.industry ?? "",
        domain: selectedItem.domain ?? "",
        website: selectedItem.website ?? "",
        pipeline: "company",
        status: columnStatus,
        priority: "Medium",
        dealValue: 0,
        currency: "USD",
        leadScore: 0,
        probability: 0,
        source: selectedItem.custom_fields?.source ?? "",
        channels: selectedItem.custom_fields?.channels ?? [],
        tags: selectedItem.tags ?? [],
        lastActivityAt: new Date(),
        nextFollowupAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        custom_fields: selectedItem.custom_fields ?? {},
      };
    }

    // DEAL pipeline (fallback)
    return {
      name: selectedItem.title || selectedItem.name || "",
      firstName: "",
      lastName: "",
      avatar: selectedItem.custom_fields?.avatar ?? "#dbeafe",
      email: "",
      phone: "",
      linkedinUrl: "",
      jobTitle: "",
      contactId: selectedItem.contact_id ?? null,
      companyId: selectedItem.company_id ?? null,
      company: selectedItem.company?.name ?? "",
      companySize: selectedItem.company?.size ?? "",
      companyLocation: selectedItem.company?.location ?? "",
      industry: selectedItem.company?.industry ?? "",
      domain: selectedItem.company?.domain ?? "",
      website: selectedItem.company?.website ?? "",
      pipeline: "deal",
      status: columnStatus,
      priority: selectedItem.custom_fields?.priority ?? "Medium",
      dealValue: selectedItem.custom_fields?.dealValue ?? 0,
      currency: selectedItem.custom_fields?.currency ?? "USD",
      leadScore: 0,
      probability: selectedItem.custom_fields?.probability ?? 0,
      source: selectedItem.custom_fields?.source ?? "",
      channels: selectedItem.custom_fields?.channels ?? [],
      tags: selectedItem.tags ?? [],
      lastActivityAt: new Date(),
      nextFollowupAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      custom_fields: selectedItem.custom_fields ?? {},
    };
  };

  const onAddLeadFromDropdown = async (columnId: string, selectedItem: any) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    const stageId = Number(columnId.replace("col-", ""));

    // For default_customers: simply move existing customer into stage with backend call
    try {
      await moveEntityStageService(
        pipelineType,
        selectedItem.id,
        stageId,
        pipelineId
      );
    } catch (err) {
      toast.error("Failed to add entity to pipeline");
      return;
    }

    const fullLead = buildLeadFromExisting(selectedItem, column.title);

    const prefix =
      pipelineType === "people"
        ? "people"
        : pipelineType === "company"
          ? "company"
          : pipelineType === "deal"
            ? "deal"
            : "default_customers";

    const uiLead = {
      ...fullLead,
      id: `${prefix}-${selectedItem.id}`,
      createdAt: new Date(),
    };

    const newCols = columns.map((col) =>
      col.id === columnId ? { ...col, leads: [...col.leads, uiLead] } : col
    );

    setColumns(newCols);
    onColumnsChange?.(newCols);

    toast.success("Added to pipeline");

    // Refresh pipeline to ensure full details are loaded
    if (onRefreshPipeline) {
      onRefreshPipeline();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <DragDropContext
        onDragEnd={(result) => {
          if (result.type === "COLUMN") handleColumnReorder(result);
          else handleDragEnd(result);
        }}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <Droppable
            droppableId="pipeline-columns"
            type="COLUMN"
            direction="horizontal">
            {(provided) => (
              <div
                className="flex gap-4 p-4 min-w-max h-full"
                ref={provided.innerRef}
                {...provided.droppableProps}>
                {columns.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}>
                        <LeadsColumn
                          column={column}
                          pipelineType={pipelineType}
                          allCompanies={allCompanies}
                          allPeople={allPeople}
                          allCustomers={allCustomers}
                          onAddLead={() => setAddLeadColumnId(column.id)}
                          onDeleteColumn={() => handleDeleteColumn(column.id)}
                          onLeadClick={setSelectedLead}
                          onLeadDelete={handleDeleteLead}
                          onAddLeadFromDropdown={onAddLeadFromDropdown}
                          columns={columns}
                        />

                        {addLeadColumnId === column.id && (
                          <>
                            {pipelineType === "people" && (
                              <AddPersonModal
                                isOpen
                                onOpenChange={(open) => {
                                  if (!open) setAddLeadColumnId(null);
                                }}
                                statuses={columns.map((col) => col.title)}
                                columnStatus={column.title}
                                createOnServer={false}
                                onAdd={(leadOrCreated: any) =>
                                  handleAddLead(column.id, {
                                    ...(leadOrCreated?.id
                                      ? {
                                        firstName: "",
                                        lastName: "",
                                        name:
                                          leadOrCreated.full_name ||
                                          leadOrCreated.name,
                                        avatar:
                                          leadOrCreated.custom_fields
                                            ?.avatar ?? "#dbeafe",
                                        email:
                                          leadOrCreated.emails?.[0] ?? "",
                                        phone:
                                          leadOrCreated.phones?.[0] ?? "",
                                        linkedinUrl: "",
                                        company: "",
                                        companySize: "",
                                        industry: "",
                                        companyLocation: "",
                                        contactId: null,
                                        companyId: null,
                                        status: column.title,
                                        pipeline: "",
                                        priority: "Medium",
                                        dealValue: 0,
                                        currency: "USD",
                                        leadScore: 0,
                                        probability: 0,
                                        source: "",
                                        channels: [],
                                        lastActivityAt: new Date(),
                                        nextFollowupAt: new Date(
                                          Date.now() + 3 * 24 * 60 * 60 * 1000
                                        ),
                                        tags: leadOrCreated.tags ?? [],
                                      }
                                      : leadOrCreated),
                                  })
                                }
                                triggerText="Add Person"
                              />
                            )}

                            {pipelineType === "company" && (
                              <AddCompanyModal
                                isOpen
                                onOpenChange={(open) => {
                                  if (!open) setAddLeadColumnId(null);
                                }}
                                statuses={columns.map((col) => col.title)}
                                columnStatus={column.title}
                                createOnServer={false}
                                onAdd={(leadOrCreated: any) =>
                                  handleAddLead(column.id, {
                                    ...(leadOrCreated?.id
                                      ? {
                                        firstName: "",
                                        lastName: "",
                                        name: leadOrCreated.name,
                                        avatar:
                                          leadOrCreated.custom_fields
                                            ?.avatar ?? "#dbeafe",
                                        email: "",
                                        phone: "",
                                        linkedinUrl: "",
                                        company: leadOrCreated.name,
                                        companySize: leadOrCreated.size ?? "",
                                        industry:
                                          leadOrCreated.industry ?? "",
                                        companyLocation:
                                          leadOrCreated.location ?? "",
                                        contactId: null,
                                        companyId: null,
                                        status: column.title,
                                        pipeline: "",
                                        priority: "Medium",
                                        dealValue: 0,
                                        currency: "USD",
                                        leadScore: 0,
                                        probability: 0,
                                        source: "",
                                        channels: [],
                                        lastActivityAt: new Date(),
                                        nextFollowupAt: new Date(
                                          Date.now() + 3 * 24 * 60 * 60 * 1000
                                        ),
                                        tags: leadOrCreated.tags ?? [],
                                      }
                                      : leadOrCreated),
                                  })
                                }
                                triggerText="Add Company"
                              />
                            )}

                            {pipelineType === "deal" && (
                              <AddDealModal
                                isOpen
                                people={allPeople}
                                companies={allCompanies}
                                onPersonCreated={(createdPerson: any) => {
                                  setAllPeople((prev) => [
                                    ...prev,
                                    createdPerson,
                                  ]);
                                }}
                                onCompanyCreated={(createdCompany: any) => {
                                  setAllCompanies((prev) => [
                                    ...prev,
                                    createdCompany,
                                  ]);
                                }}
                                onOpenChange={(open) => {
                                  if (!open) setAddLeadColumnId(null);
                                }}
                                statuses={columns.map((col) => col.title)}
                                columnStatus={column.title}
                                onAdd={(lead) =>
                                  handleAddLead(column.id, {
                                    ...lead,
                                    status: column.title,
                                  })
                                }
                                triggerText="Add Deal"
                              />
                            )}
                            {/* NOTE: default_customers -> no create modal */}
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}

                <div className="shrink-0 w-80 flex items-start">
                  <AddStageModal
                    onAdd={handleAddStage}
                    nextOrder={columns.length}
                  />
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {selectedLead && (
        <LeadDetailSidebar
          lead={selectedLead}
          statuses={columns.map((c) => c.title)}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
          pipelineType={pipelineType as any}
          pipelineId={pipelineId}
          columns={columns}
          onRefreshPipeline={onRefreshPipeline}
        />
      )}
    </div>
  );
}
