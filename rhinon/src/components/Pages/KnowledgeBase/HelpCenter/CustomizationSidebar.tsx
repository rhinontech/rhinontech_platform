import { Button } from "@/components/ui/button";
import { Theme } from "@/types/knowledgeBase";
import { fileToBase64 } from "@/utils/fileUpload";
import {
  X,
  Upload,
  Image as ImageIcon,
  Palette,
  Type,
  Link as LinkIcon,
  Globe,
  Search,
  Layout,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CustomizationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeUpdate: (updates: Partial<Theme>) => void;
  onSaveChanges?: (updates: Partial<Theme>) => void;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CustomizationSidebar: React.FC<CustomizationSidebarProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeUpdate,
  onSaveChanges,
  isDirty,
  setIsDirty,
}) => {
  const [pendingFiles, setPendingFiles] = useState<{
    logo?: File;
    favicon?: File;
    background_image?: File;
    preview_image?: File;
  }>({});

  const [formData, setFormData] = useState<Partial<Theme>>({
    primary_color: theme.primary_color,
    header_text_color: theme.header_text_color,
    logo: theme.logo,
    favicon: theme.favicon,
    background_image: theme.background_image,
    preview_image: theme.preview_image,
    company_name: theme.company_name || "",
    headline_text: theme.headline_text || "",
    website_url: theme.website_url || "",
    help_center_url: theme.help_center_url || "",
    seo: theme.seo || { title: null, description: null },
  });

  const handleFieldChange = (field: keyof Theme, value: any) => {
    // For help_center_url, extract subdomain only for storage
    let valueToStore = value;
    if (field === "help_center_url" && typeof value === "string") {
      // Extract subdomain from full URL
      const subdomainMatch = value.match(/https?:\/\/([^.]+)\.rhinon\.help/);
      valueToStore = subdomainMatch ? subdomainMatch[1] : value.replace(/https?:\/\//, "").replace(".rhinon.help", "");
    }

    onThemeUpdate({ [field]: valueToStore });
    setFormData((prev) => ({ ...prev, [field]: valueToStore }));
    setIsDirty(true);
  };

  const handleSeoChange = (
    field: "title" | "description",
    value: string | null
  ) => {
    type Seo = { title: string | null; description: string | null };
    const currentSeo = {
      title: formData.seo?.title ?? null,
      description: formData.seo?.description ?? null,
    };
    const newSeo: Seo = { ...currentSeo, [field]: value };
    onThemeUpdate({ seo: newSeo });
    setFormData((prev) => ({ ...prev, seo: newSeo }));
    setIsDirty(true);
  };

  const handleFileUpload = async (
    field: keyof typeof pendingFiles,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        handleFieldChange(field as keyof Theme, base64);
        setPendingFiles((prev) => ({ ...prev, [field]: file }));
      } catch (error) {
        console.error(`Error uploading ${field}:`, error);
      }
    }
  };

  const handleSave = () => {
    const dataToSave = { ...formData, ...pendingFiles };
    onSaveChanges?.(dataToSave);
    setPendingFiles({});
  };

  const handleCancel = () => {
    setFormData({
      primary_color: theme.primary_color,
      header_text_color: theme.header_text_color,
      logo: theme.logo,
      favicon: theme.favicon,
      background_image: theme.background_image,
      preview_image: theme.preview_image,
      company_name: theme.company_name || "",
      headline_text: theme.headline_text || "",
      website_url: theme.website_url || "",
      help_center_url: theme.help_center_url || "",
      seo: theme.seo || { title: null, description: null },
    });
    setPendingFiles({});
    setIsDirty(false);
  };

  const FileUploadZone = ({
    label,
    imageSrc,
    onUpload,
    onRemove,
    heightClass = "h-32",
  }: {
    label: string;
    imageSrc?: string | null;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    heightClass?: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      {imageSrc ? (
        <div
          className={cn(
            "relative w-full rounded-xl overflow-hidden border border-border shadow-sm group transition-all hover:shadow-md",
            heightClass
          )}
        >
          <img
            src={imageSrc}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="h-8 px-3 text-xs font-medium"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all duration-200 group",
            heightClass
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className="mb-3 p-3 rounded-full bg-muted group-hover:bg-background transition-colors shadow-sm">
              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              SVG, PNG, JPG or GIF
            </p>
          </div>
          <input type="file" className="hidden" onChange={onUpload} />
        </label>
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full bg-background/95 backdrop-blur-sm border-r border-border transition-all duration-300 ease-in-out z-20",
          isOpen ? "w-[400px]" : "w-0 overflow-hidden opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6  h-16 border-b border-border/60 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Customize
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage look and feel
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-10 pb-32">
            {/* Branding Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Palette className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
                  Branding
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0 overflow-hidden rounded-full ring-2 ring-border shadow-sm w-10 h-10 transition-transform hover:scale-105">
                      <input
                        type="color"
                        value={formData.primary_color || "#1e3a8a"}
                        onChange={(e) =>
                          handleFieldChange("primary_color", e.target.value)
                        }
                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                      />
                    </div>
                    <Input
                      value={formData.primary_color || "#1e3a8a"}
                      onChange={(e) =>
                        handleFieldChange("primary_color", e.target.value)
                      }
                      className="font-mono text-xs h-10 uppercase tracking-wide"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Header Text
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0 overflow-hidden rounded-full ring-2 ring-border shadow-sm w-10 h-10 transition-transform hover:scale-105">
                      <input
                        type="color"
                        value={formData.header_text_color || "#FFFFFF"}
                        onChange={(e) =>
                          handleFieldChange("header_text_color", e.target.value)
                        }
                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                      />
                    </div>
                    <Input
                      value={formData.header_text_color || "#FFFFFF"}
                      onChange={(e) =>
                        handleFieldChange("header_text_color", e.target.value)
                      }
                      className="font-mono text-xs h-10 uppercase tracking-wide"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FileUploadZone
                  label="Logo"
                  imageSrc={
                    typeof formData.logo === "string" ? formData.logo : null
                  }
                  onUpload={(e) => handleFileUpload("logo", e)}
                  onRemove={() => handleFieldChange("logo", null)}
                  heightClass="h-28"
                />
                <FileUploadZone
                  label="Favicon"
                  imageSrc={
                    typeof formData.favicon === "string"
                      ? formData.favicon
                      : null
                  }
                  onUpload={(e) => handleFileUpload("favicon", e)}
                  onRemove={() => handleFieldChange("favicon", null)}
                  heightClass="h-28"
                />
              </div>
            </section>

            <Separator />

            {/* Content Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Type className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
                  Content
                </h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name || ""}
                    onChange={(e) =>
                      handleFieldChange("company_name", e.target.value)
                    }
                    placeholder="e.g. Acme Corp"
                    className="h-11 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Headline Text</Label>
                  <Input
                    value={formData.headline_text || ""}
                    onChange={(e) =>
                      handleFieldChange("headline_text", e.target.value)
                    }
                    placeholder="e.g. How can we help you?"
                    className="h-11 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>

                <FileUploadZone
                  label="Hero Background"
                  imageSrc={
                    typeof formData.background_image === "string"
                      ? formData.background_image
                      : null
                  }
                  onUpload={(e) => handleFileUpload("background_image", e)}
                  onRemove={() => handleFieldChange("background_image", null)}
                  heightClass="h-40"
                />
              </div>
            </section>

            <Separator />

            {/* Links Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <LinkIcon className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
                  Links & Domain
                </h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.website_url || ""}
                      onChange={(e) =>
                        handleFieldChange("website_url", e.target.value)
                      }
                      placeholder="https://example.com"
                      className="pl-10 h-11 bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Help Center URL</Label>
                  <div className="flex items-center shadow-sm rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                    <div className="px-3 py-3 bg-muted/50 border-r border-border text-muted-foreground text-sm font-medium select-none">
                      https://
                    </div>
                    <input
                      type="text"
                      value={formData.help_center_url || ""}
                      onChange={(e) => {
                        const subdomain = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "");
                        handleFieldChange("help_center_url", subdomain);
                      }}
                      className="flex-1 px-3 py-3 text-sm bg-background text-foreground focus:outline-none min-w-0 placeholder:text-muted-foreground/50"
                      placeholder="subdomain"
                    />
                    <div className="px-3 py-3 bg-muted/50 border-l border-border text-muted-foreground text-sm font-medium select-none whitespace-nowrap">
                      .rhinon.help
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1">
                    Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* SEO Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Search className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
                  SEO Settings
                </h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.seo?.title || ""}
                    onChange={(e) =>
                      handleSeoChange("title", e.target.value || null)
                    }
                    placeholder="Page title for search engines"
                    className="h-11 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.seo?.description || ""}
                    onChange={(e) =>
                      handleSeoChange("description", e.target.value || null)
                    }
                    placeholder="Brief description for search results..."
                    className="min-h-[100px] bg-muted/30 focus:bg-background transition-colors resize-none"
                  />
                </div>

                <FileUploadZone
                  label="Social Preview Image"
                  imageSrc={
                    typeof formData.preview_image === "string"
                      ? formData.preview_image
                      : null
                  }
                  onUpload={(e) => handleFileUpload("preview_image", e)}
                  onRemove={() => handleFieldChange("preview_image", null)}
                  heightClass="h-32"
                />
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>

      {/* Sticky Footer Actions */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-foreground/95 backdrop-blur-md text-background px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 pl-6 pr-2 border border-white/10">
            <span className="text-sm font-medium mr-2">Unsaved changes</span>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="h-8 rounded-full hover:bg-white/10 text-background hover:text-white"
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8 rounded-full bg-background text-foreground hover:bg-background/90 font-semibold px-4"
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

