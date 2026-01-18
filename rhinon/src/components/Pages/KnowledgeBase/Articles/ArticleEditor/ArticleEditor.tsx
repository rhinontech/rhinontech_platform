"use client";

import "./tiptap.css";
import { cn } from "@/lib/utils";
import { ImageExtension } from "@/components/Common/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/Common/tiptap/extensions/image-placeholder";
import SearchAndReplace from "@/components/Common/tiptap/extensions/search-and-replace";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { X, PanelRight, Sparkles, PanelLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import {
  createArticle,
  getArticle,
  updateArticleById,
} from "@/services/knowledgeBase/articleService";
import { RichTextEditorDemo } from "@/components/Common/tiptap/rich-text-editor";
import { EditorToolbar } from "@/components/Common/tiptap/toolbars/editor-toolbar";
import { toast } from "sonner";
import { AIArticleGenerator } from "./AIArticleGenerator";

// 🔧 Dummy types/functions
interface Article {
  id: string;
  title: string;
  content: string;
  topicId: string;
  status: string;
  keywords: string[];
  views: number;
  likes: number;
  dislikes: number;
  author: string;
  seoTitle: string;
  seoDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

const topics = [
  { id: "topic-1", name: "General" },
  { id: "topic-2", name: "Technical" },
];

interface ArticleEditorProps {
  articleId?: string;
  topicId?: string;
}

const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Placeholder.configure({
    emptyNodeClass: "is-editor-empty",
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case "heading":
          return `Heading ${node.attrs.level}`;
        case "detailsSummary":
          return "Section title";
        case "codeBlock":
          // never show the placeholder when editing code
          return "";
        default:
          return "Write, type '/' for commands";
      }
    },
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Subscript,
  Superscript,
  Underline,
  Link,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  SearchAndReplace,
  Typography,
];

export function ArticleEditor({ articleId, topicId }: ArticleEditorProps) {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const router = useRouter();
  const [newKeyword, setNewKeyword] = useState("");
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const role = Cookies.get("currentRole");
  const [saveLoading, setSaveLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    topicId: topicId || "",
    status: "draft",
    keywords: [],
    views: 0,
    likes: 0,
    dislikes: 0,
    author: "Admin",
    seoTitle: "",
    seoDescription: "",
    id: "",
  });

  const getArticleById = async (id: string): Promise<Article> => {
    try {
      const data = await getArticle(id);
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        topicId: data.folder_id,
        status: data.status,
        keywords: data.keywords || [],
        views: data.views || 0,
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        author: data.author || "Unknown",
        seoTitle: data.seo_title || "",
        seoDescription: data.seo_description || "",
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Error fetching article by ID:", error);
      return {
        id,
        title: "Sample Title",
        content: "Sample content here...",
        topicId: "topic-1",
        status: "draft",
        keywords: ["sample", "demo"],
        views: 0,
        likes: 0,
        dislikes: 0,
        author: "Admin",
        seoTitle: "Sample SEO Title",
        seoDescription: "Sample SEO description",
      };
    }
  };

  const fetchArticle = async () => {
    if (articleId) {
      try {
        const existingArticle = await getArticleById(articleId);
        if (existingArticle) {
          setArticle(existingArticle);
        }
      } finally {
        setIsLoading(false); // Set loading to false when API call completes
      }
    }
  };
  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  // Initial stats calculation when article loads
  useEffect(() => {
    if (article.content) {
      const text = article.content.replace(/<[^>]*>/g, ""); // Basic strip tags
      const words = text.split(/\s+/).filter((w) => w.length > 0).length;
      setStats({ words, chars: text.length });
    }
  }, [article.content]);

  const handleSave = async () => {
    if (!article.title || article.title === "") {
      toast.info("Add Article Title..");
      return;
    }
    setSaveLoading(true);
    const payload = {
      title: article.title,
      content: editor ? editor.getHTML() : "",
      status: "draft",
      seo_title: article.seoTitle,
      seo_description: article.seoDescription,
      keywords: article.keywords,
    };

    try {
      if (articleId) {
        await updateArticleById(articleId, payload);
      } else if (topicId) {
        await createArticle({
          ...payload,
          folder_id: topicId,
        });
      }
      router.push(`/${role}/knowledge-base`);
      toast.success(
        `Article ${articleId ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Failed to save the article. Please try again.");
    }
  };

  const handlePublish = async () => {
    if (!article.title || article.title === "") {
      toast.info("Add Article Title..");
      return;
    }
    setSaveLoading(true);
    const payload = {
      title: article.title,
      content: editor ? editor.getHTML() : "",
      status: "published",
      seo_title: article.seoTitle,
      seo_description: article.seoDescription,
      keywords: article.keywords,
    };

    try {
      if (articleId) {
        await updateArticleById(articleId, payload);
      } else if (topicId) {
        await createArticle({
          ...payload,
          folder_id: topicId,
        });
      }
      router.push(`/${role}/knowledge-base`);
      toast.success(
        `Article ${articleId ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Failed to save the article. Please try again.");
    }
  };

  const handleClose = () => {
    router.push(`/${role}/knowledge-base`);
  };

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !article.keywords.includes(trimmed)) {
      setArticle((prev) => ({
        ...prev,
        keywords: [...prev.keywords, trimmed],
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setArticle((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const generateKeywords = () => {
    const text = `${article.title} ${editor?.getText()}`.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 3);
    const unique = [...new Set(words)].slice(0, 5);
    setArticle((prev) => ({
      ...prev,
      keywords: [...new Set([...prev.keywords, ...unique])],
    }));
  };

  const handleAIContentInsert = (content: string) => {
    if (editor) {
      editor.commands.setContent(content);
      // Sync the article state with the new content
      setArticle((prev) => ({
        ...prev,
        content: editor.getHTML(),
      }));
      toast.success("AI-generated content inserted successfully!");
    }
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: extensions as Extension[],
      content: article.content,
      editorProps: {
        attributes: {
          class: "max-w-full focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        const words = text.split(/\s+/).filter((w) => w.length > 0).length;
        setStats({ words, chars: text.length });
      },
    },
    [article.content]
  ); // Add dependency array to recreate editor when content changes

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border-2 bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <input
              value={article.title}
              onChange={(e) =>
                setArticle({ ...article, title: e.target.value })
              }
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter article title..."
              className="text-2xl font-bold border-none shadow-none px-2 py-1 focus-visible:ring-0 focus:outline-none max-w-fit"
            />
            {isFocused && (
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {article.title.length} / 225
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="h-8 w-8">
              {rightSidebarOpen ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 p-2 border-b bg-muted/20">
          <div className="flex items-center gap-1">
            {editor && <EditorToolbar editor={editor} />}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/20"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>

        <ScrollArea className="flex-1 h-0">
          {/* Show loader only when editing existing article and still loading */}
          {articleId && isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading article content...
                </p>
              </div>
            </div>
          ) : editor ? (
            <RichTextEditorDemo editor={editor} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Initializing editor...
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Sidebar */}
      <div
        className={cn(
          "flex flex-col border-l-2 bg-muted/30 transition-all duration-300 ease-in-out",
          rightSidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}>
        {rightSidebarOpen && (
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between border-b-2 h-[60px] p-4 w-full">
              <p className="font-semibold">Details</p>
            </div>
            <ScrollArea>
              <div className="p-4 space-y-6">
                {/* Status */}

                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input
                    value={article.seoTitle}
                    onChange={(e) =>
                      setArticle({ ...article, seoTitle: e.target.value })
                    }
                    placeholder="Enter SEO title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Textarea
                    value={article.seoDescription}
                    onChange={(e) =>
                      setArticle({
                        ...article,
                        seoDescription: e.target.value,
                      })
                    }
                    placeholder="Enter SEO description..."
                    rows={3}
                  />
                </div>

                {/* <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex gap-2">
                      {["published", "draft"].map((status) => (
                        <Button
                          key={status}
                          variant={
                            article.status === status ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setArticle({ ...article, status })}
                          className="flex-1"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div> */}

                {/* Keywords */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Keywords</Label>
                    {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateKeywords}
                        className="p-1 text-xs h-auto"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate
                      </Button> */}
                  </div>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Add keyword..."
                  />

                  <div className="flex flex-wrap gap-1">
                    {article.keywords.map((k) => (
                      <Badge key={k} variant="secondary" className="text-xs">
                        {k}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto w-auto p-0 ml-1"
                          onClick={() => removeKeyword(k)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Article Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Word count:</span>
                      <span>{stats.words}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Character count:</span>
                      <span>{stats.chars}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Topic */}
                {/* <div className="space-y-2">
                    <Label>Show in topic</Label>
                    <Select
                      value={article.topicId}
                      onValueChange={(val) =>
                        setArticle({ ...article, topicId: val })
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                <div className="flex justify-end gap-2 mt-4">
                  <Button disabled={saveLoading} onClick={() => handleSave()}>
                    {saveLoading
                      ? articleId
                        ? "Updating..."
                        : "Creating..."
                      : articleId
                        ? "Update draft"
                        : "Save as draft"}
                  </Button>
                  <Button
                    disabled={saveLoading}
                    onClick={handlePublish}
                    className="bg-success text-white hover:bg-success/90">
                    {saveLoading ? "Publishing..." : "Publish Article"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* AI Article Generator Dialog */}
      <AIArticleGenerator
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onInsert={handleAIContentInsert}
        articleTitle={article.title}
        keywords={article.keywords}
        existingContent={editor?.getHTML() || ""}
      />
    </div>
  );
}
