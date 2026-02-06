"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PanelLeft,
  Plus,
  FileText,
  X,
  Info,
  Edit,
  PenSquare,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import Image from "next/image";
import images from "@/components/Constants/Images";
import {
  createOrUpdateAutomation,
  getArticleForAutomation,
  getAutomation,
  trainAndSetAssistant,
  triggerTraining,
  deleteTrainingSource,
} from "@/services/automations/automationServices";
import { useUserStore } from "@/utils/store";
import Loading from "@/app/loading";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/plans";
import { getSocket } from "@/services/webSocket";

interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface AvailableArticle {
  id: string;
  title: string;
  status: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function Articles() {
  const { toggleAutomateSidebar } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [availableArticles, setAvailableArticles] = useState<
    AvailableArticle[]
  >([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArticleType, setSelectedArticleType] = useState("");
  const [loading, isLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isTrained, setIsTrained] = useState(true);
  const [trainLoading, setTrainLoading] = useState(false);
  const [untrainedWebsitesCount, setUntrainedWebsitesCount] = useState(0);
  const [untrainedFilesCount, setUntrainedFilesCount] = useState(0);
  const [untrainedArticlesCount, setUntrainedArticlesCount] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<string>("idle");
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);

  const storedData = localStorage.getItem("user-data");

  const isChatbotInstalled = storedData
    ? JSON.parse(storedData)?.state?.userData?.onboarding?.chatbot_installed
    : null;

  // Determine the user's article limit

  const subscriptionLimit = PLAN_LIMITS[orgPlan]?.article || 3;

  // Derived flag: has user reached their plan limit?
  const canAddArticle = articles.length < subscriptionLimit;

  useEffect(() => {
    getArticle();
    getAvailableArtiles();
  }, []);

  useEffect(() => {
    // Don't run until articles have finished loading
    if (fetching) return;

    const addArticleParam = searchParams.get("addArticle");

    if (addArticleParam === "true") {
      const canAddArticle = articles.length < subscriptionLimit;

      if (canAddArticle) {
        setIsAddModalOpen(true);
      } else {
        toast.error(
          "You’ve reached your plan limit. Upgrade your plan to add more articles."
        );
      }

      // Remove ?addArticle=true from the URL
      const currentUrl = window.location.pathname;
      router.replace(currentUrl);
    }
  }, [searchParams, articles.length, subscriptionLimit, router, fetching]);

  // Listen for training updates via WebSocket
  useEffect(() => {
    const organizationId = useUserStore.getState().userData?.orgId;
    if (!organizationId) return;

    const socket = getSocket();

    const handleTrainingProgress = async (data: any) => {
      if (data.organization_id !== organizationId) return;
      const response = await getAutomation();
      setTrainingStatus(response.training_status || "idle");
      setTrainingProgress(response.training_progress || 0);
    };

    const handleTrainingCompleted = async (data: any) => {
      if (data.organization_id !== organizationId) return;
      const response = await getAutomation();
      setTrainingStatus(response.training_status || "idle");
      setTrainingProgress(response.training_progress || 0);
      setTrainLoading(false);
      await getArticle(); // Refresh articles
      toast.success("Training completed successfully!");
    };

    const handleTrainingError = async (data: any) => {
      if (data.organization_id !== organizationId) return;
      await getArticle(); // Refresh data to see if anything partially succeeded or to reset UI
      setTrainingStatus("failed"); // Or "idle"
      setTrainLoading(false);
      toast.error(`Training failed: ${data.message || "Unknown error"}`);
    };

    socket.on(`training:progress:${organizationId}`, handleTrainingProgress);
    socket.on(`training:completed:${organizationId}`, handleTrainingCompleted);
    socket.on(`training:error:${organizationId}`, handleTrainingError);

    return () => {
      socket.off(`training:progress:${organizationId}`, handleTrainingProgress);
      socket.off(`training:completed:${organizationId}`, handleTrainingCompleted);
      socket.off(`training:error:${organizationId}`, handleTrainingError);
    };
  }, []);

  const getArticle = async () => {
    setFetching(true);
    try {
      const response = await getAutomation();
      const fetchedArticles = response.training_article || [];
      setIsTrained(true); // Reset to true before checking

      if (response?.training_url.length > 0) {
        let count = 0;
        response.training_url.forEach((item: any) => {
          if (!item.is_trained) {
            setIsTrained(false);
            count++;
          }
        });
        setUntrainedWebsitesCount(count);
      }
      if (response?.training_pdf.length > 0) {
        let count = 0;
        response.training_pdf.forEach((item: any) => {
          if (!item.is_trained) {
            setIsTrained(false);
            count++;
          }
        });
        setUntrainedFilesCount(count);
      }
      if (response?.training_article.length > 0) {
        let count = 0;
        response.training_article.forEach((item: any) => {
          if (!item.is_trained) {
            setIsTrained(false);
            count++;
          }
        });
        setUntrainedArticlesCount(count);
      }
      setTrainingStatus(response.training_status || "idle");
      setTrainingProgress(response.training_progress || 0);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error getting the URLs:", error);
    } finally {
      setFetching(false);
    }
  };


  const handleTrain = async () => {

    try {
      setTrainLoading(true);
      setTrainingStatus("training");

      const chatbot_id = useUserStore.getState().userData?.chatbotId;

      if (!chatbot_id) {
        throw new Error("Chatbot ID not found");
      }

      await triggerTraining(chatbot_id);
      toast.success("Training started successfully!");
    } catch (error: any) {
      toast.error(`Training failed: ${error.message}`);
      setTrainLoading(false);
      setTrainingStatus("idle");
    }
  }

  const getAvailableArtiles = async () => {
    try {
      const response = await getArticleForAutomation();
      // Show all articles, not just published
      setAvailableArticles(response || []);
    } catch (error) {
      console.error("Error getting the URLs:", error);
    }
  };

  const role = Cookies.get("currentRole");

  const handleAddArticle = async () => {
    isLoading(true);
    const selected = availableArticles.find(
      (a) => a.id === selectedArticleType
    );

    if (!selected) return;

    const newArticle: Article = {
      id: selected.id,
      title: selected.title,
      content: selected.content || "",
      updatedAt: new Date().toISOString(),
    };

    const updatedArticles = [...articles, newArticle];

    try {
      await createOrUpdateAutomation({
        training_article: updatedArticles,
        isChatbotTrained: false,
      });
      setArticles(updatedArticles);
      handleCloseModal();
      toast.success("Article added successfully.");
      setIsTrained(false);
      setUntrainedArticlesCount((pre) => pre + 1);
      // try {
      //   await trainAndSetAssistant(chatbotId);
      // } catch (trainError) {
      //   console.error("Failed to retrain chatbot after upload:", trainError);
      //   toast.error("Article addedd, but retraining failed.");
      // }
      setIsTrained(false);
    } catch (error) {
      console.error("Failed to add article:", error);
      toast.error("Adding article failed");
    } finally {
      isLoading(false);
    }

  };

  const handleCreateArticle = () => {
    // Navigate to create article route
    router.push(`/${role}/knowledge-base`);
  };

  const handleEditArticle = (articleId: string) => {
    console.log;
    router.push(`/${role}/knowledge-base/edit/${articleId}`);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedArticleType("");
  };

  const removeArticle = async (articleId: string) => {
    const updatedArticles = articles.filter((a) => a.id !== articleId);

    try {
      await deleteTrainingSource(articleId, 'article');
    } catch (e) {
      console.error("Failed to delete source vectors", e);
    }

    try {
      await createOrUpdateAutomation({
        training_article: updatedArticles,
        isChatbotTrained: false,
      });
      setArticles(updatedArticles);

      const deletedArticle = articles.find(a => a.id === articleId);
      if (deletedArticle && (deletedArticle as any).is_trained === false || (deletedArticle as any).is_trained === undefined) {
        setUntrainedArticlesCount(prev => Math.max(0, prev - 1));
      }

      toast.success("Article removed successfully.");
      // try {
      //   await trainAndSetAssistant(chatbotId);
      // } catch (trainError) {
      //   console.error(
      //     "Failed to retrain chatbot after file deletion:",
      //     trainError
      //   );
      //   toast.error("Article removed, but retraining failed.");
      // }
    } catch (error) {
      console.error("Failed to remove article:", error);
      toast.error("Failed to remove article");
    }
  };

  // const toggleArticleStatus = async (id: string) => {
  //   const updatedArticles = articles.map((a) =>
  //     a.id === id
  //       ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() }
  //       : a
  //   );

  //   try {
  //     await createOrUpdateAutomation({
  //       training_article: updatedArticles,
  //       isChatbotTrained: false,
  //     });
  //     setArticles(updatedArticles);
  //   } catch (error) {
  //     console.error("Failed to toggle status:", error);
  //   }
  // };

  const handleViewArticle = (articleId: string) => {
    window.open(`/kb/${articleId}`, "_blank");
  };


  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-background">
        <div className="flex flex-1 flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
            <div className="flex items-center gap-4">
              <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
              <h2 className="text-base font-bold">Articles</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCreateArticle}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10">
                <PenSquare className="h-4 w-4 mr-2" />
                Create Article
              </Button>
              {/* Always show Add Article button */}
              <Button
                onClick={() => {
                  if (!canAddArticle) {
                    toast.error(
                      "You’ve reached your plan limit. Upgrade your plan to add more articles."
                    );
                    return; // prevent modal opening
                  }
                  setIsAddModalOpen(true);
                }}
                disabled={fetching}
                className={cn(
                  "bg-primary text-primary-foreground",
                  !canAddArticle && "opacity-50 cursor-not-allowed"
                )}>
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 h-0">
            {showHero && (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary">
                  <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
                    <p className="font-semibold text-2xl">Add Articles</p>
                    <p className="text-base text-muted-foreground">
                      Add existing articles or create new ones to build your
                      knowledge base. Articles can be organized by type and used
                      to provide information to your team and customers.
                    </p>
                    <p className="flex items-center gap-2 text-primary">
                      <Info className="h-4 w-4" />
                      Tell me more
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-[9px]">
                    <Image
                      src={images.RhinoArticle}
                      width={167}
                      height={213}
                      alt={""}
                    />
                    <X
                      className="cursor-pointer"
                      onClick={() => setShowHero(false)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="relative min-h-[200px]">
              {fetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <Loading areaOnly />
                </div>
              ) : articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  {/* Empty State */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No articles added
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Add existing articles or create new ones to start building
                      your knowledge base.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Add Article
                      </Button>
                      <Button
                        onClick={handleCreateArticle}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10">
                        Create New Article
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.title}
                      className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate max-w-2xl">
                              {article.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleViewArticle(article.id)}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* <p className="text-sm text-muted-foreground mb-1 truncate">
                          {article.description}
                        </p> */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {/* <span className="bg-muted px-2 py-0.5 rounded text-xs">
                            {getArticleTypeLabel(article.type)}
                          </span>
                          <span>•</span> */}
                            <span>
                              {new Date(article.updatedAt).toLocaleDateString()}
                            </span>
                            {/* <span>•</span>
                          <div className="flex items-center gap-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                article.isActive
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              )}
                            />
                            <span>
                              {article.isActive ? "Active" : "Inactive"}
                            </span>
                          </div> */}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditArticle(article.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {/* <Checkbox
                        checked={article.isActive}
                        onCheckedChange={() => toggleArticleStatus(article.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      /> */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArticle(article.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {(!isTrained && (untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount > 0)) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-foreground/95 backdrop-blur-md text-background px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 pl-6 pr-2 border border-white/10">
              <span className="text-sm font-medium mr-2">
                {trainLoading ? "Chatbot is Training" : (
                  <>
                    {[
                      untrainedWebsitesCount > 0 && `${untrainedWebsitesCount} Website${untrainedWebsitesCount > 1 ? 's' : ''}`,
                      untrainedFilesCount > 0 && `${untrainedFilesCount} File${untrainedFilesCount > 1 ? 's' : ''}`,
                      untrainedArticlesCount > 0 && `${untrainedArticlesCount} Article${untrainedArticlesCount > 1 ? 's' : ''}`,
                    ].filter(Boolean).join(", ")} {untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount === 1 ? 'is' : 'are'} untrained
                  </>
                )}
              </span>

              <Button
                onClick={handleTrain}
                size="sm"
                disabled={trainingStatus === 'training' || (untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount === 0)}
                className="h-8 rounded-full bg-background text-foreground hover:bg-background/90 font-semibold px-4"
              >
                {trainingStatus === 'training' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Training... {trainingProgress}%
                  </>
                ) : (
                  "Train AI"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Article Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Article</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Select the type of article you want to add. This helps organize
              your content and makes it easier for users to find the information
              they need.
            </div>

            {/* Article Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Article Type</label>
              <Select
                value={selectedArticleType}
                onValueChange={setSelectedArticleType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select article type..." />
                </SelectTrigger>
                <SelectContent>
                  {availableArticles.length !== 0 ? (
                    availableArticles
                      .filter(
                        (article) =>
                          // show if not already added OR if currently selected
                          !articles.some((a) => a.title === article.title) ||
                          article.id === selectedArticleType
                      )
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-sm">
                              {type.title}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem disabled value="no-articles">
                      No articles available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                onClick={handleAddArticle}
                disabled={!selectedArticleType || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Add Article
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
