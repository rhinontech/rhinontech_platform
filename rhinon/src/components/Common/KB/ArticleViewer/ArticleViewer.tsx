"use client";

import { getArticle } from "@/services/knowledgeBase/articleService";
import { useEffect, useState } from "react";
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

      <div
        className="ProseMirror prose max-w-full overflow-x-auto text-base leading-7 !text-black [&_*]:!text-black"
        dangerouslySetInnerHTML={{
          __html: sanitizeQuillHTML(article.content),
        }}
      />

      <footer className="mt-8 pt-4 border-t text-gray-400 dark:text-gray-500 text-sm">
        Last updated: {new Date(article.updated_at).toLocaleString()}
      </footer>
    </article>
  );
}
