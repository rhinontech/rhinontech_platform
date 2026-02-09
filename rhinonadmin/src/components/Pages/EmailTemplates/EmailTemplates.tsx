"use client";

import { useState } from "react";
import { Mail, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TemplateList from "./components/template-list";
import EmailPreview from "./components/email-preview";
import TestEmailSender from "./components/test-email-sender";
import TipTapEditor from "./components/tiptap-editor";

type Tab = "create" | "manage";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState({
    id: "",
    name: "Untitled Template",
    subject: "Welcome Email",
    html: "",
  });
  const [showPreview, setShowPreview] = useState(true);

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name.trim()) {
      alert("Please enter a template name");
      return;
    }

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentTemplate),
      });

      if (!response.ok) throw new Error("Failed to save template");

      const saved = await response.json();
      setTemplates([...templates.filter((t) => t.id !== saved.id), saved]);
      setCurrentTemplate(saved);
      alert("Template saved successfully!");
    } catch (error) {
      alert("Error saving template: " + (error as Error).message);
    }
  };

  const handleLoadTemplate = (template: any) => {
    setCurrentTemplate(template);
    setActiveTab("create");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleDuplicateTemplate = (template: any) => {
    const newTemplate = {
      ...template,
      id: "",
      name: `${template.name} (Copy)`,
    };
    setCurrentTemplate(newTemplate);
    setActiveTab("create");
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Email Maker</h1>
          </div>
          <Button
            onClick={() => setActiveTab("create")}
            className="w-full mb-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("manage")}
            className="w-full"
          >
            My Templates
          </Button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "create" ? (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="My Email Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Email subject..."
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSaveTemplate}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Save Template
                </Button>
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  className="w-full"
                >
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <TestEmailSender template={currentTemplate} />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <TemplateList
                templates={templates}
                onLoad={handleLoadTemplate}
                onDelete={handleDeleteTemplate}
                onDuplicate={handleDuplicateTemplate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">{currentTemplate.name}</h2>
            <span className="text-xs text-muted-foreground">
              Subject: {currentTemplate.subject}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div
            className={`flex flex-col ${
              showPreview ? "w-1/2" : "w-full"
            } border-r border-border`}
          >
            <div className="p-4 border-b border-border bg-card">
              <p className="text-sm font-medium">HTML Editor</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <TipTapEditor
                content={currentTemplate.html}
                onChange={(html) =>
                  setCurrentTemplate({ ...currentTemplate, html })
                }
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 flex flex-col border-l border-border">
              <div className="p-4 border-b border-border bg-card">
                <p className="text-sm font-medium">Preview</p>
              </div>
              <div className="flex-1 overflow-auto">
                <EmailPreview html={currentTemplate.html} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
