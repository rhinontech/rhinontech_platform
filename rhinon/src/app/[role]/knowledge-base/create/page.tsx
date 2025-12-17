// import { ArticleEditor } from "@/components/Pages/SuperAdmin/Pages/KnowledgeBase/Components/ArticleEditor"

import { ArticleEditor } from "@/components/Pages/KnowledgeBase/Articles/ArticleEditor/ArticleEditor";

interface CreateArticlePageProps {
  searchParams: { topicId?: string };
}

export default function page({ searchParams }: CreateArticlePageProps) {
  return <ArticleEditor topicId={searchParams.topicId} />;
}
