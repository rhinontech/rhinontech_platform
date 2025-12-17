"use client";

import React, { useState, useEffect } from "react";
import {
  Theme,
  ResponsiveMode,
  KnowledgeBaseData,
} from "@/types/knowledgeBase";
import { Moon, Sun } from "lucide-react";
import {
  getKnowledgeBase,
  updateKnowledgeBaseTheme,
  uploadKBFileAndGetUrl,
} from "@/services/knowledgeBase/kbService";
import { CustomizationSidebar } from "./CustomizationSidebar";
import { KnowledgeBaseContent } from "./KnowledgeBaseContent";
import { PreviewControls } from "./PreviewControls";
import { ScrollArea } from "@/components/ui/scroll-area";

const HelpCenter = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [responsiveMode, setResponsiveMode] =
    useState<ResponsiveMode>("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [kbData, setKbData] = useState<KnowledgeBaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>({
    primary_color: "#1e3a8a",
    header_text_color: "#FFFFFF",
    logo: null,
    background_image: null,
    favicon: null,
    preview_image: null,
    company_name: "Help Center",
    headline_text: "Hi, how can we help?",
    website_url: "",
    help_center_url: "",
    seo: {
      title: null,
      description: null,
    },
  });



  useEffect(() => {
    getKnowledgeBaseFn();
  }, []);

  const getKnowledgeBaseFn = async () => {
    try {
      const response = await getKnowledgeBase();
      setKbData(response);
      setTheme(response.theme);
      setIsLoading(false)
    } catch (error) { }
  };

  const handleThemeUpdate = (updates: Partial<Theme>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveChanges = async (updates: Partial<Theme>) => {
    try {
      const updatedTheme = { ...updates };
      setIsLoading(true)

      // Only upload if the value is a File object (not a base64 string)
      if (updates.logo instanceof File) {
        const logoResponse = await uploadKBFileAndGetUrl(updates.logo);
        updatedTheme.logo = logoResponse.url;
      }

      if (updates.favicon instanceof File) {
        const faviconResponse = await uploadKBFileAndGetUrl(updates.favicon);
        updatedTheme.favicon = faviconResponse.url;
      }

      if (updates.background_image instanceof File) {
        const bgResponse = await uploadKBFileAndGetUrl(
          updates.background_image
        );
        updatedTheme.background_image = bgResponse.url;
      }

      if (updates.preview_image instanceof File) {
        const previewResponse = await uploadKBFileAndGetUrl(
          updates.preview_image
        );
        updatedTheme.preview_image = previewResponse.url;
      }

      console.log("[v0] Theme ready with URLs:", updatedTheme);

      await updateKnowledgeBaseThemeFn(updatedTheme);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const updateKnowledgeBaseThemeFn = async (updates: Partial<Theme>) => {
    try {
      if (!kbData || !kbData.uuid) {
        return;
      }
      const response = await updateKnowledgeBaseTheme(updates);
      console.log(response);
      setIsDirty(false);
      setTheme((prev) => ({ ...prev, ...updates }));
      setIsLoading(false)
    } catch (error) {
      console.error("Error updating knowledge base theme:", error);
      setIsLoading(false)
    }
  };

  if (!kbData || isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-background w-full">
        Loading...
      </div>
    );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <CustomizationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onThemeUpdate={handleThemeUpdate}
        onSaveChanges={handleSaveChanges}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <PreviewControls
          responsiveMode={responsiveMode}
          onModeChange={setResponsiveMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <div className="flex-1 flex flex-col overflow-y-auto bg-background">
          <ScrollArea className="flex-1 h-0">

          <KnowledgeBaseContent
            data={kbData}
            responsiveMode={responsiveMode}
            theme={theme}
          />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
