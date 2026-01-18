"use client";

import { Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { fetchKnowledgeBase } from "@/services/kbServices";
import { KnowledgeBaseData, Article } from "@/types/kb";
import { ArticleCard } from "@/components/ArticleCard";
import { useRouter } from "next/navigation";

export default function KB({
  kbId,
  initialData,
}: {
  kbId: string;
  initialData?: KnowledgeBaseData | null;
}) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<KnowledgeBaseData | null>(initialData || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  const fetchKnowledgeBaseFn = async (kbId: string) => {
    try {
      setLoading(true);
      const response = await fetchKnowledgeBase(kbId);
      setData(response);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchKnowledgeBaseFn(kbId);
    }
  }, [kbId, initialData]);

  const filteredArticles = useMemo(() => {
    if (!data || !searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return data.folders.flatMap((folder) =>
      folder.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(term) ||
          article.content.toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const { theme } = data;

  const handleArticleClick = (article: Article) => {
    router.push(`/${article.articleId}`);
  };

  return (
    <div className="bg-background mx-auto h-full">
      {/* Header with logo and company name */}
      <div className="sticky top-0 z-50 flex items-center justify-between w-full h-16 bg-card border-b border-border px-6">
        <div className="flex items-center gap-2">
          {theme.logo ? (
            <img
              src={theme.logo || "/placeholder.svg"}
              alt={theme.company_name || "Logo"}
              className="h-8 object-contain"
            />
          ) : (
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-primary-foreground font-bold"
              style={{ backgroundColor: theme.primary_color || "#1e3a8a" }}
            >
              {(theme.company_name || "Help")[0]?.toUpperCase() || "H"}
            </div>
          )}
          <p className="font-semibold text-foreground text-lg">
            {theme.company_name || "Help Center"}
          </p>
        </div>
      </div>

      {/* Hero section with search */}
      <section
        className="py-12 px-6 h-96 flex w-full items-center"
        style={{
          backgroundColor: theme.primary_color || "#1e3a8a",
          backgroundImage: theme.background_image
            ? `url(${theme.background_image})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center max-w-4xl mx-auto flex flex-col w-full">
          <h1
            className="text-4xl font-semibold mb-8"
            style={{ color: theme.header_text_color || "#FFFFFF" }}
          >
            {theme.headline_text || "Hi, how can we help?"}
          </h1>

          <div className="relative max-w-xl mx-auto w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask a question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 pl-12 pr-12 bg-background text-foreground border-0 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-ring text-black"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="max-w-4xl mx-auto px-6 py-12 pb-30">
        {searchTerm.trim() ? (
          <>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Search results for “{searchTerm}”
            </h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.articleId}
                    article={article}
                    onClick={() => handleArticleClick(article)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No articles found.</p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-foreground mb-8">
              Popular articles
            </h2>
            {data.folders.map((folder) => (
              <div
                key={folder.folder_id}
                className="bg-card rounded-lg p-6 mb-6 border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {folder.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {folder.articles.length} articles
                </p>
                <div className="space-y-2">
                  {folder.articles
                    .slice(0, showAll ? undefined : 2)
                    .map((article) => (
                      <ArticleCard
                        key={article.articleId}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                      />
                    ))}
                </div>
                {folder.articles.length > 2 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-4 hover:opacity-80 font-medium transition-opacity"
                    style={{ color: theme.primary_color || "#1e3a8a" }}
                  >
                    {showAll ? "Show less" : "Show all"}
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}

