// import { ArticleEditor } from "@/components/Pages/SuperAdmin/Pages/KnowledgeBase/Components/ArticleEditor"

import { ArticleEditor } from "@/components/Pages/KnowledgeBase/Articles/ArticleEditor/ArticleEditor";

interface CreateArticlePageProps {
  searchParams: { topicId?: string };
}

export default async function page({ searchParams }: CreateArticlePageProps) {
  const { topicId } = await searchParams;
  return <ArticleEditor topicId={topicId} />;
}
