// app/(crm)/[viewId]/Pipelines.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import {
  getPipelineWithLead,
  getPipelineKanban,
} from "@/services/crm/pipelineServices";

import CrmBoard from "../../Kanban/CrmBoard";
import type { Lead, StatusColumn } from "@/types/crm";
import Loading from "@/app/loading";

export default function Pipelines() {
  const params = useParams();
  const view_id = params.viewId;
  const { toggleAutomateSidebar } = useSidebar();
  const [loading, setLoading] = useState(true);

  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [pipelineType, setPipelineType] = useState<
    "people" | "company" | "deal" | "default_customers" | null
  >(null);
  const [columns, setColumns] = useState<StatusColumn[]>([]);

  useEffect(() => {
    if (!view_id) return;

    const loadData = async () => {
      try {
        // STEP 1 — Load pipeline metadata
        const meta = await getPipelineWithLead(Number(view_id));

        if (!meta.pipelines || meta.pipelines.length === 0) {
          setPipelineId(null);
          setPipelineType(null);
          setColumns([]);
          return;
        }

        const pipeline = meta.pipelines[0];
        setPipelineId(pipeline.id);
        // pipeline_manage_type may now be "default_customers"
        setPipelineType(
          pipeline.pipeline_manage_type as
          | "people"
          | "company"
          | "deal"
          | "default_customers"
        );

        // STEP 2 — Load kanban data (entities)
        const kanban = await getPipelineKanban(pipeline.id);

        const formatted: StatusColumn[] = kanban.columns.map((c: any) => ({
          id: `col-${c.stage_id}`,
          title: c.stage_name,
          color: c.stage_color,
          order: c.order,

          leads: c.entities
            .filter((e: any) => e.data !== null)
            .map((e: any) => {
              const record = e.data; // ← full entity data
              const type = pipeline.pipeline_manage_type;

              const prefix =
                type === "people"
                  ? "people"
                  : type === "company"
                    ? "company"
                    : type === "deal"
                      ? "deal"
                      : "default_customers";

              // ---------------------------
              // DEFAULT CUSTOMERS
              // ---------------------------
              if (type === "default_customers") {
                return {
                  id: `${prefix}-${record.id}`,
                  name:
                    record.custom_data?.name ??
                    record.custom_data?.full_name ??
                    record.email ??
                    "Unnamed",
                  email: record.email ?? "",
                  phone:
                    record.custom_data?.phone ??
                    record.custom_data?.phone_number ??
                    "",
                  avatar: "#dbeafe",

                  company: "",
                  companyId: null,

                  status: c.stage_name,
                  priority: "Medium",
                  dealValue: 0,
                  currency: "USD",
                  probability: 0,

                  tags: [],
                  source: "",
                  channels: [],

                  lastActivityAt: record.updated_at
                    ? new Date(record.updated_at)
                    : new Date(),
                  nextFollowupAt: new Date(),
                  createdAt: new Date(record.created_at),
                  // keep raw customer data handy if needed
                  custom_data: record.custom_data ?? {},
                };
              }

              // ---------------------------
              // COMPANY PIPELINE
              // ---------------------------
              const companyObj = record.company || null;
              const contactObj = record.contact || null;

              if (type === "company") {
                return {
                  id: `${prefix}-${record.id}`,
                  name: record.name,
                  firstName: "",
                  lastName: "",
                  avatar: record.custom_fields?.avatar ?? "#dbeafe",
                  custom_fields: record.custom_fields ?? {},
                  email: "",
                  phone: "",
                  linkedinUrl: "",
                  jobTitle: "",

                  companyId: record.id,
                  company: record.name,
                  companySize: record.size ?? "",
                  industry: record.industry ?? "",
                  companyLocation: record.location ?? "",
                  domain: record.domain ?? "",
                  website: record.website ?? "",

                  contactId: null,
                  status: c.stage_name,
                  priority: "Medium",
                  dealValue: 0,
                  currency: "USD",
                  probability: 0,

                  tags: record.tags ?? [],
                  source: record.custom_fields?.source ?? "",
                  channels: record.custom_fields?.channels ?? [],
                  leadScore: 0,
                  pipeline: "company",

                  lastActivityAt: new Date(record.updated_at),
                  nextFollowupAt: new Date(),
                  createdAt: new Date(record.created_at),
                };
              }

              // ---------------------------
              // PEOPLE PIPELINE
              // ---------------------------
              if (type === "people") {
                let first = "";
                let last = "";
                if (record.full_name) {
                  const parts = record.full_name.split(" ");
                  first = parts[0] ?? "";
                  last = parts.slice(1).join(" ");
                }

                return {
                  id: `${prefix}-${record.id}`,
                  name: record.full_name,
                  firstName: first,
                  lastName: last,

                  email: record.emails?.[0] ?? "",
                  phone: record.phones?.[0] ?? "",
                  linkedinUrl: record.custom_fields?.linkedinUrl ?? "",
                  jobTitle: record.job_title ?? "",

                  avatar: record.custom_fields?.avatar ?? "#dbeafe",
                  custom_fields: record.custom_fields ?? {}, // ← ADD THIS

                  companyId: companyObj?.id ?? null,
                  company: companyObj?.name ?? "",
                  companySize: companyObj?.size ?? "",
                  industry: companyObj?.industry ?? "",
                  companyLocation: companyObj?.location ?? "",
                  domain: companyObj?.domain ?? "",
                  website: companyObj?.website ?? "",

                  contactId: null,
                  status: c.stage_name,

                  priority: record.custom_fields?.priority ?? "Medium",
                  dealValue: record.custom_fields?.dealValue ?? 0,
                  currency: record.custom_fields?.currency ?? "USD",
                  probability: record.custom_fields?.probability ?? 0,

                  tags: record.tags ?? [],
                  source: record.custom_fields?.source ?? "",
                  channels: record.custom_fields?.channels ?? [],
                  leadScore: 0,
                  pipeline: "people",

                  lastActivityAt: new Date(record.updated_at),
                  nextFollowupAt: new Date(),
                  createdAt: new Date(record.created_at),
                };
              }

              // ---------------------------
              // DEAL PIPELINE
              // ---------------------------
              return {
                id: `${prefix}-${record.id}`,
                name: record.title,

                avatar: record.custom_fields?.avatar ?? "#dbeafe",
                email: "",
                phone: "",
                linkedinUrl: "",
                jobTitle: "",
                custom_fields: record.custom_fields ?? {}, // ← ADD THIS

                contactId: contactObj?.id ?? null,
                companyId: companyObj?.id ?? null,

                company: companyObj?.name ?? "",
                companySize: companyObj?.size ?? "",
                industry: companyObj?.industry ?? "",
                companyLocation: companyObj?.location ?? "",
                domain: companyObj?.domain ?? "",
                website: companyObj?.website ?? "",

                status: record.status ?? c.stage_name,
                priority: record.custom_fields?.priority ?? "Medium",
                dealValue: record.custom_fields?.dealValue ?? 0,
                currency: record.custom_fields?.currency ?? "USD",
                probability: record.custom_fields?.probability ?? 0,

                tags: record.tags ?? [],
                source: record.custom_fields?.source ?? "",
                channels: record.custom_fields?.channels ?? [],
                leadScore: 0,
                pipeline: "deal",

                lastActivityAt: new Date(record.updated_at),
                nextFollowupAt: new Date(),
                createdAt: new Date(record.created_at),
              };
            }),
        }));

        setColumns(formatted);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load pipeline");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [view_id]);

  const handleRefreshPipeline = async () => {
    if (!view_id || !pipelineId) return;

    try {
      const kanban = await getPipelineKanban(pipelineId);
      const formatted: StatusColumn[] = kanban.columns.map((c: any) => ({
        id: `col-${c.stage_id}`,
        title: c.stage_name,
        color: c.stage_color,
        order: c.order,
        leads: c.entities
          .filter((e: any) => e.data !== null)
          .map((e: any) => {
            const record = e.data;
            const type = pipelineType;
            const prefix =
              type === "people"
                ? "people"
                : type === "company"
                  ? "company"
                  : type === "deal"
                    ? "deal"
                    : "default_customers";

            if (type === "default_customers") {
              return {
                id: `${prefix}-${record.id}`,
                name:
                  record.custom_data?.name ??
                  record.custom_data?.full_name ??
                  record.email ??
                  "Unnamed",
                email: record.email ?? "",
                phone:
                  record.custom_data?.phone ??
                  record.custom_data?.phone_number ??
                  "",
                avatar: "#dbeafe",
                company: "",
                companyId: null,
                status: c.stage_name,
                priority: "Medium",
                dealValue: 0,
                currency: "USD",
                probability: 0,
                tags: [],
                source: "",
                channels: [],
                lastActivityAt: record.updated_at
                  ? new Date(record.updated_at)
                  : new Date(),
                nextFollowupAt: new Date(),
                createdAt: new Date(record.created_at),
                custom_data: record.custom_data ?? {},
              };
            }

            const companyObj = record.company || null;
            const contactObj = record.contact || null;

            if (type === "company") {
              return {
                id: `${prefix}-${record.id}`,
                name: record.name,
                firstName: "",
                lastName: "",
                avatar: record.custom_fields?.avatar ?? "#dbeafe",
                custom_fields: record.custom_fields ?? {},
                email: "",
                phone: "",
                linkedinUrl: "",
                jobTitle: "",
                companyId: record.id,
                company: record.name,
                companySize: record.size ?? "",
                industry: record.industry ?? "",
                companyLocation: record.location ?? "",
                domain: record.domain ?? "",
                website: record.website ?? "",
                contactId: null,
                status: c.stage_name,
                priority: "Medium",
                dealValue: 0,
                currency: "USD",
                probability: 0,
                tags: record.tags ?? [],
                source: record.custom_fields?.source ?? "",
                channels: record.custom_fields?.channels ?? [],
                leadScore: 0,
                pipeline: "company",
                lastActivityAt: new Date(record.updated_at),
                nextFollowupAt: new Date(),
                createdAt: new Date(record.created_at),
              };
            }

            if (type === "people") {
              let first = "";
              let last = "";
              if (record.full_name) {
                const parts = record.full_name.split(" ");
                first = parts[0] ?? "";
                last = parts.slice(1).join(" ");
              }

              return {
                id: `${prefix}-${record.id}`,
                name: record.full_name,
                firstName: first,
                lastName: last,
                email: record.emails?.[0] ?? "",
                phone: record.phones?.[0] ?? "",
                linkedinUrl: record.custom_fields?.linkedinUrl ?? "",
                jobTitle: record.job_title ?? "",
                avatar: record.custom_fields?.avatar ?? "#dbeafe",
                custom_fields: record.custom_fields ?? {},
                companyId: companyObj?.id ?? null,
                company: companyObj?.name ?? "",
                companySize: companyObj?.size ?? "",
                industry: companyObj?.industry ?? "",
                companyLocation: companyObj?.location ?? "",
                domain: companyObj?.domain ?? "",
                website: companyObj?.website ?? "",
                contactId: null,
                status: c.stage_name,
                priority: record.custom_fields?.priority ?? "Medium",
                dealValue: record.custom_fields?.dealValue ?? 0,
                currency: record.custom_fields?.currency ?? "USD",
                probability: record.custom_fields?.probability ?? 0,
                tags: record.tags ?? [],
                source: record.custom_fields?.source ?? "",
                channels: record.custom_fields?.channels ?? [],
                leadScore: 0,
                pipeline: "people",
                lastActivityAt: new Date(record.updated_at),
                nextFollowupAt: new Date(),
                createdAt: new Date(record.created_at),
              };
            }

            return {
              id: `${prefix}-${record.id}`,
              name: record.title,
              avatar: record.custom_fields?.avatar ?? "#dbeafe",
              email: "",
              phone: "",
              linkedinUrl: "",
              jobTitle: "",
              custom_fields: record.custom_fields ?? {},
              contactId: contactObj?.id ?? null,
              companyId: companyObj?.id ?? null,
              company: companyObj?.name ?? "",
              companySize: companyObj?.size ?? "",
              industry: companyObj?.industry ?? "",
              companyLocation: companyObj?.location ?? "",
              domain: companyObj?.domain ?? "",
              website: companyObj?.website ?? "",
              status: record.status ?? c.stage_name,
              priority: record.custom_fields?.priority ?? "Medium",
              dealValue: record.custom_fields?.dealValue ?? 0,
              currency: record.custom_fields?.currency ?? "USD",
              probability: record.custom_fields?.probability ?? 0,
              tags: record.tags ?? [],
              source: record.custom_fields?.source ?? "",
              channels: record.custom_fields?.channels ?? [],
              leadScore: 0,
              pipeline: "deal",
              lastActivityAt: new Date(record.updated_at),
              nextFollowupAt: new Date(),
              createdAt: new Date(record.created_at),
            };
          }),
      }));

      setColumns(formatted);
    } catch (error) {
      console.error("Failed to refresh pipeline", error);
    }
  };


  if (loading) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg bg-background">

        <div className="flex relative flex-1 items-center justify-center">
          <Loading areaOnly />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)] bg-background">
      <div className="border-b-2 p-4 h-[60px] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <PanelLeft className="w-5 h-5" onClick={toggleAutomateSidebar} />
          <h2 className="text-xl font-semibold">Pipeline</h2>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        {pipelineId && pipelineType && (
          <CrmBoard
            initialColumns={columns}
            onColumnsChange={setColumns}
            pipelineId={pipelineId}
            pipelineType={pipelineType}
            onRefreshPipeline={handleRefreshPipeline}
          />
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
