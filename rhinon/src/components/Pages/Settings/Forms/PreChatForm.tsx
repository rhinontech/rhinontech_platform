"use client";

import { use, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PanelLeft,
  ChevronDown,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import ChatbotPreview from "@/components/Common/ChatbotPreview/ChatbotPreview";
import { getForms, updateForms } from "@/services/settings/formServices";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";
import Loading from "@/app/loading";

type FieldType = "name" | "email" | "phone" | "custom";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
}

export default function PreChatForm() {
  const { toggleSettingSidebar } = useSidebar();
  const [isBgFade, setIsBgFade] = useState(true);
  // const [formEnabled, setFormEnabled] = useState(true);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const chatbot_id = useUserStore((state) => state.userData.chatbotId);
  // 🔹 Load existing config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getForms(chatbot_id);
        if (data?.pre_chat_form) {
          setFormFields(data.pre_chat_form || []);
        }
      } catch (error) {
        console.error("Failed to load pre-chat form", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `${type}-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      required: false,
      placeholder: getDefaultPlaceholder(type),
    };
    setFormFields([...formFields, newField]);
    setShowAddMenu(false);
  };

  const getDefaultLabel = (type: FieldType): string => {
    switch (type) {
      case "name":
        return "Full Name";
      case "email":
        return "Email Address";
      case "phone":
        return "Phone Number";
      case "custom":
        return "Custom Field";
      default:
        return "Field";
    }
  };

  const getDefaultPlaceholder = (type: FieldType): string => {
    switch (type) {
      case "name":
        return "Enter your name";
      case "email":
        return "Enter your email";
      case "phone":
        return "Enter your phone number";
      case "custom":
        return "Enter text";
      default:
        return "";
    }
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(
      formFields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  // 🔹 Save to backend
  const handleSave = async (enabledOverride?: boolean) => {
    setSaveLoading(true);
    try {
      const payload = {
        pre_chat_form: formFields,
      };
      await updateForms(chatbot_id, payload);
      toast.success("Pre-chat form saved successfully!");
    } catch (error) {
      console.error("Failed to save pre-chat form", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const renderField = (field: FormField) => (
    <Collapsible key={field.id} defaultOpen className="border rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent/50">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <ChevronDown className="h-4 w-4" />
          <span className="font-medium">{field.label}</span>
        </div>

        {/* Only show delete button if NOT email */}
        {field.type !== "email" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteField(field.id)}
            className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4 pt-0 space-y-4">
        <div className="space-y-2">
          <Label>Field Label</Label>
          <Input
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) =>
              updateField(field.id, { placeholder: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            disabled={field.type === "email"}
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField(field.id, { required: !!checked })
            }
          />
          <Label>Required</Label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  if (loading) {
    return (
      <div className="flex relative items-center justify-center h-full w-full">
        <Loading areaOnly />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      {/* Left Config Panel */}
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleSettingSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Pre-chat form</h2>
          </div>
        </div>
        <ScrollArea className="flex-1 h-0 p-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-10">
              <p className="text-sm text-muted-foreground">
                Collect user details before starting the chat.
              </p>
              {/* <Switch
                checked={formEnabled}
                onCheckedChange={(checked) => {
                  setFormEnabled(checked);
                  handleSave(checked);
                }}
              /> */}
            </div>

            <div className="space-y-4">
              {formFields.map(renderField)}

              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add field
                </Button>

                {showAddMenu && (
                  <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-10">
                    <button
                      onClick={() => addField("name")}
                      className="w-full p-3 hover:bg-accent text-left">
                      👤 Full Name
                    </button>
                    {/* <button
                      onClick={() => addField("email")}
                      className="w-full p-3 hover:bg-accent text-left">
                      📧 Email
                    </button> */}
                    <button
                      onClick={() => addField("phone")}
                      className="w-full p-3 hover:bg-accent text-left">
                      📞 Phone Number
                    </button>
                    <button
                      onClick={() => addField("custom")}
                      className="w-full p-3 hover:bg-accent text-left">
                      ✏️ Custom Field
                    </button>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleSave()}
                disabled={saveLoading}
                className="w-full">
                {saveLoading ? "Uploading..." : "Save Pre-chat Form"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Preview Panel */}
      <div className="flex flex-col w-[500px] border-l-2">
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <h2 className="text-base font-bold">Preview</h2>
        </div>
        <ScrollArea className="flex-1 h-0 flex justify-center items-center">
          {/* <ChatbotPreview isBgFade={isBgFade} /> */}

          <div className="bg-white shadow-2xl mx-auto mt-3 rounded-[16px] p-[10px] h-[580px] w-[400px]">
            <div className="w-full h-full border-[#d7d7d7] border-1 px-[24px] rounded-[16px] flex justify-center items-center ">
              <div className="w-full max-h-[380px] flex flex-col shadow-2xl border-[#d7d7d7] border-1 rounded-[16px] p-6">
                <div className="flex-1 flex flex-col gap-[6px] overflow-auto scrollbar-hide ">
                  {formFields.map((field) => (
                    <div key={field.id} className="flex flex-col gap-[6px]">
                      <label className="text-[14px] font-medium text-[#333]">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-[4px]">*</span>
                        )}
                      </label>
                      {field.label.toLowerCase().includes("description") ? (
                        <textarea placeholder={field.placeholder} />
                      ) : (
                        <input
                          className="border-[1px] border-[#d7d7d7] outline-none rounded-[8px] py-[12px] px-[14px] text-[14px] bg-[#fff] text-black "
                          type={field.type}
                          placeholder={field.placeholder}
                          readOnly
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button className="bg-blue-600 text-white w-full rounded-[8px] py-[12px] text-[14px] font-bold mt-[20px] ">
                  Submit
                </button>
                <div></div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
