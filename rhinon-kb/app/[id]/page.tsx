import { headers } from "next/headers";
import { getKbIdFromHost } from "@/lib/utils";
import { fetchKnowledgeBase, getArticle } from "@/services/kbServices";
import { ArticleView } from "@/components/ArticleView";
import { Metadata } from "next";
import { Theme } from "@/types/kb";
import { notFound } from "next/navigation";

interface ViewArticlePageProps {
  params: { id: string };
}

async function getArticleData(articleId: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  const kbId = getKbIdFromHost(host);

  if (!kbId) {
    return null;
  }

  try {
    const [article, kbData] = await Promise.all([
      getArticle(articleId),
      fetchKnowledgeBase(kbId),
    ]);
    return { article, theme: kbData.theme };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ViewArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getArticleData(id);
  if (!result) return {};

  const { article, theme } = result;

  // Defensive checks for theme properties
  const seoDescription = article.seoDescription || theme?.seo?.description || "Knowledge Base Article";
  const seoTitle = article.seoTitle || article.title;
  const favicon = theme?.favicon || undefined;
  const previewImage = theme?.preview_image || undefined;

  return {
    title: seoTitle,
    description: seoDescription,
    icons: favicon ? [
      {
        rel: "icon",
        url: favicon,
      },
    ] : undefined,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: previewImage ? [{ url: previewImage }] : undefined,
    },
  };
}

export default async function ArticleViewPage({ params }: ViewArticlePageProps) {
  const { id } = await params;
  const result = await getArticleData(id);

  if (!result || !result.article) {
    notFound();
  }

  const { article, theme } = result;

  return (
    <ArticleView
      article={article}
      theme={theme}
    />
  );
}
