"use client";

import { KnowledgeBaseData } from "@/types/knowledgeBase";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Share2,
  Copy,
  Loader2,
} from "lucide-react";
import "./tiptap.css";
import { resolveImagesInHTML } from "@/utils/html-image-resolver";

type Article = KnowledgeBaseData["folders"][number]["articles"][number];

interface ArticleDetailViewProps {
  article: Article;
  theme: KnowledgeBaseData["theme"];
  responsiveClass: string;
  onBack: () => void;
}

const sanitizeQuillHTML = (html: string) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll(".ql-ui").forEach((el) => el.remove());
  return div.innerHTML;
};

export function ArticleDetailView({
  article,
  theme,
  responsiveClass,
  onBack,
}: ArticleDetailViewProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>("");
  const [loadingImages, setLoadingImages] = useState(true);

  // Process article content to resolve S3 keys in images
  useEffect(() => {
    const processContent = async () => {
      setLoadingImages(true);
      try {
        const sanitized = sanitizeQuillHTML(article.content);
        const resolved = await resolveImagesInHTML(sanitized);
        setProcessedContent(resolved);
      } catch (error) {
        console.error("Error processing article content:", error);
        // Fallback to sanitized content without image resolution
        setProcessedContent(sanitizeQuillHTML(article.content));
      } finally {
        setLoadingImages(false);
      }
    };

    processContent();
  }, [article.content]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={`bg-background mx-auto min-h-screen ${responsiveClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between w-full h-16 bg-card border-b border-border px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12 pb-40">
        {/* Metadata Section */}
        <div className="mb-8 pb-6 border-b border-border">
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={article.updatedAt}>
                Updated {formatDate(article.updatedAt)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{article.views || 0} views</span>
            </div>
            {article.status && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {article.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {/* <div
          className="prose prose-neutral dark:prose-invert max-w-none mb-12"
          style={{
            "--tw-prose-body": "var(--color-foreground)",
            "--tw-prose-headings": "var(--color-foreground)",
            "--tw-prose-links": theme.primary_color || "#1e3a8a",
          } as React.CSSProperties}
        >
        </div> */}
        {/* <div
            // className="ProseMirror prose"
                        className="mt-2 text-xs opacity-70 ProseMirror prose"
            dangerouslySetInnerHTML={{ __html: article.content }}
          /> */}

        {/* Main Content */}
        {loadingImages ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading images...</p>
            </div>
          </div>
        ) : (
          <div
            className="ProseMirror prose max-w-full overflow-x-auto text-base leading-7 !text-black [&_*]:!text-black"
            dangerouslySetInnerHTML={{
              __html: processedContent,
            }}
          />
        )}

        {/* Keywords Section */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="mb-8 pb-8 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm text-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="bg-muted rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Was this article helpful?
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLiked(!liked);
                if (disliked) setDisliked(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${liked
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-border"
                }`}
            >
              <ThumbsUp className="w-4 h-4" />
              Yes ({article.likes || 0})
            </button>
            <button
              onClick={() => {
                setDisliked(!disliked);
                if (liked) setLiked(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${disliked
                ? "bg-destructive text-destructive-foreground"
                : "bg-card text-foreground hover:bg-border"
                }`}
            >
              <ThumbsDown className="w-4 h-4" />
              No ({article.dislikes || 0})
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
