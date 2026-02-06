"use client";

import { useSidebar } from "@/context/SidebarContext";
import React, { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PanelLeft,
  Plus,
  Globe,
  X,
  Info,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import images from "@/components/Constants/Images";
import {
  analyseUrl,
  createOrUpdateAutomation,
  getAutomation,
  trainAndSetAssistant,
  triggerTraining,
  deleteTrainingSource,
  TrainingUrl,
} from "@/services/automations/automationServices";
import { useUserStore } from "@/utils/store";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/app/loading";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/plans";
import { getSocket } from "@/services/webSocket";

interface Website {
  id: string;
  url: string;
  title: string;
  description: string;
  favicon?: string;
  addedAt: Date;
  pageCount?: number;
  nextAction?: string;
}

type AnalysisStatus = "idle" | "analyzing" | "success" | "error";

export default function Websites() {
  const router = useRouter();
  const { toggleAutomateSidebar } = useSidebar();
  const [urls, setUrls] = useState<TrainingUrl[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showHero, setShowHero] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analyzedWebsite, setAnalyzedWebsite] =
    useState<Partial<Website> | null>(null);
  const [urlError, setUrlError] = useState("");
  const [loading, isLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [isTrained, setIsTrained] = useState(true);
  const [trainingStatus, setTrainingStatus] = useState<string>("idle");
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);
  const [untrainedWebsitesCount, setUntrainedWebsitesCount] = useState(0);
  const [untrainedFilesCount, setUntrainedFilesCount] = useState(0);
  const [untrainedArticlesCount, setUntrainedArticlesCount] = useState(0);

  const searchParams = useSearchParams();

  const subscriptionLimit = PLAN_LIMITS[orgPlan]?.websites || 3;
  const canAddUrl = urls.length < subscriptionLimit;

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getUrls = async () => {
    setFetching(true);
    try {
      const response = await getAutomation();
      const fetchedUrls = response.training_url || [];
      setUrls(fetchedUrls);
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
    } catch (error) {
      console.error("Error getting the URLs:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    getUrls();
  }, []);

  useEffect(() => {
    // Wait until files are fetched before handling addFile param
    if (fetching) return;

    const addFileParam = searchParams.get("addWebsite");

    if (addFileParam === "true") {
      const canAddUrl = urls.length < subscriptionLimit;
      if (canAddUrl) {
        setIsAddModalOpen(true);
      } else {
        toast.error(
          "You’ve reached your plan limit. Upgrade your plan to upload more files."
        );
      }

      // Remove ?addFile=true from the URL after handling
      const currentUrl = window.location.pathname;
      router.replace(currentUrl);
    }
  }, [searchParams, canAddUrl, fetching, router]);

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
      await getUrls(); // Refresh URLs to update is_trained
      toast.success("Training completed successfully!");
    };

    const handleTrainingError = async (data: any) => {
      if (data.organization_id !== organizationId) return;
      await getUrls(); // Refresh data to see if anything partially succeeded or to reset UI
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

  const analyzeWebsite = useCallback(
    async (url: string) => {
      if (!isValidUrl(url)) {
        setUrlError("Please enter a valid URL");
        return;
      }

      const normalizedUrl = normalizeUrl(url);

      // Check if the URL already exists in the list
      const alreadyExists = urls.some(
        (item) => normalizeUrl(item.url) === normalizedUrl
      );

      if (alreadyExists) {
        setUrlError("This website has already been added.");
        return;
      }

      setUrlError("");
      setAnalysisStatus("analyzing");

      try {
        const result = await analyseUrl(normalizedUrl);

        const website: Partial<Website> = {
          url: result.url,
          title: result.title,
          description: `Website found at ${result.domain}`,
          pageCount: result.sitemap.pageCount,
          nextAction: result.nextAction,
        };

        setAnalyzedWebsite(website);
        setAnalysisStatus("success");
      } catch (error) {
        console.error("Website analysis failed:", error);
        setUrlError("Website is not reachable or invalid.");
        setAnalysisStatus("error");
      }
    },
    [urls]
  );

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      analyzeWebsite(urlInput.trim());
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setUrlInput("");
    setAnalysisStatus("idle");
    setAnalyzedWebsite(null);
    setUrlError("");
  };

  const handleAddWebsite = async () => {
    isLoading(true);
    if (!analyzedWebsite?.url) return;

    const newWebsite = {
      url: normalizeUrl(analyzedWebsite.url),
      updatedAt: new Date().toISOString(),
      sitemap: analyzedWebsite.nextAction === "auto_scrape",
      // isActive: true,
    };

    const updatedUrls = [...urls, newWebsite];

    try {
      await createOrUpdateAutomation({
        training_url: updatedUrls,
        isChatbotTrained: false,
      });
      setUrls(updatedUrls);
      handleCloseModal();
      toast.success("Website added successfully.");
      // try {
      //   await trainAndSetAssistant(chatbotId);
      // } catch (trainError) {
      //   console.error("Failed to retrain chatbot after upload:", trainError);
      //   toast.error("Website addedd, but retraining failed.");
      // }
      setUntrainedWebsitesCount((prev) => prev + 1);
      setIsTrained(false);
    } catch (error) {
      console.error("Failed to add website:", error);
      toast.error("Failed to add Website.");
    } finally {
      isLoading(false);
    }
  };

  const handleDeleteUrl = async (index: number) => {
    const deletedUrl = urls[index];
    const updatedUrls = urls.filter((_, i) => i !== index);

    if (deletedUrl?.url) {
      try {
        await deleteTrainingSource(deletedUrl.url, 'url');
      } catch (e) {
        console.error("Failed to delete source vectors", e);
      }
    }

    try {
      await createOrUpdateAutomation({
        training_url: updatedUrls,
        isChatbotTrained: false,
      });
      setUrls(updatedUrls);

      const deletedUrl = urls[index];
      // Check if it was untrained (untrained items usually have is_trained: false, or undefined if just added)
      if (deletedUrl && (deletedUrl as any).is_trained === false || (deletedUrl as any).is_trained === undefined) {
        setUntrainedWebsitesCount(prev => Math.max(0, prev - 1));
      }

      toast.success("Website removed successfully.");
      // try {
      //   await trainAndSetAssistant(chatbotId);
      // } catch (trainError) {
      //   console.error(
      //     "Failed to retrain chatbot after file deletion:",
      //     trainError
      //   );
      //   toast.error("Website removed, but retraining failed.");
      // }
    } catch (err) {
      console.error("Error deleting URL", err);
      toast.error("Failed to deleted website.");
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

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-background">
        <div className="flex flex-1 flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
            <div className="flex items-center gap-4">
              <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
              <h2 className="text-base font-bold">Websites</h2>
            </div>
            <Button
              onClick={() => {
                if (!canAddUrl) {
                  toast.error(
                    "You’ve reached your plan limit. Upgrade your plan to upload more files."
                  );
                  return;
                }
                setIsAddModalOpen(true);
              }}
              disabled={fetching}
              className={cn(
                "bg-primary text-primary-foreground",
                !canAddUrl && "opacity-50 cursor-not-allowed"
              )}>
              <Plus className="h-4 w-4 mr-2" />
              Add Website
            </Button>
          </div>

          <ScrollArea className="flex-1 h-0">
            {showHero && (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary">
                  <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
                    <p className="font-semibold text-2xl">Add Website</p>
                    <p className="text-base text-muted-foreground">
                      Add websites with valuable knowledge about your business.
                      Include company websites, documentation sites, knowledge
                      bases, and other important web resources.
                    </p>
                    <p className="flex items-center gap-2 text-primary">
                      <Info className="h-4 w-4" />
                      Tell me more
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-[9px]">
                    <Image
                      src={images.RhinoWebsite}
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

            <p className="text-sm text-muted-foreground px-5 ">
              Add all the web pages you want the chatbot to learn from.
            </p>
            <div className="relative min-h-[200px]">
              {fetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <Loading areaOnly />
                </div>
              ) : urls.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No websites added
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Add a website with your business knowledge to support
                      agents at work.
                    </p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Add Website
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {urls.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-card rounded-lg border hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">
                              {new URL(item.url).hostname}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => window.open(item.url, "_blank")}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{item.url}</span>
                            <span>•</span>
                            {item.sitemap ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                All pages added automatically
                              </span>
                            ) : (
                              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                Pages need to be added manually
                              </span>
                            )}

                            <span>•</span>
                            {new Date(item.updatedAt).toLocaleDateString()}
                            {/* <span>•</span>
                          <div className="flex items-center gap-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                item.isActive ? "bg-green-500" : "bg-gray-400"
                              )}
                            />
                            <span>{item.isActive ? "Active" : "Inactive"}</span>
                          </div> */}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <Checkbox
                        checked={item.isActive}
                        onCheckedChange={() => toggleWebsiteStatus(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      /> */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUrl(index)}
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

      {/* Add Website Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Website</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Add a website to extract content and knowledge. This information
              will be used for internal assistance from{" "}
              <span className="text-primary font-medium underline decoration-primary/30">
                Copilot
              </span>{" "}
              and for generating{" "}
              <span className="text-primary font-medium underline decoration-primary/30">
                reply suggestions
              </span>{" "}
              in customer chats.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter website URL (e.g., example.com)"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setAnalysisStatus("idle");
                    setAnalyzedWebsite(null);
                    setUrlError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className={cn(
                    "flex-1",
                    urlError &&
                    "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={analysisStatus === "analyzing"}
                />
              </div>
              {urlError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </p>
              )}
            </div>

            {analysisStatus === "analyzing" && (
              <div className="bg-muted/30 rounded-lg p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div>
                  <p className="font-medium">Analyzing website...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting content and metadata
                  </p>
                </div>
              </div>
            )}

            {analysisStatus === "success" && analyzedWebsite && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Website analyzed successfully
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm">
                          {analyzedWebsite.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {analyzedWebsite.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          URL: {getDomainFromUrl(analyzedWebsite.url!)}
                        </span>
                        {analyzedWebsite.pageCount && (
                          <span>{analyzedWebsite.pageCount} pages found</span>
                        )}
                      </div>
                      {analyzedWebsite.nextAction === "auto_scrape" ? (
                        <p className="text-sm text-green-700">
                          Sitemap detected. We’ll automatically scrape all
                          pages.
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-700">
                          No sitemap found. Please add individual page URLs to
                          continue.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={analysisStatus === "analyzing"}>
                Cancel
              </Button>
              <Button
                onClick={
                  analysisStatus === "success"
                    ? handleAddWebsite
                    : handleUrlSubmit
                }
                disabled={
                  analysisStatus === "analyzing" ||
                  (analysisStatus === "idle" && !urlInput.trim()) ||
                  loading
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {analysisStatus === "success" ? "Add Website" : "Analyze URL"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
