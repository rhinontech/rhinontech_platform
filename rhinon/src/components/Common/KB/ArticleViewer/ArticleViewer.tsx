"use client";

import { getArticle } from "@/services/knowledgeBase/articleService";
import { useEffect, useState } from "react";
import { resolveImagesInHTML } from "@/utils/html-image-resolver";
import { Loader2 } from "lucide-react";
import "./tiptap.css";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  views: number;
  likes: number;
  dislikes: number;
}

export function ArticleViewer({ articleId }: { articleId: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processedContent, setProcessedContent] = useState<string>("");
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchArticle = async () => {
    if (articleId) {
      try {
        const existingArticle = await getArticle(articleId);
        if (existingArticle) {
          setArticle(existingArticle);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  // Process article content to resolve S3 keys in images
  useEffect(() => {
    const processContent = async () => {
      if (!article?.content) return;

      setLoadingImages(true);
      try {
        const sanitized = sanitizeQuillHTML(article.content);
        const resolved = await resolveImagesInHTML(sanitized);
        setProcessedContent(resolved);
      } catch (error) {
        console.error("Error processing article content:", error);
        setProcessedContent(sanitizeQuillHTML(article.content));
      } finally {
        setLoadingImages(false);
      }
    };

    processContent();
  }, [article?.content]);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading article...</p>;
  }

  if (!article) {
    return <p className="text-center text-red-500">Article not found</p>;
  }

  const sanitizeQuillHTML = (html: string) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll(".ql-ui").forEach((el) => el.remove());
    return div.innerHTML;
  };

  return (
    <article className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 text-balance">
          {article.title}
        </h1>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 space-x-4">
          <span>📅 {new Date(article.created_at).toLocaleString()}</span>
          <span>•</span>
          <span>👁️ {article.views} views</span>
          <span>•</span>
          <span>👍 {article.likes} likes</span>
        </div>
      </header>

      {loadingImages ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

      <footer className="mt-8 pt-4 border-t text-gray-400 dark:text-gray-500 text-sm">
        Last updated: {new Date(article.updated_at).toLocaleString()}
      </footer>
    </article>
  );
}
