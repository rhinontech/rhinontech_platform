"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  X,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Eye,
  EyeOff,
  List,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_STYLES } from "@/lib/crm-data";
import type { Lead, Channel } from "@/types/crm";
import { TbBrandWhatsapp } from "react-icons/tb";
import { TabSwitch } from "@/components/Common/TabSwitch/TabSwitch";
import { CrmNotePlaceholders } from "@/components/Constants/SvgIcons";
import { Textarea } from "@/components/ui/textarea";
import {
  updateCompany,
  updateCustomer,
  updateLead,
  updatePerson,
} from "@/services/crm/entitiesServices";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { toast } from "sonner";
import { getAllGroupsWithView } from "@/services/crm/groupViewServices";
import { moveEntityStageService, deleteEntityService, getEntityPipelines, getPipelineWithLead } from "@/services/crm/pipelineServices";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SecureImage } from "@/components/Common/SecureImage";

interface LeadDetailSidebarProps {
  lead: Lead;
  statuses: string[];
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  pipelineType?: "people" | "company" | "deal" | "default_customers";
  pipelineId?: number;
  columns?: any[];
  onRefreshPipeline?: () => void; // Callback to refresh pipeline data
}

const CHANNEL_OPTIONS: Channel[] = [
  "Email",
  "Phone",
  "LinkedIn",
  "In-Person",
  "Chat",
  "Website",
];

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

export default function LeadDetailSidebar({
  lead,
  statuses,
  onClose,
  onUpdate,
  onDelete,
  pipelineType = "people",
  pipelineId,
  columns = [],
  onRefreshPipeline,
}: LeadDetailSidebarProps) {
  // local copy of lead
  const [editedLead, setEditedLead] = useState<Lead>({ ...lead });
  const [currentTab, setCurrentTab] = useState("details");
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [entityPipelines, setEntityPipelines] = useState<any[]>([]); // Track full pipeline data with view/group info
  const [viewPipelineMap, setViewPipelineMap] = useState<Map<number, number>>(new Map()); // Map view_id -> pipeline_id

  // field picker / add field state
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // prev committed field ref — holds { id, commit() } for the currently 'active' typed field.
  const prevCommitRef = useRef<{
    id: string;
    commit: () => void;
  } | null>(null);

  // Sync editedLead when lead prop changes
  useEffect(() => {
    setEditedLead({ ...lead });
  }, [lead]);

  // Fetch groups and entity's current pipelines on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all groups with views
        const data = await getAllGroupsWithView();
        if (data?.groups) {
          // Filter groups by pipeline type
          const filteredGroups = data.groups.filter(
            (group: any) => group.manage_type === pipelineType
          );
          setGroups(filteredGroups);

          // Build view -> pipeline mapping
          const mapping = new Map<number, number>();
          for (const group of filteredGroups) {
            for (const view of group.views || []) {
              if (view.view_type === 'pipeline') {
                // Fetch pipeline for this view
                try {
                  const pipelineData = await getPipelineWithLead(view.id);
                  if (pipelineData?.pipelines?.[0]?.id) {
                    mapping.set(view.id, pipelineData.pipelines[0].id);
                  }
                } catch (err) {
                  console.error(`Failed to fetch pipeline for view ${view.id}`, err);
                }
              }
            }
          }
          setViewPipelineMap(mapping);
        }

        // Fetch entity's current pipelines
        const entityId = Number(lead.id.split("-")[1]);
        const pipelinesData = await getEntityPipelines(pipelineType, entityId);
        if (pipelinesData?.pipelines) {
          setEntityPipelines(pipelinesData.pipelines);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [pipelineType, lead.id]);

  // debounce for bulk well-known fields
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const debounce = (fn: () => void, delay = 600) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fn, delay);
  };

  const toggleChannel = (channel: Channel | string) => {
    const list = Array.isArray(editedLead.channels) ? editedLead.channels : [];

    const newChannels = list.includes(channel as Channel)
      ? list.filter((c) => c !== channel)
      : [...list, channel as Channel];

    handleFieldChange("channels", newChannels);
  };

  // helper to get field container (custom_fields or custom_data)
  const fieldsContainer = useMemo(() => {
    if (pipelineType === "default_customers")
      return editedLead.custom_data ?? {};
    return editedLead.custom_fields ?? {};
  }, [editedLead, pipelineType]);

  // keep ordered keys (preserve object order) for picker and rendering
  const fieldKeys = Object.keys(fieldsContainer || {});

  // visible keys: show when isVisible !== false (hide notes and avatar from details)
  const visibleFieldKeys = fieldKeys.filter((k) => {
    if (k === "notes" || k === "avatar") return false;
    return fieldsContainer[k]?.isVisible !== false;
  });

  // network persist helpers
  const persistPartial = async (payload: any) => {
    const entityId = Number(lead.id.split("-")[1]);
    try {
      if (pipelineType === "people") await updatePerson(entityId, payload);
      else if (pipelineType === "company")
        await updateCompany(entityId, payload);
      else if (pipelineType === "deal") await updateLead(entityId, payload);
      else if (pipelineType === "default_customers")
        await updateCustomer(entityId, payload);
    } catch (err) {
      console.error("persistPartial error", err);
    }
  };

  const handleSidebarAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only People & Company can upload avatar
    if (pipelineType !== "people" && pipelineType !== "company") {
      e.target.value = "";
      toast.error("Avatar upload is only allowed for People & Company.");
      return;
    }

    try {
      const { key } = await uploadFileAndGetFullUrl(file);
      if (!key) throw new Error("Upload failed");

      // 1) UPDATE UI
      const updatedLead = {
        ...editedLead,
        avatar: key,
        custom_fields: {
          ...(editedLead.custom_fields || {}),
          avatar: key,
        },
      };

      setEditedLead(updatedLead);

      // 2) PASS TO PARENT
      onUpdate(updatedLead);

      // 3) SAVE TO BACKEND
      const entityId = Number(lead.id.split("-")[1]);

      if (pipelineType === "people") {
        await updatePerson(entityId, {
          custom_fields: { avatar: key },
        });
      }

      if (pipelineType === "company") {
        await updateCompany(entityId, {
          custom_fields: { avatar: key },
        });
      }

      toast.success("Avatar updated!");
    } catch (err) {
      console.error(err);
      toast.error("Avatar upload failed");
    } finally {
      e.target.value = ""; // reset input
    }
  };

  // Debounced save for built-in fields (full entity)
  const handleFieldChange = (field: keyof Lead, value: any) => {
    // update local state immediately
    setEditedLead((prev) => {
      const updated = { ...prev, [field]: value };

      // Update derived fields for immediate UI feedback
      if (pipelineType === "people") {
        if (field === "firstName" || field === "lastName") {
          (updated as any).full_name = (updated.firstName || "") + " " + (updated.lastName || "");
          updated.name = (updated as any).full_name; // Sync name for Kanban card display
        }
      } else if (pipelineType === "company") {
        if (field === "company") {
          updated.name = value; // Ensure name property is synced for Kanban display
        }
      } else if (pipelineType === "deal") {
        if (field === "name") {
          (updated as any).title = value; // Ensure title property is synced if used
        }
      }

      return updated;
    });

    // schedule backend save (debounced) for well-known fields
    const entityId = Number(lead.id.split("-")[1]);
    debounce(async () => {
      // Re-calculate updated object from current state to ensure we have latest values
      // We need to be careful with closure staleness, so we'll use the functional update pattern's result if possible,
      // but since we can't access it here easily, we'll reconstruct based on editedLead + new value.
      // However, editedLead might be stale inside debounce. 
      // A better approach is to use a ref for the latest state or just trust the closure if debounce is fast enough.
      // Given the architecture, let's construct the update payload carefully.

      const updated = { ...editedLead, [field]: value };

      // Sync derived fields again for persistence/onUpdate
      if (pipelineType === "people") {
        if (field === "firstName" || field === "lastName") {
          (updated as any).full_name = (updated.firstName || "") + " " + (updated.lastName || "");
          updated.name = (updated as any).full_name;
        }
      } else if (pipelineType === "company") {
        if (field === "company") {
          updated.name = value;
        }
      } else if (pipelineType === "deal") {
        if (field === "name") {
          (updated as any).title = value;
        }
      }

      const commonCustomFields = {
        avatar: updated.avatar,
        linkedinUrl: updated.linkedinUrl,
        channels: updated.channels,
        lastActivityAt: updated.lastActivityAt,
        nextFollowupAt: updated.nextFollowupAt,
      };

      try {
        if (pipelineType === "people") {
          await updatePerson(entityId, {
            full_name: (updated as any).full_name || ((updated.firstName || "") + " " + (updated.lastName || "")),
            emails: updated.email ? [updated.email] : [],
            phones: updated.phone ? [updated.phone] : [],
            custom_fields: commonCustomFields,
          });
        } else if (pipelineType === "company") {
          await updateCompany(entityId, {
            name: updated.company,
            size: updated.companySize,
            industry: updated.industry,
            location: updated.companyLocation,
            custom_fields: commonCustomFields,
          });
        } else if (pipelineType === "deal") {
          await updateLead(entityId, {
            title: updated.name,
            status: updated.status,
            tags: updated.tags,
            custom_fields: {
              ...commonCustomFields,
              priority: updated.priority,
              dealValue: updated.dealValue,
              probability: updated.probability,
            },
          });
        } else if (pipelineType === "default_customers") {
          await updateCustomer(entityId, {
            email: updated.email,
            custom_data: updated.custom_data,
          });
        }
      } catch (err) {
        console.error("handleFieldChange persist error", err);
      }

      // bubble up updated object to parent
      // IMPORTANT: Pass the fully updated object including derived fields
      onUpdate(updated);
    }, 600);
  };

  // inline update of a single custom field key (value or isVisible or options)
  const updateSingleCustomKey = (key: string, metaPatch: any) => {
    const containerKey =
      pipelineType === "default_customers" ? "custom_data" : "custom_fields";
    const prevContainer =
      pipelineType === "default_customers"
        ? editedLead.custom_data ?? {}
        : editedLead.custom_fields ?? {};
    const updatedContainer = {
      ...prevContainer,
      [key]: {
        ...(prevContainer[key] || {}),
        ...metaPatch,
      },
    };

    setEditedLead((prev) => ({
      ...prev,
      [containerKey]: updatedContainer,
    }));

    // persist partial
    const payload =
      pipelineType === "default_customers"
        ? { custom_data: { [key]: updatedContainer[key] } }
        : { custom_fields: { [key]: updatedContainer[key] } };

    persistPartial(payload);
    onUpdate({ ...editedLead, [containerKey]: updatedContainer });
  };

  // create new field helper
  const createNewField = async () => {
    if (!newFieldName.trim()) return;
    const meta: any = {
      type: newFieldType,
      isVisible: true,
      value:
        newFieldType === "boolean"
          ? newFieldValue === "true"
          : newFieldType === "number"
            ? Number(newFieldValue || 0)
            : newFieldType === "select" || newFieldType === "multiselect"
              ? (newFieldValue || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
              : newFieldType === "list:email" || newFieldType === "list:phone"
                ? []
                : newFieldValue || "",
    };

    if (newFieldType === "select" || newFieldType === "multiselect") {
      meta.options = (newFieldValue || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (newFieldType === "select" && meta.options.length)
        meta.value = meta.options[0];
    }

    updateSingleCustomKey(newFieldName, meta);

    setNewFieldName("");
    setNewFieldValue("");
    setNewFieldType("text");
    setShowAddFieldModal(false);
  };

  // reorder keys from picker
  const handleReorderKeys = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const keys = [...fieldKeys];
    const [moved] = keys.splice(source.index, 1);
    keys.splice(destination.index, 0, moved);

    const orderedObj: Record<string, any> = {};
    for (const k of keys) {
      orderedObj[k] = fieldsContainer[k];
    }

    const containerKey =
      pipelineType === "default_customers" ? "custom_data" : "custom_fields";
    setEditedLead((prev) => ({ ...prev, [containerKey]: orderedObj }));

    const payload =
      pipelineType === "default_customers"
        ? { custom_data: orderedObj }
        : { custom_fields: orderedObj };

    persistPartial(payload);
    onUpdate({ ...editedLead, [containerKey]: orderedObj });
  };

  const toggleVisibility = (key: string) => {
    const isVis = fieldsContainer[key]?.isVisible;
    updateSingleCustomKey(key, {
      isVisible: !(isVis === undefined ? true : isVis),
    });
  };

  // helpers for commit-on-enter/blur/focus-change behavior
  // CommitInput / CommitTextarea components will use these.
  const registerAndMaybeCommitPrevious = (id: string, commit: () => void) => {
    // called on focus: commit previous if it exists & is different
    const prev = prevCommitRef.current;
    if (prev && prev.id !== id) {
      try {
        prev.commit();
      } catch (e) {
        console.error("prev commit error", e);
      }
    }
    // set current as active
    prevCommitRef.current = { id, commit };
  };

  const unregisterIfMatches = (id: string) => {
    const prev = prevCommitRef.current;
    if (prev && prev.id === id) {
      prevCommitRef.current = null;
    }
  };

  // CommitInput: local state, commits on Enter/Blur, commits previous on focus
  function CommitInput({
    id,
    initial,
    onCommit,
    ...props
  }: {
    id: string;
    initial: any;
    onCommit: (val: any) => void;
  } & React.InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useState(initial ?? "");
    const lastCommitted = useRef<any>(initial);

    // sync when parent initial changes
    useEffect(() => {
      setValue(initial ?? "");
      lastCommitted.current = initial;
    }, [initial]);

    const commit = () => {
      if (value !== lastCommitted.current) {
        lastCommitted.current = value;
        onCommit(value);
      }
    };

    return (
      <Input
        {...props}
        value={value}
        onFocus={() => registerAndMaybeCommitPrevious(id, commit)}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          commit();
          unregisterIfMatches(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            // blur to unselect field
            (e.target as HTMLElement).blur();
          }
        }}
      />
    );
  }

  // CommitTextarea works similarly
  function CommitTextarea({
    id,
    initial,
    onCommit,
    ...props
  }: {
    id: string;
    initial: any;
    onCommit: (val: any) => void;
  } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const [value, setValue] = useState(initial ?? "");
    const lastCommitted = useRef<any>(initial);

    useEffect(() => {
      setValue(initial ?? "");
      lastCommitted.current = initial;
    }, [initial]);

    const commit = () => {
      if (value !== lastCommitted.current) {
        lastCommitted.current = value;
        onCommit(value);
      }
    };

    return (
      <Textarea
        {...props}
        value={value}
        onFocus={() => registerAndMaybeCommitPrevious(id, commit)}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          commit();
          unregisterIfMatches(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) === false) {
            // single-line Enter triggers commit+blur for user expectation
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
          }
        }}
      />
    );
  }

  // ClickToEditInput: shows as text, becomes input on click (like TaskDrawer)
  function ClickToEditInput({
    id,
    initial,
    onCommit,
    placeholder = "Click to edit...",
    type = "text",
    className = "",
    ...props
  }: {
    id: string;
    initial: any;
    onCommit: (val: any) => void;
    placeholder?: string;
    type?: string;
    className?: string;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'>) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initial ?? "");
    const inputRef = useRef<HTMLInputElement>(null);
    const lastCommitted = useRef<any>(initial);

    // Sync when parent initial changes
    useEffect(() => {
      setValue(initial ?? "");
      lastCommitted.current = initial;
    }, [initial]);

    // Auto-focus when entering edit mode
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const commit = () => {
      if (value !== lastCommitted.current) {
        lastCommitted.current = value;
        onCommit(value);
      }
    };

    const handleSave = () => {
      commit();
      setIsEditing(false);
      unregisterIfMatches(id);
    };

    const handleCancel = () => {
      setValue(lastCommitted.current);
      setIsEditing(false);
      unregisterIfMatches(id);
    };

    if (isEditing) {
      return (
        <Input
          {...props}
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => registerAndMaybeCommitPrevious(id, commit)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
            }
          }}
          className={className}
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors min-h-[36px] flex items-center ${className}`}
      >
        <span className={value ? "text-sm" : "text-sm text-muted-foreground"}>
          {value || placeholder}
        </span>
      </div>
    );
  }

  // ClickToEditTextarea: shows as text, becomes textarea on click
  function ClickToEditTextarea({
    id,
    initial,
    onCommit,
    placeholder = "Click to add description...",
    className = "",
    ...props
  }: {
    id: string;
    initial: any;
    onCommit: (val: any) => void;
    placeholder?: string;
    className?: string;
  } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initial ?? "");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCommitted = useRef<any>(initial);

    useEffect(() => {
      setValue(initial ?? "");
      lastCommitted.current = initial;
    }, [initial]);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [isEditing]);

    const commit = () => {
      if (value !== lastCommitted.current) {
        lastCommitted.current = value;
        onCommit(value);
      }
    };

    const handleSave = () => {
      commit();
      setIsEditing(false);
      unregisterIfMatches(id);
    };

    const handleCancel = () => {
      setValue(lastCommitted.current);
      setIsEditing(false);
      unregisterIfMatches(id);
    };

    if (isEditing) {
      return (
        <Textarea
          {...props}
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => registerAndMaybeCommitPrevious(id, commit)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
            }
          }}
          className={`min-h-[100px] resize-none ${className}`}
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors min-h-[60px] ${className}`}
      >
        <p className={`text-sm whitespace-pre-wrap ${value ? "" : "text-muted-foreground"}`}>
          {value || placeholder}
        </p>
      </div>
    );
  }


  // render an input for a single custom field meta (reads/writes meta.value)
  const renderCustomFieldEditor = (key: string) => {
    const meta = fieldsContainer[key] ?? { type: "text", value: "" };
    const type = meta.type ?? "text";
    const value = meta.value ?? "";

    const editValue = (v: any) => {
      updateSingleCustomKey(key, { value: v });
    };

    // id used to distinguish fields for commit ref
    const fieldId = `custom:${key}`;

    switch (type) {
      case "number":
        return (
          <ClickToEditInput
            id={fieldId}
            type="number"
            initial={value ?? ""}
            onCommit={(val) => editValue(val === "" ? "" : Number(val as any))}
            placeholder="Click to add number..."
            className="mt-1 text-sm"
          />
        );
      case "date":
        return (
          <ClickToEditInput
            id={fieldId}
            type="date"
            initial={value ? new Date(value).toISOString().split("T")[0] : ""}
            onCommit={(val) => editValue(val)}
            placeholder="Click to add date..."
            className="mt-1 text-sm"
          />
        );
      case "boolean":
        // boolean selects save immediately on change
        return (
          <Select
            value={String(value ?? "false")}
            onValueChange={(v) => {
              editValue(v === "true");
            }}>
            <SelectTrigger className="mt-1 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "longtext":
        return (
          <ClickToEditTextarea
            id={fieldId}
            initial={value}
            onCommit={(v) => editValue(v)}
            placeholder="Click to add text..."
            className="mt-1 text-sm"
          />
        );
      case "select":
        return (
          <Select
            value={value ?? ""}
            onValueChange={(v) => {
              // save immediately for selects
              editValue(v);
            }}>
            <SelectTrigger className="mt-1 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(meta.options || []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="flex flex-wrap gap-2">
            {(meta.options || []).map((opt: string) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return (
                <Badge
                  key={opt}
                  variant={selected ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const next = Array.isArray(value) ? [...value] : [];
                    if (next.includes(opt)) next.splice(next.indexOf(opt), 1);
                    else next.push(opt);
                    editValue(next);
                  }}>
                  {opt}
                </Badge>
              );
            })}
          </div>
        );
      case "list:email":
      case "list:phone":
        return (
          <div className="space-y-2">
            {Array.isArray(value)
              ? value.map((it: string, idx: number) => {
                const id = `custom:${key}:item:${idx}`;
                return (
                  <div key={idx} className="flex gap-2">
                    <ClickToEditInput
                      id={id}
                      initial={it}
                      onCommit={(v) => {
                        const next = Array.isArray(value) ? [...value] : [];
                        next[idx] = v;
                        editValue(next);
                      }}
                      placeholder="Click to add..."
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const next = Array.isArray(value) ? [...value] : [];
                        next.splice(idx, 1);
                        editValue(next);
                      }}>
                      -
                    </Button>
                  </div>
                );
              })
              : null}
            <Button
              size="sm"
              onClick={() =>
                editValue([...(Array.isArray(value) ? value : []), ""])
              }>
              + Add
            </Button>
          </div>
        );
      case "color":
        return (
          <Input
            type="color"
            value={value || "#dbeafe"}
            onChange={(e) => editValue(e.target.value)}
            className="mt-1"
          />
        );
      default:
        // text and fallback
        return (
          <ClickToEditInput
            id={fieldId}
            initial={value ?? ""}
            onCommit={(v) => editValue(v)}
            placeholder="Click to add text..."
            className="mt-1 text-sm"
          />
        );
    }
  };

  // format date helper used by builtin fields
  const formatDate = (date?: any) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // When component unmounts, commit any pending active field
  useEffect(() => {
    return () => {
      const prev = prevCommitRef.current;
      if (prev) {
        try {
          prev.commit();
        } catch { }
      }
    };
  }, []);

  // Handler for adding/removing entity from pipelines
  const handleTogglePipeline = async (viewId: number, isCurrentlyIn: boolean) => {
    try {
      const entityId = Number(lead.id.split("-")[1]);
      const pipelineIdToToggle = viewPipelineMap.get(viewId);

      if (!pipelineIdToToggle) {
        toast.error("Pipeline not found for this view");
        return;
      }

      if (isCurrentlyIn) {
        // Remove from this specific pipeline
        await deleteEntityService(pipelineType as any, entityId, pipelineIdToToggle);

        // Update local state
        setEntityPipelines(prev => prev.filter(p => p.pipeline_id !== pipelineIdToToggle));

        // If removing from current pipeline, close sidebar and refresh
        if (pipelineIdToToggle === pipelineId) {
          toast.success("Removed from current pipeline");
          onClose();
          if (onRefreshPipeline) {
            onRefreshPipeline();
          }
        } else {
          toast.success("Removed from pipeline");
        }
      } else {
        // Add to pipeline - use stage ID 1 as first stage
        const firstStageId = 1;

        await moveEntityStageService(
          pipelineType as any,
          entityId,
          firstStageId,
          pipelineIdToToggle
        );

        // Update local state
        const newPipelineData = {
          pipeline_id: pipelineIdToToggle,
          view_id: viewId,
          stage_id: firstStageId,
        };
        setEntityPipelines(prev => [...prev, newPipelineData]);
        toast.success("Added to pipeline");

        // Refresh parent to show full details
        if (onRefreshPipeline) {
          onRefreshPipeline();
        }
      }
    } catch (error) {
      console.error("Failed to toggle pipeline", error);
      toast.error("Failed to update pipeline");
    }
  };

  // Get current views/groups this entity is in
  const currentViews = entityPipelines.map((ep: any) => {
    // Find which group/view this pipeline belongs to
    for (const group of groups) {
      for (const view of group.views || []) {
        // Match by view_id from entity pipeline data
        if (view.id === ep.view_id) {
          return {
            group_id: group.id,
            group_name: group.group_name,
            view_id: view.id,
            view_name: view.view_name,
            pipeline_id: ep.pipeline_id,
          };
        }
      }
    }
    return null;
  }).filter(Boolean);

  // ---------- JSX render ----------
  return (
    <div className="fixed inset-y-0 right-0 w-148 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col w-full">
        <div className="flex items-center h-[66px] px-4 border-b-2 gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <p className="text-sm text-foreground">View in</p>

            {/* Current views as pills */}
            {currentViews.map((cv: any) => (
              <span key={cv.view_id} className="px-2 py-1 border border-accent-foreground rounded-full text-sm flex items-center gap-1">
                {cv.group_name} / {cv.view_name}
              </span>
            ))}

            {/* Add to group/view button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                  <Input placeholder="Search" className="w-full" />
                  <p className="text-sm text-muted-foreground">Select pipeline view</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groups.map((group: any) => {
                      // Get pipeline views for this group
                      const pipelineViews = (group.views || []).filter((v: any) => v.view_type === 'pipeline');

                      return pipelineViews.map((view: any) => {
                        // Check if entity is in this view's pipeline
                        const isInView = entityPipelines.some((ep: any) => ep.view_id === view.id);

                        return (
                          <div
                            key={view.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePipeline(view.id, isInView);
                            }}>
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isInView ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                              {isInView && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-sm">{group.group_name} / {view.view_name}</span>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Delete Button - Top Right */}
          <div className="ml-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lead? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(editedLead.id);
                      onClose();
                    }}
                    className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Avatar and Name */}
        <div className="flex items-center gap-3 p-4 pb-0">
          {/* Avatar with Upload */}
          <div className="w-12 h-12">
            {(pipelineType === "people" || pipelineType === "company") && (
              <div className="relative w-12 h-12">
                {/* SAFE AVATAR RESOLVE */}
                {(() => {
                  const avatarUrl =
                    typeof editedLead.avatar === "string"
                      ? editedLead.avatar
                      : editedLead.custom_fields?.avatar ?? "";

                  // Check if avatar is an actual image
                  const hasImage = avatarUrl &&
                    !avatarUrl.startsWith("#") &&
                    !avatarUrl.includes("sample-avatar");

                  // Get initials from name
                  const getInitials = (name: string) => {
                    if (!name) return "?";
                    const parts = name.trim().split(" ");
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  };

                  return (
                    <div
                      onClick={() =>
                        document.getElementById("sidebarAvatarInput")?.click()
                      }
                      className="
              w-12 h-12 rounded-full cursor-pointer overflow-hidden
              border border-gray-300 dark:border-gray-600
              flex items-center justify-center bg-gray-200 dark:bg-gray-700
              hover:opacity-90 transition
            ">
                      {hasImage ? (
                        <SecureImage
                          src={avatarUrl}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: getStableLightColor(editedLead.id) }}>
                          <img
                            src="/image/sample-avatar.png"
                            alt="avatar"
                            className="w-10 h-10 object-cover opacity-80"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* upload input */}
                <input
                  type="file"
                  id="sidebarAvatarInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSidebarAvatarUpload}
                />
              </div>
            )}

            {/* DEAL → Stable Light Color Background */}
            {pipelineType === "deal" && (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: getStableLightColor(lead.id) }}>
                <span className="text-xl">💰</span>
              </div>
            )}

            {/* DEFAULT_CUSTOMERS → Placeholder only */}
            {pipelineType === "default_customers" && (
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border">
                <img
                  src="/image/sample-avatar.png"
                  className="w-8 h-8 opacity-70"
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {editedLead.pipeline} Lead
            </p>
            <p className="text-lg font-semibold dark:text-gray-100">
              {editedLead.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {editedLead.company}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4">
          {/* EMAIL BUTTON — only if email exists */}
          {editedLead.email && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => window.open(`mailto:${editedLead.email}`)}>
              <Mail /> Email
            </Button>
          )}

          {/* WHATSAPP BUTTON — only if phone exists; USING 91 prefix */}
          {editedLead.phone && (
            <Button
              variant="outline"
              className="rounded-full h-9 w-9 flex items-center justify-center"
              onClick={() =>
                window.open(
                  `https://api.whatsapp.com/send/?phone=91${editedLead.phone}&text&type=phone_number&app_absent=0`,
                  "_blank"
                )
              }>
              <TbBrandWhatsapp />
            </Button>
          )}

          {/* PHONE BUTTON — only if phone exists */}
          {editedLead.phone && (
            <Button
              variant="outline"
              className="rounded-full h-9 w-9 flex items-center justify-center"
              onClick={() => window.open(`tel:${editedLead.phone}`)}>
              <Phone />
            </Button>
          )}
        </div>

        <TabSwitch
          tabs={[
            { label: "Details", id: "details" },
            { label: "Notes", id: "notes" },
          ]}
          defaultTab="details"
          onTabChange={(t) => setCurrentTab(t)}
        />
      </div>

      {/* Details */}
      <ScrollArea className="flex-1 h-0">
        {currentTab === "details" && (
          <div className="flex-1 p-4 space-y-4">
            {/* Built-in fields (people) */}
            {pipelineType === "people" && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Personal Info
                </h3>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    First Name
                  </Label>
                  <ClickToEditInput
                    id="builtin:firstName"
                    initial={editedLead.firstName || ""}
                    onCommit={(val) => handleFieldChange("firstName", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Last Name
                  </Label>
                  <ClickToEditInput
                    id="builtin:lastName"
                    initial={editedLead.lastName || ""}
                    onCommit={(val) => handleFieldChange("lastName", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Email
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <ClickToEditInput
                      id="builtin:email"
                      type="email"
                      initial={editedLead.email || ""}
                      onCommit={(val) => handleFieldChange("email", val)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm flex-1"
                    />
                    {editedLead.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(`mailto:${editedLead.email || ""}`)
                        }>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Phone
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <ClickToEditInput
                      id="builtin:phone"
                      initial={editedLead.phone || ""}
                      onCommit={(val) => handleFieldChange("phone", val)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm flex-1"
                    />
                    {editedLead.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(`tel:${editedLead.phone || ""}`)
                        }>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    LinkedIn
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <ClickToEditInput
                      id="builtin:linkedinUrl"
                      initial={editedLead.linkedinUrl || ""}
                      onCommit={(val) => handleFieldChange("linkedinUrl", val)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm flex-1"
                    />
                    {editedLead.linkedinUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(editedLead.linkedinUrl || "", "_blank")
                        }>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Company, Deal, Customer sections retained — internal fields use CommitInput similarly */}
            {pipelineType === "company" && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Company Info
                </h3>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Company Name
                  </Label>
                  <ClickToEditInput
                    id="builtin:company"
                    initial={editedLead.company || ""}
                    onCommit={(val) => handleFieldChange("company", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Company Size
                  </Label>
                  <ClickToEditInput
                    id="builtin:companySize"
                    initial={editedLead.companySize || ""}
                    onCommit={(val) => handleFieldChange("companySize", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Industry
                  </Label>
                  <ClickToEditInput
                    id="builtin:industry"
                    initial={editedLead.industry || ""}
                    onCommit={(val) => handleFieldChange("industry", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Location
                  </Label>
                  <ClickToEditInput
                    id="builtin:companyLocation"
                    initial={editedLead.companyLocation || ""}
                    onCommit={(val) => handleFieldChange("companyLocation", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            )}

            {pipelineType === "deal" && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Deal Info
                </h3>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Deal Name
                  </Label>
                  <ClickToEditInput
                    id="builtin:dealName"
                    initial={editedLead.name || ""}
                    onCommit={(val) => handleFieldChange("name", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Only show status in pipeline view, hide in table/deal view */}
                  {statuses && statuses.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium dark:text-gray-200">
                        Status
                      </Label>
                      <Select
                        value={editedLead.status || ""}
                        onValueChange={async (value) => {
                          // Update the status field
                          handleFieldChange("status", value);

                          // Also update the pipeline stage
                          if (pipelineId && columns && columns.length > 0) {
                            try {
                              const targetStage = columns.find((col) => col.title === value);
                              if (targetStage && targetStage.id) {
                                const entityId = Number(lead.id.split("-")[1]);
                                await moveEntityStageService(
                                  pipelineType as any,
                                  entityId,
                                  targetStage.id,
                                  pipelineId
                                );
                                toast.success("Pipeline stage updated");
                              }
                            } catch (error) {
                              console.error("Failed to update pipeline stage", error);
                              toast.error("Failed to update pipeline stage");
                            }
                          }
                        }}>
                        <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {statuses?.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium dark:text-gray-200">
                      Priority
                    </Label>
                    <Select
                      value={editedLead.priority || "Medium"}
                      onValueChange={(value) =>
                        handleFieldChange("priority", value as any)
                      }>
                      <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium dark:text-gray-200">
                      Deal Value
                    </Label>
                    <ClickToEditInput
                      id="builtin:dealValue"
                      type="number"
                      initial={editedLead.dealValue ?? 0}
                      onCommit={(val) =>
                        handleFieldChange("dealValue", Number(val))
                      }
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium dark:text-gray-200">
                      Currency
                    </Label>
                    <Select
                      value={editedLead.currency || "USD"}
                      onValueChange={(value) => handleFieldChange("currency", value)}>
                      <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm">
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
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Probability (%)
                  </Label>
                  <ClickToEditInput
                    id="builtin:probability"
                    type="number"
                    initial={editedLead.probability ?? 0}
                    onCommit={(val) =>
                      handleFieldChange("probability", Number(val))
                    }
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            )}

            {pipelineType === "default_customers" && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Customer Info
                </h3>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Name
                  </Label>
                  <ClickToEditInput
                    id="builtin:customer_name"
                    initial={editedLead.custom_data?.name || ""}
                    onCommit={(val) =>
                      handleFieldChange("custom_data", {
                        ...(editedLead.custom_data || {}),
                        name: val,
                      })
                    }
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Email
                  </Label>
                  <ClickToEditInput
                    id="builtin:customer_email"
                    initial={editedLead.email || ""}
                    onCommit={(val) => handleFieldChange("email", val)}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Phone
                  </Label>
                  <ClickToEditInput
                    id="builtin:customer_phone"
                    initial={editedLead.custom_data?.phone || ""}
                    onCommit={(val) =>
                      handleFieldChange("custom_data", {
                        ...(editedLead.custom_data || {}),
                        phone: val,
                      })
                    }
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Activity */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Activity
              </h3>

              <div>
                <Label className="text-xs font-medium dark:text-gray-200">
                  Source
                </Label>
                <ClickToEditInput
                  id="builtin:source"
                  initial={editedLead.source || ""}
                  onCommit={(val) => handleFieldChange("source", val)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Last Activity
                  </Label>
                  <ClickToEditInput
                    id="builtin:lastActivityAt"
                    type="date"
                    initial={formatDate(editedLead?.lastActivityAt)}
                    onCommit={(val) =>
                      handleFieldChange(
                        "lastActivityAt",
                        val ? new Date(val) : null
                      )
                    }
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium dark:text-gray-200">
                    Next Followup
                  </Label>
                  <ClickToEditInput
                    id="builtin:nextFollowupAt"
                    type="date"
                    initial={formatDate(editedLead?.nextFollowupAt)}
                    onCommit={(val) =>
                      handleFieldChange(
                        "nextFollowupAt",
                        val ? new Date(val) : null
                      )
                    }
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Channels
              </Label>

              {(() => {
                // Normalize channels safely inside component
                let channels: string[] = [];

                const raw = editedLead?.channels;

                if (Array.isArray(raw)) {
                  channels = raw;
                } else if (typeof raw === "string") {
                  try {
                    channels = JSON.parse(raw);
                    if (!Array.isArray(channels)) channels = [];
                  } catch {
                    channels = [];
                  }
                } else {
                  channels = [];
                }

                return (
                  <>
                    {/* Selected Channels */}
                    <div className="flex flex-wrap gap-2">
                      {channels.map((channel) => (
                        <Badge
                          key={channel}
                          variant="secondary"
                          className={`cursor-pointer ${CHANNEL_STYLES[channel]}`}
                          onClick={() => toggleChannel(channel)}>
                          {channel}
                        </Badge>
                      ))}
                    </div>

                    {/* Add Channels */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {CHANNEL_OPTIONS.filter((c) => !channels.includes(c)).map(
                        (channel) => (
                          <Badge
                            key={channel}
                            variant="outline"
                            className="cursor-pointer opacity-50 hover:opacity-100"
                            onClick={() => toggleChannel(channel)}>
                            + {channel}
                          </Badge>
                        )
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {editedLead?.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom fields */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fields
              </h3>

              {visibleFieldKeys.length === 0 && (
                <p className="text-sm text-gray-500">
                  No visible custom fields. Use Fields → to add or show fields.
                </p>
              )}

              {visibleFieldKeys.map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs font-medium dark:text-gray-200">
                    {key}
                  </Label>
                  <div>{renderCustomFieldEditor(key)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes tab (keeps the original notes behavior — single textarea, saves on change) */}
        {currentTab === "notes" && (
          <div className="flex-1 p-4 space-y-4">
            {(() => {
              const container =
                pipelineType === "default_customers"
                  ? editedLead.custom_data ?? {}
                  : editedLead.custom_fields ?? {};
              const notesMeta = container["notes"];
              const notesValue = notesMeta?.value ?? "";

              return (
                <>
                  <Textarea
                    placeholder="Write a note here..."
                    value={notesValue}
                    onChange={(e) => {
                      updateSingleCustomKey("notes", {
                        type: "notes",
                        value: e.target.value,
                      });
                    }}
                    className="border border-accent rounded-none min-h-[180px]"
                  />

                  {!notesValue && (
                    <div className="flex flex-col items-center justify-center opacity-60">
                      <CrmNotePlaceholders />
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Add a note
                      </h3>
                      <p className="text-sm text-accent-foreground text-center">
                        Track important updates or details about this contact
                        here.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </ScrollArea>

      {/* Fixed Buttons at Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          {/* Create New Field Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="start">
              <div className="space-y-3">
                <h3 className="font-semibold">Create New Field</h3>
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Enter field name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={newFieldType} onValueChange={setNewFieldType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multiselect">Multi-Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Value Input based on type */}
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  {newFieldType === "boolean" ? (
                    <Select
                      value={newFieldDefaultValue}
                      onValueChange={setNewFieldDefaultValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={newFieldDefaultValue}
                      onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                      placeholder="Enter default value"
                      type={newFieldType === "number" ? "number" : "text"}
                    />
                  )}
                </div>

                {/* Options for Select/MultiSelect */}
                {(newFieldType === "select" || newFieldType === "multiselect") && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        placeholder="Add option"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newOptionInput.trim()) {
                            e.preventDefault();
                            if (!newFieldOptions.includes(newOptionInput.trim())) {
                              setNewFieldOptions([...newFieldOptions, newOptionInput.trim()]);
                            }
                            setNewOptionInput("");
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (newOptionInput.trim()) {
                            if (!newFieldOptions.includes(newOptionInput.trim())) {
                              setNewFieldOptions([...newFieldOptions, newOptionInput.trim()]);
                            }
                            setNewOptionInput("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newFieldOptions.map(opt => (
                        <Badge key={opt} variant="secondary" className="flex items-center gap-1">
                          {opt}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setNewFieldOptions(newFieldOptions.filter(o => o !== opt))}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (newFieldName.trim()) {
                      const meta: any = {
                        type: newFieldType,
                        isVisible: true,
                        value: newFieldType === "boolean"
                          ? newFieldDefaultValue === "true"
                          : newFieldDefaultValue,
                      };

                      if (newFieldType === "select" || newFieldType === "multiselect") {
                        meta.options = newFieldOptions;
                        // For select, ensure value is one of the options if set
                        if (newFieldType === "select" && newFieldDefaultValue && !newFieldOptions.includes(newFieldDefaultValue)) {
                          // If default not in options, maybe add it or warn? 
                          // For now, let's just allow it or clear it.
                        }
                      }

                      // Use updateSingleCustomKey to persist
                      updateSingleCustomKey(newFieldName, meta);

                      setNewFieldName("");
                      setNewFieldDefaultValue("");
                      setNewFieldOptions([]);
                      setNewOptionInput("");

                      toast.success("Field created");
                    }
                  }}
                  className="w-full">
                  Add Field
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Visible Fields Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Visible
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="end">
              <div className="space-y-3">
                <h3 className="font-semibold">Manage Visible Fields</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {fieldKeys.map((key: string) => {
                    // Filter out internal fields like avatar/notes from this list too if desired
                    if (key === "avatar" || key === "notes") return null;

                    const container =
                      pipelineType === "default_customers"
                        ? editedLead.custom_data ?? {}
                        : editedLead.custom_fields ?? {};
                    const currentMeta = container[key];
                    // Check isVisible property correctly
                    const isVisible = currentMeta?.isVisible !== false;

                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle visibility using updateSingleCustomKey to persist
                          updateSingleCustomKey(key, {
                            isVisible: !isVisible,
                          });
                        }}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${isVisible ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {isVisible && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm">{key}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>


      {/* Field Picker Drawer */}
      {showFieldPicker && (
        <div className="fixed inset-y-0 right-[22rem] w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-60 shadow-lg flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Input placeholder="Search a field" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFieldPicker(false)}>
                <X />
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2">Fields</div>
          </div>

          {/* Scrollable Field List */}
          <div className="flex-1 overflow-auto p-3">
            <DragDropContext onDragEnd={handleReorderKeys}>
              <Droppable droppableId="picker">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2">
                    {fieldKeys.map((key, i) => {
                      const meta = fieldsContainer[key] ?? {};
                      const isVisible = meta.isVisible !== false;

                      return (
                        <Draggable draggableId={key} index={i} key={key}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="p-2 rounded-md flex items-center justify-between border bg-white dark:bg-gray-900">
                              <div className="flex items-center gap-2">
                                <div
                                  {...prov.dragHandleProps}
                                  className="cursor-grab">
                                  <svg width="12" height="12">
                                    <circle cx="2" cy="2" r="1" />
                                    <circle cx="2" cy="6" r="1" />
                                    <circle cx="2" cy="10" r="1" />
                                    <circle cx="6" cy="2" r="1" />
                                    <circle cx="6" cy="6" r="1" />
                                    <circle cx="6" cy="10" r="1" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {key}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {meta.type ?? "text"}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => toggleVisibility(key)}
                                className="p-1">
                                {isVisible ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Footer with Buttons (New Field & Visible Fields) */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-800">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-full font-medium"
              onClick={() => setShowAddFieldModal(true)}>
              New field
            </Button>

            <Button
              className="flex-1 h-11 rounded-full font-medium"
              onClick={() => setShowFieldPicker(false)}>
              Visible fields
            </Button>
          </div>

          {/* Add Field Modal */}
          {showAddFieldModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-70">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80 shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Create field</h3>

                <Label>Type</Label>
                <Select value={newFieldType} onValueChange={setNewFieldType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="longtext">Long text</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="multiselect">Multi-select</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="list:email">List: Email</SelectItem>
                    <SelectItem value="list:phone">List: Phone</SelectItem>
                  </SelectContent>
                </Select>

                <Label className="mt-3">Field name</Label>
                <Input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="mt-1"
                />

                <Label className="mt-3">Default / Options</Label>
                <Input
                  placeholder={
                    newFieldType.includes("select")
                      ? "comma separated options"
                      : "default value (optional)"
                  }
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="mt-1"
                />

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFieldModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewField}>Create</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE BUTTON TOP RIGHT */}
      <div className="absolute right-4 top-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-gray-100">
                Delete Lead?
              </AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                This action cannot be undone. {lead.name} will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(lead.id)}
                className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
