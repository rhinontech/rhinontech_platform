"use client";

import { useEffect, useState } from "react";
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
  Star,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import ChatbotPreview from "@/components/Common/ChatbotPreview/ChatbotPreview";
import { getForms, updateForms } from "@/services/settings/formServices";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";
import Loading from "@/app/loading";

type FormElementType =
  | "rating"
  | "message"
  | "question"
  | "choice"
  | "dropdown"
  | "multiple-choice";

interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

function StarRating({ name, required }: { name: string, required: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <button
            type="button"
            key={starValue}
            className="bg-none border-none outline-none p-0"
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`w-[40px] h-[40px] fill-[#e5e7eb] text-[#9ca3af] ${starValue <= (hover || rating) ? "active" : "inactive"
                }`}
            />
          </button>
        );
      })}

      {/* Hidden input so FormData picks it up */}
      <input type="hidden" name={name} value={rating} required={required} />
    </div>
  );
}


export default function PostChatForm() {
  const { toggleSettingSidebar } = useSidebar();
  const [isBgFade, setIsBgFade] = useState<boolean>(true);
  const [formEnabled, setFormEnabled] = useState<boolean>(true);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const chatbot_id = useUserStore((state) => state.userData.chatbotId);
  // 🔹 Fetch saved config on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getForms(chatbot_id);
        if (data?.post_chat_form) {
          setFormElements(data.post_chat_form.elements || []);
          setFormEnabled(data.post_chat_form.enabled ?? true);
        }
      } catch (error) {
        console.error("Failed to load post-chat form", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addFormElement = (type: FormElementType) => {
    const newElement: FormElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      required: false,
      options:
        type === "choice" || type === "dropdown" || type === "multiple-choice"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
    };
    setFormElements([...formElements, newElement]);
    setShowAddMenu(false);
  };

  const getDefaultLabel = (type: FormElementType): string => {
    switch (type) {
      case "rating":
        return "Rate your experience";
      case "message":
        return "Additional comments";
      case "question":
        return "Your question";
      case "choice":
        return "Select one option";
      case "dropdown":
        return "Choose from dropdown";
      case "multiple-choice":
        return "Select multiple options";
      default:
        return "Form field";
    }
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements(
      formElements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setFormElements(formElements.filter((el) => el.id !== id));
  };

  // 🔹 Save config to backend
  const handleSubmit = async (enabledOverride?: boolean) => {
    setSaveLoading(true);
    try {
      const payload = {
        post_chat_form: {
          enabled: enabledOverride ?? formEnabled,
          elements: formElements,
        },
      };
      await updateForms(chatbot_id, payload);
      toast.success("Post-chat form saved successfully!");
    } catch (error) {
      console.error("Failed to save post-chat form", error);
      toast.error("Failed to save. Please try again.");
    }finally{
      setSaveLoading(false);
    }
  };

  const getElementTypeLabel = (type: FormElementType): string => {
    switch (type) {
      case "rating":
        return "Chat rating";
      case "message":
        return "Message";
      case "question":
        return "Question";
      case "choice":
        return "Choice list";
      // case "dropdown":
      //   return "Dropdown";
      case "multiple-choice":
        return "Multiple choice list";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex relative items-center justify-center h-full w-full">
        <Loading areaOnly />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleSettingSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Post-chat form</h2>
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1 h-0 p-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-10">
                <p className="text-sm text-muted-foreground">
                  Post-chat forms allow you to get helpful feedback from
                  customers at the end of a chat.
                </p>
                <Switch
                  checked={formEnabled}
                  onCheckedChange={(checked) => {
                    setFormEnabled(checked);
                    handleSubmit(checked);
                  }}
                />
              </div>
            </div>

            {formEnabled && (
              <div className="space-y-4">
                {/* Render Elements */}
                {formElements.map((element) => (
                  <Collapsible
                    key={element.id}
                    defaultOpen
                    className="border rounded-lg">
                    <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent/50">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <ChevronDown className="h-4 w-4" />
                        <span className="font-medium">
                          {getElementTypeLabel(element.type)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteElement(element.id)}
                        className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 pt-0 space-y-4">
                      <div className="space-y-2">
                        <Label>{getElementTypeLabel(element.type)} label</Label>
                        <Input
                          value={element.label}
                          onChange={(e) =>
                            updateElement(element.id, { label: e.target.value })
                          }
                          placeholder="Enter label text"
                        />
                      </div>

                      {element.type === "message" && (
                        <div className="space-y-2">
                          <Label>Placeholder text</Label>
                          <Input
                            value={element.placeholder || ""}
                            onChange={(e) =>
                              updateElement(element.id, {
                                placeholder: e.target.value,
                              })
                            }
                            placeholder="Enter placeholder text"
                          />
                        </div>
                      )}

                      {(element.type === "choice" ||
                        element.type === "dropdown" ||
                        element.type === "multiple-choice") && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {element.options?.map((option, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(element.options || []),
                                    ];
                                    newOptions[index] = e.target.value;
                                    updateElement(element.id, {
                                      options: newOptions,
                                    });
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newOptions = element.options?.filter(
                                      (_, i) => i !== index
                                    );
                                    updateElement(element.id, {
                                      options: newOptions,
                                    });
                                  }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [
                                  ...(element.options || []),
                                  `Option ${(element.options?.length || 0) + 1}`,
                                ];
                                updateElement(element.id, {
                                  options: newOptions,
                                });
                              }}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add option
                            </Button>
                          </div>
                        )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={element.required}
                          onCheckedChange={(checked) =>
                            updateElement(element.id, { required: !!checked })
                          }
                        />
                        <Label>Required</Label>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                {/* Add new element */}
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add element
                  </Button>
                  {showAddMenu && (
                    <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-10">
                      <button
                        onClick={() => addFormElement("message")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        💬 <span>Message</span>
                      </button>
                      <button
                        onClick={() => addFormElement("question")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        ❓ <span>Question</span>
                      </button>
                      <button
                        onClick={() => addFormElement("choice")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        ⭕ <span>Choice list</span>
                      </button>
                      {/* <button
                        onClick={() => addFormElement("dropdown")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        ▼ <span>Dropdown</span>
                      </button> */}
                      <button
                        onClick={() => addFormElement("multiple-choice")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        ☑️ <span>Multiple choice</span>
                      </button>
                      <button
                        onClick={() => addFormElement("rating")}
                        className="flex items-center gap-2 w-full p-3 hover:bg-accent text-left">
                        👍 <span>Chat rating</span>
                      </button>
                    </div>
                  )}
                </div>

                <Button onClick={() => handleSubmit()} disabled={saveLoading} className="w-full">
                  {saveLoading ? "Uploading..." : "Save Post-chat Form"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Preview */}
      <div className="flex flex-col w-[500px] border-l-2">
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <h2 className="text-base font-bold">Preview</h2>
        </div>
        <ScrollArea className="flex-1 h-0">
          {/* <ChatbotPreview isBgFade={isBgFade} /> */}
          <div className="bg-white shadow-2xl mx-auto mt-3 rounded-[16px] p-[10px] h-[580px] w-[400px]">
            <div className="w-full h-full border-[#d7d7d7] border-1 px-[24px] rounded-[16px] flex justify-center items-center ">
              <div className="w-full max-h-[380px] flex flex-col shadow-2xl border-[#d7d7d7] border-1 rounded-[16px] p-6">
                <div className="flex-1 flex text-black flex-col gap-[6px] overflow-auto scrollbar-hide ">
                  {formElements.map((field) => {
                    if (field.type === 'rating') {
                      return (
                        <div key={field.id} className="flex flex-col items-center">
                          <label className="text-center font-medium text-[#333] mb-[10px]" htmlFor={field.id}>{field.label}</label>
                          <StarRating name={field.id} required={field.required} />
                        </div>
                      )
                    } else if (field.type === 'choice') {
                      return (
                        <div key={field.id} className="flex flex-col">
                          <label className="text-[14px] font-medium text-[#333]" htmlFor={field.id}>{field.label}  {field.required && <span className='text-red-500 ml-[4px]'>*</span>}</label>
                          <select
                            id={field.id}
                            name={field.id}
                            required={field.required}
                            className="border-[1px] border-[#d7d7d7] outline-none rounded-[6px] py-[10px]  text-[14px] bg-[#fff] text-black "
                          >
                            <option value="">-- Select an option --</option>
                            {field.options?.map((option: string, idx: number) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      );

                    } else if (field.type === 'multiple-choice') {
                      return (
                        <div key={field.id} className="flex flex-col">
                          <label className="text-[14px] font-medium text-[#333]">{field.label}  {field.required && <span className='text-red-500 ml-[4px]'>*</span>}</label>
                          <div className="flex gap-[6px] flex-wrap">
                            {field.options?.map((option: string, idx: number) => (
                              <label key={idx} className="flex items-center gap-[6px]">
                                <input
                                  readOnly
                                  className="mt-1"
                                  type="checkbox"
                                  name={field.id}   //  same name so FormData groups them
                                  value={option}
                                  
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      );

                    } else {
                      return (
                        <div key={field.id} className='ticket-input-group'>
                          <label className="text-[14px] font-medium text-[#333]" htmlFor={field.id}>{field.label}  {field.required && <span className='text-red-500 ml-[4px]'>*</span>}</label>
                          <input
                            className="border-[1px] w-full border-[#d7d7d7] outline-none rounded-[8px] py-[10px] px-[14px] text-[14px] bg-[#fff] text-black "
                            id={field.id}
                            type='text'
                            readOnly
                            name={field.id}
                            placeholder={field.placeholder || ''}
                            required={field.required}
                          />
                        </div>
                      )
                    }
                  })}
                </div>
                <button className="bg-blue-600 text-white w-full rounded-[8px] py-[12px] text-[14px] font-bold mt-[20px] ">
                  Submit
                </button>
                <div>

                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
