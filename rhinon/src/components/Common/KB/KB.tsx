"use client";
import { Search, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchFoldersWithArticles } from "@/services/knowledgeBase/folderService";

interface Article {
  id: string;
  title: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  dislikes: number;
  updated_at: string;
  created_at: string;
}

interface Folder {
  folderId: string;
  name: string;
  articles: Article[];
}

interface ApiResponse {
  orgId: number;
  folders: Folder[];
}

const KB = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  
  const fetchAllFoldersWithArticleFn = async () => {
    try {
      setLoading(true);
      const response = await fetchFoldersWithArticles();
      setData(response);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFoldersWithArticleFn();
  }, []);

  const handleArticleClick = (id: string) => {
    router.push(`/kb/${id}`);
  };

  //  Filtered Articles based on Search
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

  return loading ? (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>
  ) : (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br z-10 from-blue-400 via-blue-500 to-blue-600 px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-medium text-white mb-8">
            Hi, how can we help?
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Input
              type="text"
              placeholder="Find an Article"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-5 text-base bg-white border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-white/20 focus:border-transparent"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 h-8 w-8">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchTerm.trim() ? (
        <section className="px-6 py-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Search results for “{searchTerm}”
          </h2>

          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)}
                  className="w-full flex items-center justify-between py-4 px-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <span className="text-gray-900 font-medium">
                    {article.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">No articles found.</div>
          )}
        </section>
      ) : (
        // Default category view
        <section className="px-6 py-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Browse by categories
          </h2>

          {data?.folders.map((folder) => {
            // Only show first 2 articles initially
            const visibleArticles = showAll
              ? folder.articles
              : folder.articles.slice(0, 2);

            // Only show the button if there are more than 2 articles
            const shouldShowButton = folder.articles.length > 2;

            return (
              <div
                key={folder.folderId}
                className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-1">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {folder.articles.length} articles
                  </p>
                </div>

                <div className="space-y-1">
                  {visibleArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="w-full flex items-center justify-between py-3 px-0 text-left hover:bg-gray-100/50 rounded transition-colors group">
                      <span className="text-gray-900 font-medium">
                        {article.title}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  ))}
                </div>

                {shouldShowButton && (
                  <div className="mt-6 pt-4">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 p-0 h-auto font-medium"
                      onClick={() => setShowAll(!showAll)}>
                      {showAll ? "Show less" : "Show all"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
};

export default KB;
