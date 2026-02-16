import {
  KnowledgeBaseData,
  ResponsiveMode,
  Theme,
} from "@/types/knowledgeBase";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, Eye, Calendar } from 'lucide-react';
import { ArticleDetailView } from "./ArticleDetailView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SecureImage } from "@/components/Common/SecureImage";
import { getSecureViewUrl } from "@/services/fileUploadService";
import { resolveImagesInHTML } from "@/utils/html-image-resolver";

interface KnowledgeBaseContentProps {
  data: KnowledgeBaseData;
  responsiveMode: ResponsiveMode;
  theme: Theme;
}

export const KnowledgeBaseContent: React.FC<KnowledgeBaseContentProps> = ({
  data,
  responsiveMode,
  theme,
}) => {
  type Article = KnowledgeBaseData["folders"][number]["articles"][number];
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    const resolveBg = async () => {
      if (theme.background_image && typeof theme.background_image === 'string') {
        if (theme.background_image.startsWith('http') || theme.background_image.startsWith('data:')) {
          setBgImage(theme.background_image);
        } else {
          const url = await getSecureViewUrl(theme.background_image);
          setBgImage(url);
        }
      } else {
        setBgImage(null);
      }
    };
    resolveBg();
  }, [theme.background_image]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return data.folders.flatMap((folder) =>
      folder.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(term) ||
          article.content.toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const getResponsiveClass = () => {
    switch (responsiveMode) {
      case "mobile":
        return "w-[400px]";
      case "tablet":
        return "w-[800px]";
      default:
        return "w-full";
    }
  };

  // <CHANGE> Use dedicated ArticleDetailView component for better separation of concerns
  if (selectedArticle) {
    return (
      <ArticleDetailView
        article={selectedArticle}
        theme={theme}
        responsiveClass={getResponsiveClass()}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className={`bg-background mx-auto h-full ${getResponsiveClass()}`} >
      {/* Header with logo and company name */}
      <div className="flex items-center justify-between w-full h-16 bg-card border-b border-border px-6">
        <div className="flex items-center gap-2">
          {theme.logo ? (
            <SecureImage
              src={theme.logo as string}
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
          backgroundImage: bgImage
            ? `url(${bgImage})`
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
            <input
              type="text"
              placeholder="Ask a question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 pl-4 pr-12 bg-background text-foreground border-0 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="max-w-4xl mx-auto px-6 py-12 pb-30">
        {searchTerm.trim() ? (
          <>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Search results for "{searchTerm}"
            </h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.articleId}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
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
                        onClick={() => setSelectedArticle(article)}
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
};

// <CHANGE> Extracted ArticleCard component for reusability and cleaner code
function ArticleCard({
  article,
  onClick,
}: {
  article: KnowledgeBaseData["folders"][number]["articles"][number];
  onClick: () => void;
}) {
  const [content, setContent] = useState(article.content);

  useEffect(() => {
    resolveImagesInHTML(article.content).then(setContent);
  }, [article.content]);

  return (
    <div
      onClick={onClick}
      className="p-4 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border transition-all duration-200 transform hover:translate-x-1"
    >
      <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
        {article.title}
      </h4>
      <div
        className="text-sm text-muted-foreground mt-2 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {article.views || 0}
        </span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" /> {article.likes || 0}
        </span>
      </div>
    </div>
  );
}
