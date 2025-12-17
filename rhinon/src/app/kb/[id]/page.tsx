"use client";

import { ArticleViewer } from "@/components/Common/KB/ArticleViewer/ArticleViewer";
import { use } from "react";

interface ViewArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function ArticleViewPage({ params }: ViewArticlePageProps) {
  const { id: articleId } = use(params);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10 bg-white">
      <ArticleViewer articleId={articleId} />
    </div>
  );
}
