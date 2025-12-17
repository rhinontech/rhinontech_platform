"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getKnowledgeBase } from "@/services/knowledgeBase/kbService";
import { KnowledgeBaseData, Article } from "@/types/knowledgeBase";
import {
    Eye,
    ThumbsDown,
    ThumbsUp,
    FileText,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

const Reports = () => {
    const [data, setData] = useState<KnowledgeBaseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getKnowledgeBase();
                setData(response);
            } catch (error) {
                console.error("Error fetching knowledge base data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Failed to load reports data.
            </div>
        );
    }

    // Aggregate Data
    const allArticles: Article[] = data.folders.flatMap(
        (folder) => folder.articles
    );

    const totalArticles = allArticles.length;
    const totalViews = allArticles.reduce((sum, article) => sum + article.views, 0);
    const totalLikes = allArticles.reduce((sum, article) => sum + article.likes, 0);
    const totalDislikes = allArticles.reduce(
        (sum, article) => sum + article.dislikes,
        0
    );

    // Top Articles
    const topArticles = [...allArticles]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    // Chart Data
    const feedbackData = [
        { name: "Likes", value: totalLikes },
        { name: "Dislikes", value: totalDislikes },
    ];

    const categoryData = data.folders.map((folder) => ({
        name: folder.name,
        views: folder.articles.reduce((sum, article) => sum + article.views, 0),
    }));

    const COLORS = ["#22c55e", "#ef4444"]; // Green for Likes, Red for Dislikes

    return (
        <div className=" flex flex-col h-full w-full">
            <ScrollArea className="flex-1 h-0">
                <div className="p-6 space-y-6 h-full w-full">

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="text-muted-foreground">
                            Overview of your knowledge base performance.
                        </p>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalArticles}</div>
                                <p className="text-xs text-muted-foreground">
                                    Across {data.folders.length} folders
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalViews}</div>
                                <p className="text-xs text-muted-foreground">
                                    Lifetime views
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLikes}</div>
                                <p className="text-xs text-muted-foreground">
                                    Positive feedback
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Dislikes</CardTitle>
                                <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalDislikes}</div>
                                <p className="text-xs text-muted-foreground">
                                    Negative feedback
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Top Articles Table */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Top Articles</CardTitle>
                                <CardDescription>
                                    Most viewed articles in your knowledge base.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Views</TableHead>
                                            <TableHead className="text-right">Likes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topArticles.map((article) => (
                                            <TableRow key={article.articleId}>
                                                <TableCell className="font-medium truncate max-w-[300px]">
                                                    {article.title}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === "published"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                            }`}
                                                    >
                                                        {article.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{article.views}</TableCell>
                                                <TableCell className="text-right">{article.likes}</TableCell>
                                            </TableRow>
                                        ))}
                                        {topArticles.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">
                                                    No articles found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Feedback Chart */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Feedback Overview</CardTitle>
                                <CardDescription>
                                    Distribution of user feedback.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {totalLikes + totalDislikes > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={feedbackData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {feedbackData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No feedback data available.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Views by Category Chart */}
                        <Card className="col-span-7">
                            <CardHeader>
                                <CardTitle>Views by Category</CardTitle>
                                <CardDescription>
                                    Total views per folder.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default Reports;
