// import { ArticleEditor } from "@/components/Pages/SuperAdmin/Pages/KnowledgeBase/Components/ArticleEditor"

import { ArticleEditor } from "@/components/Pages/KnowledgeBase/Articles/ArticleEditor/ArticleEditor";
import { use } from "react";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function page({ params }: EditArticlePageProps) {
  const { id: articleId } = use(params);
  return <ArticleEditor articleId={articleId} />;
}
