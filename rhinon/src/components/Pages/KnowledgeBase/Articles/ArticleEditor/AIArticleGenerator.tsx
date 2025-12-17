"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIArticleGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (content: string) => void;
    articleTitle?: string;
    keywords?: string[];
    existingContent?: string;
}

type Tone = "professional" | "casual" | "technical";

export function AIArticleGenerator({
    open,
    onOpenChange,
    onInsert,
    articleTitle = "",
    keywords = [],
    existingContent = "",
}: AIArticleGeneratorProps) {
    const [prompt, setPrompt] = useState("");
    const [tone, setTone] = useState<Tone>("professional");
    const [wordCount, setWordCount] = useState<string>("500");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");
    const [error, setError] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_AI_URL;

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setGeneratedContent("");
            setError("");
            // Auto-fill prompt suggestion if title exists
            if (articleTitle && !prompt) {
                setPrompt(`Write a comprehensive article about "${articleTitle}"`);
            }
        }
    }, [open, articleTitle]);

    const generateArticle = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        setError("");
        setGeneratedContent("");

        try {
            // Abort any existing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            // Build context-aware prompt
            const contextualPrompt = buildContextualPrompt();

            const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: JSON.stringify({
                    prompt: contextualPrompt,
                    context_data: {
                        article_context: {
                            title: articleTitle,
                            keywords: keywords,
                            has_existing_content: !!existingContent,
                        },
                    },
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body reader available");

            const decoder = new TextDecoder();
            let fullResponse = "";
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const jsonStr = line.slice(6).trim();
                            if (!jsonStr) continue;
                            const data = JSON.parse(jsonStr);

                            if (data.content !== undefined) {
                                fullResponse += data.content;
                                setGeneratedContent(fullResponse);
                            }

                            if (data.error) {
                                setError(data.error);
                                return;
                            }

                            if (data.done) {
                                setIsGenerating(false);
                                return;
                            }
                        } catch (e) {
                            console.error("Error parsing streaming data:", e);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("Error generating article:", error);
            if (error.name !== "AbortError") {
                setError("Failed to generate article. Please try again.");
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    // Extract clean HTML content from AI response
    const extractHTMLContent = (rawContent: string): string => {
        let cleaned = rawContent;

        // Remove markdown code block wrappers (```html ... ```)
        cleaned = cleaned.replace(/```html\s*/gi, "");
        cleaned = cleaned.replace(/```\s*$/g, "");
        cleaned = cleaned.replace(/```/g, "");

        // Remove common AI explanatory prefixes
        const prefixPatterns = [
            /^.*?Here is the HTML content.*?\n/i,
            /^.*?I can certainly help.*?\n/i,
            /^.*?I'll generate.*?\n/i,
            /^.*?Here's the article.*?\n/i,
            /^.*?Below is the.*?\n/i,
            /^.*?Remember to replace.*?\n/i,
        ];

        prefixPatterns.forEach((pattern) => {
            cleaned = cleaned.replace(pattern, "");
        });

        // Remove any leading/trailing whitespace
        cleaned = cleaned.trim();

        // If content starts with an HTML tag, we're good
        // Otherwise, try to find the first HTML tag and start from there
        if (!cleaned.startsWith("<")) {
            const firstTagMatch = cleaned.match(/<[a-z][^>]*>/i);
            if (firstTagMatch) {
                const startIndex = cleaned.indexOf(firstTagMatch[0]);
                cleaned = cleaned.substring(startIndex);
            }
        }

        return cleaned;
    };

    const buildContextualPrompt = () => {
        let contextualPrompt = `You are a professional content writer creating a knowledge base article.

**User Request**: ${prompt}

**Article Details**:
- Title: ${articleTitle || "Not specified"}
- Keywords: ${keywords.length > 0 ? keywords.join(", ") : "None"}
- Tone: ${tone}
- Target Word Count: ~${wordCount} words

**CRITICAL Instructions**:
1. Generate ONLY the HTML content - no explanations, no markdown code blocks, no introductory text
2. Start directly with HTML tags (like <h2> or <p>)
3. Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
4. Include clear headings and subheadings
5. Write in a ${tone} tone
6. Make the content informative, clear, and easy to understand
7. Include practical examples where relevant
8. Aim for approximately ${wordCount} words
9. Do NOT include <h1> tags (the title is separate)
10. Do NOT wrap the HTML in markdown code blocks (no \`\`\`html)
11. Do NOT include any explanatory text before or after the HTML

Generate ONLY the HTML article content now (start with <h2> or <p>):`;

        return contextualPrompt;
    };

    const handleInsert = () => {
        if (generatedContent) {
            // Extract clean HTML content before inserting
            const cleanHTML = extractHTMLContent(generatedContent);
            onInsert(cleanHTML);
            onOpenChange(false);
        }
    };

    const handleRegenerate = () => {
        generateArticle();
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        Generate Article with AI
                    </DialogTitle>
                    <DialogDescription>
                        Describe what you want to write about, and AI will generate a
                        complete article for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Context Display */}
                    {(articleTitle || keywords.length > 0) && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                                Article Context
                            </p>
                            {articleTitle && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Title:</span>
                                    <span className="text-sm font-medium">{articleTitle}</span>
                                </div>
                            )}
                            {keywords.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        Keywords:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {keywords.map((keyword) => (
                                            <Badge key={keyword} variant="secondary" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <Label htmlFor="prompt">What should the article be about?</Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g., Write a comprehensive guide about password reset procedures for end users..."
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Generation Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tone">Tone</Label>
                            <Select value={tone} onValueChange={(value: Tone) => setTone(value)}>
                                <SelectTrigger id="tone">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wordCount">Target Word Count</Label>
                            <Select value={wordCount} onValueChange={setWordCount}>
                                <SelectTrigger id="wordCount">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="300">~300 words</SelectItem>
                                    <SelectItem value="500">~500 words</SelectItem>
                                    <SelectItem value="800">~800 words</SelectItem>
                                    <SelectItem value="1000">~1000 words</SelectItem>
                                    <SelectItem value="1500">~1500 words</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Preview Area */}
                    {(generatedContent || isGenerating) && (
                        <div className="flex-1 min-h-0 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Generated Content Preview</Label>
                                {generatedContent && !isGenerating && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRegenerate}
                                        className="h-8 gap-2"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Regenerate
                                    </Button>
                                )}
                            </div>
                            <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
                                {isGenerating && !generatedContent && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Generating article...
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "prose prose-sm dark:prose-invert max-w-none",
                                        isGenerating && "opacity-70"
                                    )}
                                    dangerouslySetInnerHTML={{
                                        __html: isGenerating ? generatedContent : extractHTMLContent(generatedContent)
                                    }}
                                />
                                {isGenerating && generatedContent && (
                                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Generating...</span>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    {!generatedContent && (
                        <Button
                            onClick={generateArticle}
                            disabled={isGenerating || !prompt.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Article
                                </>
                            )}
                        </Button>
                    )}
                    {generatedContent && !isGenerating && (
                        <Button
                            onClick={handleInsert}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            Insert into Editor
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
