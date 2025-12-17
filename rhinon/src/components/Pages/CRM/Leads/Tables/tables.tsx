"use client";

import { useEffect, useState } from "react";
import { PanelLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { useSidebar } from "@/context/SidebarContext";
import LeadsList from "../../Kanban/LeadsList";

import { getTableColumns } from "@/services/crm/tableServices";

import {
  getPerson,
  getCompany,
  getDeal,
  getCustomers,
  createPerson,
  createCompany,
  createLead,
  deletePerson,
  deleteCompany,
  deleteDeal,
  deleteCustomer,
} from "@/services/crm/entitiesServices";

import AddDealModal from "../../Kanban/AddDealModal";
import AddCompanyModal from "../../Kanban/AddCompanyModal";
import AddPersonModal from "../../Kanban/AddPersonModal";

import { Button } from "@/components/ui/button";
import { Lead } from "@/types/crm";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/app/loading";

export default function TablesPage() {
  const params = useParams();
  const view_id = Number(params.viewId);
  const [loading, setLoading] = useState(true);

  const { toggleAutomateSidebar } = useSidebar();

  // 🔥 NOW SUPPORT 4 TYPES
  const [manageType, setManageType] = useState<
    "people" | "company" | "deal" | "default_customers"
  >("company");

  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // LOAD COLUMNS + DATA
  const loadData = async () => {
    try {
      const res = await getTableColumns(view_id);

      setManageType(res.view_manage_type);
      setColumns(res.table_columns);
      setStatuses(res.table_columns.map((c: any) => c.label));

      let data: any[] = [];

      if (res.view_manage_type === "people") {
        const p = await getPerson();
        data = p.people || [];
      } else if (res.view_manage_type === "company") {
        const c = await getCompany();
        data = c.companies || [];
      } else if (res.view_manage_type === "deal") {
        const d = await getDeal();
        data = d.deals || [];
      } else if (res.view_manage_type === "default_customers") {
        const cu = await getCustomers();
        data = cu.customers || [];
      }

      setRows(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load table");
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view_id) loadData();
  }, [view_id]);

  // ADD ROW (CREATE)
  const handleAddRow = async (newLead: Omit<Lead, "id" | "createdAt">) => {
    try {
      let created: any = null;

      // PEOPLE
      if (manageType === "people") {
        const payload = {
          full_name: newLead.name,
          emails: newLead.email ? [newLead.email] : [],
          phones: newLead.phone ? [newLead.phone] : [],
          company_id: newLead.companyId ?? null,
          job_title: newLead.jobTitle ?? "",
          pipeline_id: null,
          pipeline_stage_id: null,
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
      }

      // COMPANY
      else if (manageType === "company") {
        const payload = {
          name: newLead.company || newLead.name,
          domain: newLead.domain || "",
          website: newLead.website || "",
          industry: newLead.industry || "",
          size: newLead.companySize || "",
          location: newLead.companyLocation || "",
          tags: newLead.tags || [],
          pipeline_id: null,
          pipeline_stage_id: null,
          custom_fields: {
            avatar: newLead.avatar,
          },
        };

        const res = await createCompany(payload);
        created = res.company ?? res;
      }

      // DEAL
      else if (manageType === "deal") {
        const payload = {
          title: newLead.name,
          contact_id: newLead.contactId ?? null,
          company_id: newLead.companyId ?? null,
          status: newLead.status,
          tags: newLead.tags || [],
          pipeline_id: null,
          pipeline_stage_id: null,
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
      }

      // hydrate UI
      const prefix =
        manageType === "people"
          ? "people"
          : manageType === "company"
            ? "company"
            : "deal";

      const createdId = created.id;

      const hydrated: Lead = {
        ...newLead,
        id: `${prefix}-${createdId}`,
        createdAt: new Date(),
      };

      setRows((prev) => [hydrated, ...prev]);

      toast.success("Created successfully");
    } catch (err) {
      console.error("Create error:", err);
      toast.error("Failed to create entry");
    }
  };

  // DELETE ROW
  const handleDeleteLead = async (id: string | number) => {
    const numericId = Number(String(id).split("-").pop());
    if (!numericId) return toast.error("Invalid ID");

    try {
      if (manageType === "people") await deletePerson(numericId);
      else if (manageType === "company") await deleteCompany(numericId);
      else if (manageType === "deal") await deleteDeal(numericId);
      else if (manageType === "default_customers")
        await deleteCustomer(numericId);

      setRows((prev) =>
        prev.filter((r) => Number(String(r.id).split("-").pop()) !== numericId)
      );

      toast.success("Deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete entry");
    }
  };

  const handleUpdateRow = (updated: Lead) => {
    setRows((prev) =>
      prev.map((row) => {
        const rowId = Number(String(row.id).split("-").pop());
        const updatedId = Number(String(updated.id).split("-").pop());

        if (rowId === updatedId) {
          return { ...row, ...updated };
        }
        return row;
      })
    );
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
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)]">
      {/* HEADER */}
      <div className="border-b h-[60px] px-4 flex justify-between items-center bg-background">
        <div className="flex gap-3 items-center">
          <PanelLeft onClick={toggleAutomateSidebar} />
          <h2 className="text-lg font-semibold capitalize">
            {manageType === "people" && "All People"}
            {manageType === "company" && "All Companies"}
            {manageType === "deal" && "All Deals"}
            {manageType === "default_customers" && "All Customers"}
          </h2>
        </div>

        <div>
          {!(manageType === "default_customers") ? (
            <Button onClick={() => setAddModalOpen(true)}>
              {manageType === "people"
                ? "Add Person"
                : manageType === "company"
                  ? "Add Company"
                  : "Add Deal"}
            </Button>
          ) : null}

          {/* PEOPLE */}
          {manageType === "people" && (
            <AddPersonModal
              isOpen={addModalOpen}
              onOpenChange={setAddModalOpen}
              statuses={statuses}
              columnStatus={statuses[0] || ""}
              createOnServer={false}
              onAdd={(lead) => {
                handleAddRow(lead);
                setAddModalOpen(false);
              }}
            />
          )}

          {/* COMPANY */}
          {manageType === "company" && (
            <AddCompanyModal
              isOpen={addModalOpen}
              onOpenChange={setAddModalOpen}
              statuses={statuses}
              columnStatus={statuses[0] || ""}
              createOnServer={false}
              onAdd={(company) => {
                handleAddRow(company);
                setAddModalOpen(false);
              }}
            />
          )}

          {/* DEAL */}
          {manageType === "deal" && (
            <AddDealModal
              isOpen={addModalOpen}
              onOpenChange={setAddModalOpen}
              statuses={statuses}
              columnStatus={statuses[0] || ""}
              people={[]}
              companies={[]}
              onAdd={(deal) => {
                handleAddRow(deal);
                setAddModalOpen(false);
              }}
            />
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 h-0">
      {/* TABLE */}
      <LeadsList
        type={manageType}
        columns={columns}
        rows={rows}
        statuses={statuses}
        onUpdate={handleUpdateRow}
        onDelete={handleDeleteLead}
      />
      </ScrollArea>
    </div>
  );
}
