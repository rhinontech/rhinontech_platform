"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  X,
  Plus,
  Trash2,
  MessageSquare,
  Phone,
  Link,
  AppWindow,
  XCircle,
  Copy,
  ChevronDown,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getTemplateByUuid,
  TemplateMedia as TemplateMediaType,
  TemplateLayout,
} from "../TemplateSelection/templates";
import { Textarea } from "@/components/ui/textarea";
import { useCampaignStore, ButtonElement } from "../store/useCampaignStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { chatbotCampaignsService } from "@/services/engage/campaigns/chatbot/chatbotCampaignsService";

interface ChatbotBuilderProps {
  campaignType: "recurring" | "one-time";
  mode: "create" | "edit";
}

type ElementType =
  | "image"
  | "heading"
  | "sub-heading"
  | "text"
  | "button"
  | null;

export default function ChatbotBuilder({
  campaignType,
  mode,
}: ChatbotBuilderProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const role = params.role as string;
  const templateId = searchParams.get("templateId");

  // Campaign content state from store
  const {
    id: storeCampaignId,
    layout: templateLayout,
    heading,
    subheading,
    media,
    buttons,
    hasImage,
    updateField,
    setCampaignData,
  } = useCampaignStore();

  const [selectedElement, setSelectedElement] = useState<ElementType>(null);
  const [imageAlt, setImageAlt] = useState(media?.alt || "Campaign image");
  const [activeImageTab, setActiveImageTab] = useState<"custom" | "library">(
    "custom"
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);

  // Selected button for editing
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const selectedButton = buttons.find((b) => b.id === selectedButtonId);

  // Sync image alt when media changes
  useEffect(() => {
    if (media?.alt) {
      setImageAlt(media.alt);
    }
  }, [media]);

  // Load existing campaign data in edit mode
  useEffect(() => {
    const loadCampaign = async () => {
      if (mode === "edit") {
        const campaignId = params.id as string;
        // Load if we have an ID and (store ID doesn't match OR store is empty)
        if (
          campaignId &&
          (storeCampaignId !== campaignId || (!heading && buttons.length === 0))
        ) {
          try {
            setIsLoadingCampaign(true);
            const campaign = await chatbotCampaignsService.getCampaignById(
              campaignId
            );

            setCampaignData({
              id: campaign.id,
              templateId: campaign.content.templateId,
              layout: campaign.content.layout as TemplateLayout,
              heading: campaign.content.heading,
              subheading: campaign.content.subheading,
              media: campaign.content.media as TemplateMediaType | null,
              buttons: campaign.content.buttons.map((b) => ({
                id: b.id,
                text: b.text,
                url: b.url,
                style: b.style,
                actionType: b.actionType || "open-url",
              })),
              hasImage: campaign.content.hasImage,
            });
          } catch (error) {
            console.error("Error loading campaign:", error);
            alert("Failed to load campaign data. Please try again.");
          } finally {
            setIsLoadingCampaign(false);
          }
        }
      }
    };

    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params.id, storeCampaignId]);

  // Load template if store is empty but URL has ID (Direct access/Refresh fallback)
  useEffect(() => {
    if (templateId && !heading && buttons.length === 0 && mode === "create") {
      const t = getTemplateByUuid(templateId);
      if (t) {
        setCampaignData({
          templateId: t.uuid,
          layout: t.layout,
          heading: t.heading || "",
          subheading: t.subheading || "",
          media: t.placeholder || null,
          buttons: (t.buttons || []).map((b) => ({
            id: b.id,
            text: b.text,
            url: b.url || "#",
            style: b.style || "secondary",
            actionType: "open-url",
          })),
          hasImage: t.layout.startsWith("image-"),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, mode]);

  const saveTemplate = () => {
    // TODO: Save campaign data to database
    console.log("Campaign data to save:", {
      templateId,
      layout: templateLayout,
      heading,
      subheading,
      media,
      buttons,
    });
  };

  const handleNext = () => {
    const campaignId = params.id as string | undefined;
    const targetingUrl = `/${role}/engage/campaigns/chatbot/${campaignType}/targeting`;

    if (mode === "edit" && campaignId) {
      router.push(`${targetingUrl}?campaignId=${campaignId}`);
    } else {
      router.push(targetingUrl);
    }
  };

  const handleAddButton = () => {
    const newButton: ButtonElement = {
      id: Date.now().toString(),
      text: "New Button",
      url: "#",
      style: "secondary",
      actionType: "open-url",
    };
    updateField("buttons", [...buttons, newButton]);
  };

  const handleDeleteButton = (id: string) => {
    updateField(
      "buttons",
      buttons.filter((b) => b.id !== id)
    );
    if (selectedButtonId === id) {
      setSelectedButtonId(null);
      setSelectedElement(null);
    }
  };

  const handleDeleteImage = () => {
    updateField("media", null);
    // Keep hasImage true to show placeholder
  };

  const handleUpdateButton = (id: string, updates: Partial<ButtonElement>) => {
    updateField(
      "buttons",
      buttons.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleElementClick = (type: ElementType, buttonId?: string) => {
    setSelectedElement(type);
    if (type === "button" && buttonId) {
      setSelectedButtonId(buttonId);
    } else {
      setSelectedButtonId(null);
    }
  };

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // If clicking inside the canvas area but not on a specific element
      if (
        target.closest(".canvas-area") &&
        !target.closest(".editable-element")
      ) {
        setSelectedElement(null);
        setSelectedButtonId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {isLoadingCampaign ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full">
          {/* Header */}
          <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="font-semibold text-foreground">
                {mode === "edit" ? "Edit Campaign" : "Create Chatbot Campaign"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Previous: select template
              </Button>
              <Button onClick={handleNext}>Next: set conditions</Button>
            </div>
          </div>

          {/* Canvas Area - Full Focus */}
          <div className="flex-1 h-full flex pt-20 justify-center bg-gray-50 dark:bg-gray-900/20 relative overflow-hidden canvas-area">
            <div className="flex flex-col w-[300px] relative">
              {/* Image Section - Only show if layout includes image */}
              {hasImage && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement("image");
                  }}
                  className={`flex flex-col p-4 pb-0 w-[300px] relative rounded-t-xl cursor-pointer transition-all editable-element group ${selectedElement === "image"
                      ? "bg-blue-900/30 border border-blue-900"
                      : "border border-dashed border-transparent hover:border-gray-500 hover:opacity-70"
                    }`}>
                  {media ? (
                    <>
                      <img
                        src={media.src}
                        alt={imageAlt}
                        className="object-cover w-full h-48 rounded-t-lg mb-[-1px]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage();
                        }}
                        className="absolute top-5 right-5 bg-white text-gray-500 hover:text-gray-700 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-t-lg p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors h-48">
                      <div className="bg-blue-600 rounded-full p-3 mb-3">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Upload Image
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        Click to add an image
                        <br />
                        or choose from library
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`flex flex-col bg-white gap-2 mx-4 shadow-md ${hasImage ? "rounded-b-lg pt-1" : "rounded-lg pt-3"
                  }`}>
                <div className="flex flex-col">
                  {/* Heading */}
                  <div
                    className={`px-2 border border-transparent h-full editable-element ${selectedElement === "heading"
                        ? "border-blue-500 py-1"
                        : "border-dashed hover:border-gray-500 hover:opacity-70"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement("heading");
                    }}>
                    {selectedElement === "heading" ? (
                      <div className={`flex flex-col w-full`}>
                        <Textarea
                          value={heading}
                          onChange={(e) =>
                            updateField("heading", e.target.value)
                          }
                          maxLength={80}
                          className="min-h-[80px] bg-transparent focus-visible:ring-2 focus-visible:ring-blue-500 resize-none p-1 break-words whitespace-pre-wrap"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center justify-end">
                          <span className="text-xs text-muted-foreground">
                            {heading.length}/80
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="cursor-pointer break-words whitespace-pre-wrap font-semibold">
                        {heading}
                      </p>
                    )}
                  </div>

                  {/* Subheading - Only show if layout includes subheading */}
                  {(templateLayout?.includes("subheading") || subheading) && (
                    <div
                      className={`px-2 py-1 border border-transparent h-full editable-element ${selectedElement === "sub-heading"
                          ? "border-blue-500 py-1"
                          : "border-dashed hover:border-gray-500 hover:opacity-70"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement("sub-heading");
                      }}>
                      {selectedElement === "sub-heading" ? (
                        <div className={`flex flex-col w-full`}>
                          <Textarea
                            value={subheading}
                            onChange={(e) =>
                              updateField("subheading", e.target.value)
                            }
                            maxLength={220}
                            className="min-h-[80px] bg-transparent focus-visible:ring-2 focus-visible:ring-blue-500 resize-none p-1 break-words whitespace-pre-wrap text-sm text-gray-600"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Add subheading..."
                          />
                          <div className="flex items-center justify-end">
                            <span className="text-xs text-muted-foreground">
                              {subheading.length}/220
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="cursor-pointer break-words whitespace-pre-wrap text-sm text-gray-600">
                          {subheading || "Add subheading..."}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="px-2 pb-2 editable-element">
                  {buttons.map((btn) => (
                    <div className="relative group" key={btn.id}>
                      <Button
                        key={btn.id}
                        variant={
                          btn.style === "primary"
                            ? "default"
                            : btn.style === "danger"
                              ? "destructive"
                              : "secondary"
                        }
                        className="w-full mb-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleElementClick("button", btn.id);
                        }}>
                        {btn.text}
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteButton(btn.id);
                        }}
                        className="absolute top-2 right-2 bg-white text-gray-500 hover:text-gray-700 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddButton();
                    }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Button
                  </Button>
                </div>
              </div>

              {(selectedElement === "image" ||
                selectedElement === "button") && (
                  <div className={`flex flex-col w-[300px] absolute left-[285px] ${selectedElement === "button" ? '-top-12 h-[500px]' : "-top-8 h-[460px]"} bg-white shadow-xl rounded-2xl  border animate-in fade-in slide-in-from-left-5 z-10 editable-element  overflow-hidden`}>
                    <ScrollArea className="flex-1 h-0 px-3 pb-5">
                      <div className="flex items-center pt-5 pb-3 justify-between mb-4 sticky top-0 bg-white z-20">
                        <h3 className="font-semibold text-black">
                          {selectedElement === "image"
                            ? "Edit Image"
                            : "Edit Button"}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setSelectedElement(null)}>
                          <X className="h-4 w-4 text-black" />
                        </Button>
                      </div>

                      {selectedElement === "image" && (
                        <div className="space-y-4 px-2">
                          <div className="flex w-full bg-gray-100 p-1 rounded-lg">
                            <button
                              className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${activeImageTab === "custom"
                                  ? "bg-white shadow-sm text-black"
                                  : "text-gray-500 hover:text-gray-700"
                                }`}
                              onClick={() => setActiveImageTab("custom")}>
                              Custom
                            </button>
                            <button
                              className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${activeImageTab === "library"
                                  ? "bg-white shadow-sm text-black"
                                  : "text-gray-500 hover:text-gray-700"
                                }`}
                              onClick={() => setActiveImageTab("library")}>
                              Library
                            </button>
                          </div>

                          {activeImageTab === "custom" ? (
                            <div className="space-y-4">
                              <input
                                type="file"
                                accept="image/png,image/jpg,image/jpeg,image/gif"
                                id="image-upload"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      setIsUploadingImage(true);
                                      const response =
                                        await uploadFileAndGetFullUrl(file);
                                      updateField("media", {
                                        type: "image",
                                        src: response.url,
                                        alt: imageAlt,
                                      });
                                    } catch (error) {
                                      console.error(
                                        "Error uploading image:",
                                        error
                                      );
                                      alert(
                                        "Failed to upload image. Please try again."
                                      );
                                    } finally {
                                      setIsUploadingImage(false);
                                    }
                                  }
                                }}
                              />
                              <label
                                htmlFor="image-upload"
                                className={`border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${isUploadingImage
                                    ? "opacity-50 cursor-wait"
                                    : "cursor-pointer"
                                  }`}>
                                <div className="bg-blue-600 rounded-full p-2 mb-2">
                                  {isUploadingImage ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Plus className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                  {isUploadingImage
                                    ? "Uploading..."
                                    : "Upload Image"}
                                </p>
                              </label>
                              <p className="text-xs text-gray-500 text-center">
                                Max. 2300×1500 px | png, jpg, gif, jpeg
                              </p>
                            </div>
                          ) : (
                            // Replace this section with your GIF links:
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-11.gif",
                                  label: "Option 1",
                                },
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-10.gif",
                                  label: "Option 2",
                                },
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-13.gif",
                                  label: "Option 3",
                                },
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-14.gif",
                                  label: "Option 4",
                                },
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-15.gif",
                                  label: "Option 5",
                                },
                                {
                                  gif: "https://www.krishastudio.com/wp-content/uploads/2024/04/5-16.gif",
                                  label: "Option 6",
                                },
                              ].map((item, i) => (
                                <button
                                  key={i}
                                  className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors overflow-hidden"
                                  onClick={() => {
                                    // <CHANGE> Load GIF directly instead of creating canvas with emoji
                                    updateField("media", {
                                      type: "image",
                                      src: item.gif,
                                      alt: item.label,
                                    });
                                    setImageAlt(item.label);
                                  }}>
                                  {/* <CHANGE> Display GIF as image instead of emoji */}
                                  <img
                                    src={item.gif || "/placeholder.svg"}
                                    alt={item.label}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <label className="text-sm font-medium text-black">
                                Alternative text
                              </label>
                              <span className="text-gray-400">ⓘ</span>
                            </div>
                            <input
                              type="text"
                              value={imageAlt}
                              onChange={(e) => setImageAlt(e.target.value)}
                              placeholder="Describe"
                              className="w-full text-black px-3 py-2 border dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedElement(null);
                            }}>
                            Save
                          </Button>
                        </div>
                      )}

                      {selectedElement === "button" && selectedButton && (
                        <div className="space-y-6 px-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <label className="text-sm text-black font-medium">
                                Button style
                              </label>
                              <span className="text-gray-400">ⓘ</span>
                            </div>
                            <div className="relative">
                              <select
                                value={selectedButton.style}
                                onChange={(e) =>
                                  handleUpdateButton(selectedButton.id, {
                                    style: e.target.value as any,
                                  })
                                }
                                className="w-full text-black appearance-none px-3 py-2 pl-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="primary">Primary</option>
                                <option value="secondary">Default</option>
                                <option value="danger">Danger</option>
                              </select>
                              <div
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm pointer-events-none"
                                style={{
                                  backgroundColor:
                                    selectedButton.style === "primary"
                                      ? "#2563eb"
                                      : selectedButton.style === "danger"
                                        ? "#dc2626"
                                        : "#f3f4f6",
                                }}
                              />
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-black font-medium">Actions</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  icon: MessageSquare,
                                  label: "Send message",
                                  value: "send-message",
                                },
                                {
                                  icon: Phone,
                                  label: "Phone call",
                                  value: "phone-call",
                                },
                                {
                                  icon: Link,
                                  label: "Open URL",
                                  value: "open-url",
                                },
                                {
                                  icon: AppWindow,
                                  label: "Open Moment",
                                  value: "open-moment",
                                },
                                {
                                  icon: XCircle,
                                  label: "Dismiss",
                                  value: "dismiss",
                                },
                                {
                                  icon: Copy,
                                  label: "Copy coupon",
                                  value: "copy-coupon",
                                },
                              ].map((action, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateButton(selectedButton.id, {
                                      actionType: action.value as any,
                                    });
                                  }}
                                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 h-20 ${(selectedButton.actionType || "open-url") ===
                                      action.value
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                                    }`}>
                                  <action.icon className="w-5 h-5" />
                                  <span className="text-[10px] text-center leading-tight">
                                    {action.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-black font-medium">
                              Button text
                            </label>
                            <input
                              type="text"
                              value={selectedButton.text}
                              onChange={(e) =>
                                handleUpdateButton(selectedButton.id, {
                                  text: e.target.value,
                                })
                              }
                              className="w-full text-black dark:border-gray-500 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Dynamic value field based on action type */}
                          {(() => {
                            const actionType =
                              selectedButton.actionType || "open-url";

                            if (actionType === "open-url") {
                              return (
                                <div className="space-y-2">
                                  <label className="text-sm text-black font-medium">
                                    Button URL
                                  </label>
                                  <input
                                    type="url"
                                    value={selectedButton.url}
                                    onChange={(e) =>
                                      handleUpdateButton(selectedButton.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="https://example.com"
                                    className="w-full text-black dark:border-gray-500 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Enter the URL to open when the button is
                                    clicked. If you enter a full URL with
                                    “https://”, it will open in a new tab. If you
                                    enter a relative path like “/help”, it will open
                                    in the same tab.
                                  </p>
                                </div>
                              );
                            } else if (actionType === "phone-call") {
                              return (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Phone Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={selectedButton.url}
                                    onChange={(e) =>
                                      handleUpdateButton(selectedButton.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Enter the phone number to call
                                  </p>
                                </div>
                              );
                            } else if (actionType === "send-message") {
                              return (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Message Text
                                  </label>
                                  <textarea
                                    value={selectedButton.url}
                                    onChange={(e) =>
                                      handleUpdateButton(selectedButton.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="Enter the message to send..."
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Enter the message to send to the chatbot
                                  </p>
                                </div>
                              );
                            } else if (actionType === "copy-coupon") {
                              return (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Coupon Code
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedButton.url}
                                    onChange={(e) =>
                                      handleUpdateButton(selectedButton.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="SAVE20"
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Enter the coupon code to copy to clipboard
                                  </p>
                                </div>
                              );
                            } else if (actionType === "open-moment") {
                              return (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Moment ID
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedButton.url}
                                    onChange={(e) =>
                                      handleUpdateButton(selectedButton.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="moment-123"
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Enter the moment ID to open
                                  </p>
                                </div>
                              );
                            }
                            // For "dismiss" action, no value field needed
                            return null;
                          })()}

                          <div className="pt-4">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setSelectedElement(null)}>
                              Done
                            </Button>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
