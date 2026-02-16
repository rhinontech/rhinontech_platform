import { Article } from "@/types/kb";
import { Eye, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveImagesInHTML } from "@/helpers/html-image-resolver";

interface ArticleCardProps {
    article: Article;
    onClick: () => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
    const [processedContent, setProcessedContent] = useState<string>(article.content);

    useEffect(() => {
        const processContent = async () => {
            try {
                const resolved = await resolveImagesInHTML(article.content);
                setProcessedContent(resolved);
            } catch (error) {
                console.error("Error processing article card content:", error);
            }
        };

        processContent();
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
                dangerouslySetInnerHTML={{ __html: processedContent }}
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
