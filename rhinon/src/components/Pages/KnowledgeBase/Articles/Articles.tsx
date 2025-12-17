"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, PanelRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import { TopicRow } from "./Components/TopicRow";
import { ArticleRow } from "./Components/ArticleRow";
import { CreateTopicDialog } from "./Components/CreateTopicDialog";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";
import {
  createFolder,
  deleteFolder,
  fetchFoldersWithArticles,
} from "@/services/knowledgeBase/folderService";
import {
  deleteArticleById,
  updateArticleById,
} from "@/services/knowledgeBase/articleService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Loading from "@/app/loading";
import NoDataThumbail from "./common/NoDataThumbail";
import { PLAN_LIMITS } from "@/lib/plans";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";

interface Article {
  articleId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  views: number;
  likes: number;
  dislikes: number;
  updatedAt: string;
  createdAt: string;
  order?: number;
}

interface KnowledgeData {
  folder_id: string;
  name: string;
  articles: Article[];
}

export default function Articles() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kbUrl, setKbUrl] = useState<string | null>(null);

  const orgPlan = useUserStore((state) => state.userData.orgPlan);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalArticles = knowledgeData.reduce(
    (count, folder) => count + folder.articles.length,
    0
  );

  const canAddArticle = totalArticles < PLAN_LIMITS[orgPlan]?.knowledge;

  const [editingTopic, setEditingTopic] = useState<{
    folderId: string;
    name: string;
    description?: string;
  } | null>(null);

  const handleEditTopic = (topic: any) => {
    setEditingTopic(topic);
    setIsCreateTopicOpen(true);
  };

  const fetchAllFoldersWithArticle = async () => {
    try {
      setLoading(true);
      const response = await fetchFoldersWithArticles();
      setKnowledgeData(response.folders || []);

      const theme = response.theme;
      const uuid = response.uuid;

      // Backend stores only subdomain, reconstruct full URL
      if (theme?.help_center_url && theme.help_center_url.trim() !== "") {
        setKbUrl(`https://${theme.help_center_url}.rhinon.help`);
      } else if (uuid) {
        setKbUrl(`https://${uuid}.rhinon.help`);
      }

      if (response.folders && response.folders.length > 0) {
        // Only set to first folder if no folder is currently expanded
        if (!expandedTopicId) {
          setExpandedTopicId(response.folders[0].folder_id);
        }
      }
    } catch (error) {
      console.error("error fetching article");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFoldersWithArticle();
  }, []);

  const statusFilterFromParams = useMemo(() => {
    const type = (params.type as string)?.toLowerCase();
    return !type || type === "all" ? "all" : type;
  }, [params]);

  const deleteArticle = async (artileId: string) => {
    try {
      await deleteArticleById(artileId);
      await fetchAllFoldersWithArticle();
    } catch (error) {
      console.error("failed to delete artile");
    }
  };

  const deleteTopic = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      await fetchAllFoldersWithArticle();
    } catch (error) {
      console.error("failed to delete folder");
    }
  };

  const updateArticle = async (artileId: string, updates: any) => {
    try {
      await updateArticleById(artileId, updates);
      await fetchAllFoldersWithArticle();
    } catch (error) {
      console.error("failed to update status");
    }
  };

  const createOrUpdateTopic = async (
    name: string,
    description?: string,
    topicId?: string
  ) => {
    try {
      const value = {
        name,
        description,
        topicId,
      };
      const response = await createFolder(value);
      await fetchAllFoldersWithArticle();

      // If creating a new folder (not updating), expand it
      if (!topicId && response?.folder_id) {
        setExpandedTopicId(response.folder_id);
      }

      console.log(topicId ? "folder updated" : "folder created");
    } catch (error) {
      console.error("failed to create/update folder", error);
    }
  };

  const handleToggleExpansion = (id: string) => {
    setExpandedTopicId((prev) => (prev === id ? null : id));
  };

  const role = Cookies.get("currentRole");

  const handleCreateArticle = (topicId?: string) => {
    if (!canAddArticle) {
      toast.error(
        "You've reached your plan's article limit. Upgrade to add more articles."
      );
      return;
    }

    // Keep the folder expanded
    if (topicId) {
      setExpandedTopicId(topicId);
    }

    const params = topicId ? `?topicId=${topicId}` : "";
    router.push(`/${role}/knowledge-base/create${params}`);
  };

  const handleEditArticle = (articleId: string) => {
    router.push(`/${role}/knowledge-base/edit/${articleId}`);
  };

  const handleViewArticle = (articleId: string) => {
    window.open(`/kb/${articleId}`, "_blank");
  };

  const handleStatusFilterChange = (status: string) => {
    router.push(`${pathname}?type=${status}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a folder
    if (activeId.startsWith("folder-")) {
      const oldIndex = knowledgeData.findIndex(
        (folder) => `folder-${folder.folder_id}` === activeId
      );
      const newIndex = knowledgeData.findIndex(
        (folder) => `folder-${folder.folder_id}` === overId
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove(knowledgeData, oldIndex, newIndex);
        setKnowledgeData(newData);
        // TODO: Call API to save folder order
      }
    }
    // Check if dragging an article
    else if (activeId.startsWith("article-")) {
      // Find which folder contains the article
      const folderIndex = knowledgeData.findIndex((folder) =>
        folder.articles.some(
          (article) => `article-${article.articleId}` === activeId
        )
      );

      if (folderIndex !== -1) {
        const folder = knowledgeData[folderIndex];
        const oldIndex = folder.articles.findIndex(
          (article) => `article-${article.articleId}` === activeId
        );
        const newIndex = folder.articles.findIndex(
          (article) => `article-${article.articleId}` === overId
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newArticles = arrayMove(folder.articles, oldIndex, newIndex);
          const newData = [...knowledgeData];
          newData[folderIndex] = { ...folder, articles: newArticles };
          setKnowledgeData(newData);
          // TODO: Call API to save article order
        }
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden bg-sidebar">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
          <Loading areaOnly />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col rounded-lg border bg-background shadow-sm transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Articles</h2>
          </div>

          <Input
            placeholder="Find an article"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 w-80"
          />

          <div className="flex items-center gap-5">
            <p
              onClick={() => window.open(kbUrl || `/kb`, "_blank")}
              className="text-sm font-medium hover:text-blue-800 underline cursor-pointer"
            >
              {kbUrl
                ? kbUrl.replace("https://", "").replace("http://", "")
                : "Your Knowledge Base"}
            </p>
            <Button onClick={() => setIsCreateTopicOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0 p-4">
          {knowledgeData.length == 0 && <NoDataThumbail />}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={knowledgeData.map((topic) => `folder-${topic.folder_id}`)}
              strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {knowledgeData.map((topic: any) => {
                  const filteredArticles = topic.articles.filter((article: any) => {
                    const matchesStatus =
                      statusFilterFromParams === "all" ||
                      article.status === statusFilterFromParams;
                    const matchesSearch = article.title
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                    return matchesStatus && matchesSearch;
                  });

                  if (searchQuery.trim() !== "" && filteredArticles.length === 0) {
                    return null;
                  }

                  return (
                    <TopicRow
                      key={topic.folder_id}
                      id={`folder-${topic.folder_id}`}
                      topic={{
                        ...topic,
                        isExpanded: expandedTopicId === topic.folder_id,
                      }}
                      filteredCount={filteredArticles.length}
                      onToggleExpansion={handleToggleExpansion}
                      onAddArticle={handleCreateArticle}
                      onEditTopic={handleEditTopic}
                      onDeleteTopic={deleteTopic}>
                      {expandedTopicId === topic.folder_id && (
                        <SortableContext
                          items={filteredArticles.map(
                            (article: any) => `article-${article.articleId}`
                          )}
                          strategy={verticalListSortingStrategy}>
                          {filteredArticles.map((article: any) => (
                            <ArticleRow
                              key={article.articleId}
                              id={`article-${article.articleId}`}
                              article={article}
                              onEdit={() => handleEditArticle(article.articleId)}
                              onView={() => handleViewArticle(article.articleId)}
                              onDelete={deleteArticle}
                              onStatusChange={(id, status) =>
                                updateArticle(id, { status })
                              }
                            />
                          ))}
                        </SortableContext>
                      )}

                      {expandedTopicId === topic.folder_id && (
                        <div className="ml-14 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateArticle(topic.folder_id)}
                            className={cn(
                              "text-primary hover:text-primary/80",
                              !canAddArticle && "opacity-50 cursor-not-allowed"
                            )}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add article
                          </Button>
                        </div>
                      )}
                    </TopicRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </div>

      <CreateTopicDialog
        open={isCreateTopicOpen}
        onOpenChange={(open) => {
          setIsCreateTopicOpen(open);
          if (!open) setEditingTopic(null);
        }}
        onCreateTopic={createOrUpdateTopic}
        topicId={editingTopic?.folderId}
        initialName={editingTopic?.name}
        initialDescription={editingTopic?.description}
      />
    </div>
  );
}
