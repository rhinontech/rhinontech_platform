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
            className="p-4 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border transition-all duration-200 transform hover:translate-x-1 max-h-40 overflow-hidden flex flex-col"
        >
            <h4 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 mb-1">
                {article.title}
            </h4>
            <div
                className="text-sm text-muted-foreground line-clamp-4 [&_img]:hidden"
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />
            <div className="flex items-center gap-4 mt-auto pt-2 text-xs text-muted-foreground">
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
