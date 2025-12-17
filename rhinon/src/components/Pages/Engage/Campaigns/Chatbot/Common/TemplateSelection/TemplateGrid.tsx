"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, Users, X, Image as ImageIcon, Smile } from "lucide-react";
import { useEffect, useState } from "react";
import { TEMPLATES, Template, getTemplateByUuid } from "./templates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignStore } from "../store/useCampaignStore";

interface TemplateGridProps {
  campaignType: "recurring" | "one-time";
}

const categories = [
  { id: "greet and inform", label: "Greet and inform", icon: MessageSquare },
  { id: "promote and convert", label: "Promote and convert", icon: TrendingUp },
  { id: "generate leads", label: "Generate leads", icon: Users },
] as const;

export const TemplateGrid = ({ campaignType }: TemplateGridProps) => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const role = params.role as string;
  const initialCategory = (
    searchParams.get("category") || "greet and inform"
  ).toLowerCase();

  const [category, setCategory] = useState<string>(initialCategory);
  const setCampaignData = useCampaignStore((state) => state.setCampaignData);

  // Update category when search params change
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategory(categoryParam.toLowerCase());
    }
  }, [searchParams]);

  const filteredTemplates = TEMPLATES.filter(
    (t) => (t.category || "").toLowerCase() === category.toLowerCase()
  );

  const handleTemplateSelect = (templateUuid: string) => {
    const template = getTemplateByUuid(templateUuid);
    if (!template) return;

    // Initialize store with template data
    setCampaignData({
      templateId: template.uuid,
      layout: template.layout,
      heading: template.heading || "",
      subheading: template.subheading || "",
      media: template.placeholder || null,
      buttons: (template.buttons || []).map(b => ({
        id: b.id,
        text: b.text,
        url: b.url || "#",
        style: b.style || "secondary"
      })),
      hasImage: template.layout.startsWith("image-"),
    });

    router.push(
      `/${role}/engage/campaigns/chatbot/${campaignType}/add?templateId=${templateUuid}`
    );
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    router.push(
      `/${role}/engage/campaigns/chatbot/${campaignType}/templates?category=${encodeURIComponent(
        newCategory
      )}`
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <X
              onClick={() => router.back()}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Campaigns</h2>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="flex flex-col w-full p-8">
            <div className="max-w-7xl mx-auto w-full space-y-8">
              <div className="flex flex-col items-center justify-between gap-5">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Create campaign
                  </h1>
                </div>

                <Tabs value={category} onValueChange={handleCategoryChange}>
                  <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <TabsTrigger
                          key={cat.id}
                          value={cat.id}
                          className="gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {cat.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    No templates found for this category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filteredTemplates.map((template) => {
                    const hasImage = template.layout.startsWith("image-");
                    return (
                      <div
                        className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary border hover:border-primary cursor-pointer transition-all"
                        key={template.uuid}
                        onClick={() => handleTemplateSelect(template.uuid)}
                      >
                        <div className="flex-1 flex flex-col gap-[8px] justify-center items-start h-full">
                          <p className="font-semibold text-lg">
                            {template.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          {hasImage ? (
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
                              <ImageIcon className="h-8 w-8 mb-2" />
                              <span className="text-xs">Image Template</span>
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex flex-col items-center justify-center text-blue-500 border-2 border-dashed border-blue-200 dark:border-blue-800">
                              <Smile className="h-8 w-8 mb-2" />
                              <span className="text-xs">Text Template</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
