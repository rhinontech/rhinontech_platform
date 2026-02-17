"use client";

import { Theme } from "@/types/kb";
import { ChevronLeft, Copy, Calendar, Eye, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { resolveImagesInHTML } from "@/helpers/html-image-resolver";
import "./tiptap.css";

import { useRouter } from "next/navigation";
import { postArticalStats } from "@/services/kbServices";


interface Article {
    id: string;
    title: string;
    content: string;
    status: string;
    views: number;
    likes: number;
    dislikes: number;
    updated_at: string;
    createdAt: string;
    keywords?: string[];
    seoTitle?: string;
    seoDescription?: string;
}

interface ArticleViewProps {
    article: Article;
    theme: Theme;
    onBack?: () => void;
}

export function ArticleView({ article, theme, onBack }: ArticleViewProps) {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [processedContent, setProcessedContent] = useState<string>("");
    const [loadingImages, setLoadingImages] = useState(true);
    const router = useRouter();

    // Process article content to resolve S3 keys in images
    useEffect(() => {
        const processContent = async () => {
            setLoadingImages(true);
            try {
                const sanitized = sanitizeQuillHTML(article.content);
                const resolved = await resolveImagesInHTML(sanitized);
                setProcessedContent(resolved);
            } catch (error) {
                console.error("Error processing article content:", error);
                setProcessedContent(sanitizeQuillHTML(article.content));
            } finally {
                setLoadingImages(false);
            }
        };

        processContent();
    }, [article.content]);

    useEffect(() => {
        const setStats = async () => {
            try {
                const storedArticles = localStorage.getItem("articles");
                if (storedArticles) {
                    const articles = JSON.parse(storedArticles);
                    const existingArticle = articles.find((item: any) => item.id === article.id);

                    if (existingArticle) {
                        if (existingArticle.previous === "like") {
                            setLiked(true);
                            setDisliked(false);
                        } else if (existingArticle.previous === "dislike") {
                            setLiked(false);
                            setDisliked(true);
                        }
                    } else {
                        await postArticalStats({ articleId: article.id, action: "view", previous: "" });
                        article.views = article.views + 1;
                        articles.push({ id: article.id, previous: null });
                        localStorage.setItem("articles", JSON.stringify(articles));
                    }
                } else {
                    await postArticalStats({ articleId: article.id, action: "view", previous: "" });
                    article.views = article.views + 1;
                    localStorage.setItem(
                        "articles",
                        JSON.stringify([{ id: article.id, previous: null }])
                    );
                }
            } catch (error) {
                console.log("server error", error)
            }
        }
        setStats();
    }, [article.id]);




    const updateArticleState = async (newState: "like" | "dislike") => {
        try {
            const storedArticles = localStorage.getItem("articles");
            if (storedArticles) {
                const articles = JSON.parse(storedArticles);
                const index = articles.findIndex((item: any) => item.id === article.id);
                if (index !== -1) {
                    await postArticalStats({ articleId: article.id, action: newState, previous: articles[index].previous });
                    articles[index].previous = newState;
                    localStorage.setItem("articles", JSON.stringify(articles));
                }
            }
        } catch (error) {
            console.log("server error", error)
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.push("/");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const sanitizeQuillHTML = (html: string) => {
        if (!html) return "";
        // Basic sanitization or just return as is if trusted.
        // For now, we'll assume the content is safe enough or use a library if needed.
        // The user provided snippet had a sanitize function that removed .ql-ui
        // We can replicate that logic if we want to be safe, but for SSR/Client mix it might be tricky without DOM.
        // We'll use a simple regex or just return it.
        return html;
    };

    return (
        <div className="bg-background mx-auto min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between w-full h-16 bg-card border-b border-border px-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
                >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Share"}
                </button>
            </div>

            {/* Article Content */}
            <article className="max-w-4xl mx-auto px-6 py-12 pb-40">
                {/* Metadata Section */}
                <div className="mb-8 pb-6 border-b border-border">
                    <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <time dateTime={article.updated_at}>
                                Updated {formatDate(article.updated_at)}
                            </time>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{article.views || 0} views</span>
                        </div>
                        {article.status && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                                <span className="text-xs font-medium uppercase tracking-wide">
                                    {article.status}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {loadingImages ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading images...</p>
                        </div>
                    </div>
                ) : (
                    <div
                        className="ProseMirror prose max-w-full overflow-x-auto text-base leading-7 !text-black [&_*]:!text-black"
                        dangerouslySetInnerHTML={{
                            __html: processedContent,
                        }}
                    />
                )}

                {/* Keywords Section */}
                {article.keywords && article.keywords.length > 0 && (
                    <div className="mb-8 pb-8 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                            Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {article.keywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm text-foreground"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback Section */}
                <div className="bg-muted rounded-lg p-6 border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                        Was this article helpful?
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (liked) return;
                                if (disliked) {
                                    article.dislikes = article.dislikes - 1;
                                }
                                setLiked(true);
                                setDisliked(false);
                                article.likes = article.likes + 1;
                                updateArticleState("like");
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${liked
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground hover:bg-border"
                                }`}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Yes ({article.likes || 0})
                        </button>
                        <button
                            onClick={() => {
                                if (disliked) return;
                                if (liked) {
                                    article.likes = article.likes - 1;
                                }
                                setDisliked(true);
                                setLiked(false);
                                article.dislikes = article.dislikes + 1;
                                updateArticleState("dislike");
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${disliked
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-card text-foreground hover:bg-border"
                                }`}
                        >
                            <ThumbsDown className="w-4 h-4" />
                            No ({article.dislikes || 0})
                        </button>
                    </div>
                </div>
            </article>
        </div>
    );
}
