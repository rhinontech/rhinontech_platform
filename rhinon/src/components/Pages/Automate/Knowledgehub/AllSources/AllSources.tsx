"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  Globe,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  MoreHorizontal,
  FileText,
  Loader2,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useParams } from "next/navigation";
import { source } from "../../../../../../public/index";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAutomation, triggerTraining } from "@/services/automations/automationServices";
import Loading from "@/app/loading";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";
import { getSocket } from "@/services/webSocket";

export default function AllSources() {
  const { toggleAutomateSidebar } = useSidebar();
  const [showHero, setShowHero] = useState(true);
  const router = useRouter();
  const params = useParams();
  const role = params?.role || "admin";
  const [websites, setWebsites] = useState<
    { url: string; updatedAt: string }[]
  >([]);
  const [files, setFiles] = useState<
    { originalName: string; size: number; uploadedAt: string }[]
  >([]);
  const [articles, setArticles] = useState<
    { title: string; updatedAt: string }[]
  >([]);
  const [showWebsites, setShowWebsites] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showArticles, setShowArticles] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isTrained, setIsTrained] = useState(true);
  const [untrainedWebsitesCount, setUntrainedWebsitesCount] = useState(0);
  const [untrainedFilesCount, setUntrainedFilesCount] = useState(0);
  const [untrainedArticlesCount, setUntrainedArticlesCount] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<string>("idle");
  const [trainingProgress, setTrainingProgress] = useState<number>(0);



  const isChatbotInstalled = useUserStore.getState().userData?.onboarding?.chatbot_installed;


  useEffect(() => {
    async function fetchAll() {
      try {
        const response = await getAutomation();
        setWebsites(response.training_url || []);
        setFiles(response.training_pdf || []);
        setArticles(response.training_article || []);


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

        // Set training status
        setTrainingStatus(response.training_status || "idle");
        setTrainingProgress(response.training_progress || 0);

      } catch (err) {
        // handle error if needed
      } finally {
        setLoading(false);
      }
    }
    fetchAll();

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
      setLoading(false);
    };

    socket.on(`training:progress:${organizationId}`, handleTrainingProgress);
    socket.on(`training:completed:${organizationId}`, handleTrainingCompleted);

    return () => {
      socket.off(`training:progress:${organizationId}`, handleTrainingProgress);
      socket.off(`training:completed:${organizationId}`, handleTrainingCompleted);
    };
  }, []);


  const handleTrain = async () => {
    try {
      setLoading(true);
      setTrainingStatus("training");

      const chatbot_id = useUserStore.getState().userData?.chatbotId;

      if (!chatbot_id) {
        throw new Error("Chatbot ID not found");
      }

      await triggerTraining(chatbot_id);
      toast.success("Training started successfully!");
    } catch (error: any) {
      toast.error(`Training failed: ${error.message}`);
      setLoading(false);
      setTrainingStatus("idle");
    }
  }


  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleAutomateSidebar}
              className="h-4 w-4 cursor-pointer text-muted-foreground"
            />
            <h2 className="text-base font-bold">All Sources</h2>
          </div>
          {/* <Button
            onClick={handleTrain}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2"
          >
            {loading ? "Training..." : "Train AI"}
          </Button> */}
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 h-0 p-8">
          <div className="space-y-6">
            {/* Banner Section */}
            {(showHero && !isChatbotInstalled) && (
              <div className="relative bg-gradient-to-r from-transparent to-secondary rounded-lg p-10 overflow-hidden">
                <button className="absolute top-4 right-4 cursor-pointer">
                  <X
                    onClick={() => setShowHero(false)}
                    className="h-6 w-6 text-muted-foreground"
                  />
                </button>

                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <h3 className="text-xl font-semibold mb-3">
                      Power up <span className="text-primary">Chatbot</span>{" "}
                      with your business knowledge
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Equip your agents with instant answers and smarter
                      replies. Add public websites and PDFs to the Knowledge
                      hub. Use the knowledge to assist agents through Copilot
                      and generate reply suggestions for customer chats.
                    </p>
                    <button className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary transition-colors ease-in">
                      <div className="w-5 h-5 text-[#1D519F] rounded-full flex items-center justify-center">
                        <Info className="h-4 w-4" />{" "}
                        {/* Icon thoda bada kiya */}
                      </div>
                      <span className="font-semibold">Tell me more</span>{" "}
                      {/* Text bold */}
                    </button>
                  </div>

                  <div className="flex-shrink-0">
                    <Image
                      src={source}
                      alt="Copilot illustration"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="relative min-h-[200px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <Loading areaOnly />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Websites Card */}
                  <div
                    onClick={() =>
                      router.push(`/${role}/automate/knowledge-hub/websites`)
                    }
                    className="bg-card text-card-foreground rounded-xl p-6 border w-full flex flex-col justify-between transition-shadow duration-200 ease-in"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-2">
                          Websites{" "}
                          <span className="text-xs relative bottom-[1px] text-muted-foreground px-2 border rounded-3xl bg-accent/50">
                            {websites.length}
                          </span>
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Enter URLs of public websites or web pages.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center">
                          <Globe className="h-10 w-10 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="bg-[#ECECEC] cursor-pointer text-foreground rounded-xl transition-colors ease-in w-full py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/${role}/automate/knowledge-hub/websites?addWebsite=true`
                        );
                      }}
                    >
                      Add website
                    </Button>
                  </div>

                  {/* Files Card */}
                  <div
                    onClick={() =>
                      router.push(`/${role}/automate/knowledge-hub/files`)
                    }
                    className="bg-card text-card-foreground rounded-xl p-6 border w-full flex flex-col justify-between transition-shadow duration-200 ease-in"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-2">
                          Files{" "}
                          <span className="text-xs relative bottom-[1px] text-muted-foreground px-2 border rounded-3xl bg-accent/50">
                            {files.length}
                          </span>{" "}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Upload Files with relevant business information.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-20 h-20   flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/${role}/automate/knowledge-hub/files?addFile=true`
                        );
                      }}
                      variant="outline"
                      className="bg-[#ECECEC] cursor-pointer text-foreground rounded-xl transition-colors ease-in w-full py-4"
                    >
                      Add Files File
                    </Button>
                  </div>

                  {/* Articles Card */}
                  <div
                    onClick={() =>
                      router.push(`/${role}/automate/knowledge-hub/articles`)
                    }
                    className="cursor-pointer bg-card text-card-foreground rounded-xl p-6 border w-full flex flex-col justify-between transition-shadow duration-200 ease-in"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-2">
                          Articles{" "}
                          <span className="text-xs relative bottom-[1px] text-muted-foreground px-2 border rounded-3xl bg-accent/50">
                            {articles.length}
                          </span>
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Have useful documentation or guides? Upload them here.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/${role}/automate/knowledge-hub/articles?addArticle=true`
                        );
                      }}
                      variant="outline"
                      className="bg-[#ECECEC] cursor-pointer text-foreground rounded-xl transition-colors ease-in w-full py-4"
                    >
                      Upload Article
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
      {(!isTrained && (untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount > 0)) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-foreground/95 backdrop-blur-md text-background px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 pl-6 pr-2 border border-white/10">
            <span className="text-sm font-medium mr-2">
              {[
                untrainedWebsitesCount > 0 && `${untrainedWebsitesCount} Website${untrainedWebsitesCount > 1 ? 's' : ''}`,
                untrainedFilesCount > 0 && `${untrainedFilesCount} File${untrainedFilesCount > 1 ? 's' : ''}`,
                untrainedArticlesCount > 0 && `${untrainedArticlesCount} Article${untrainedArticlesCount > 1 ? 's' : ''}`,
              ].filter(Boolean).join(", ")} {untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount === 1 ? 'is' : 'are'} untrained
            </span>

            <Button
              onClick={handleTrain}
              size="sm"
              disabled={trainingStatus === 'training' || untrainedWebsitesCount + untrainedFilesCount + untrainedArticlesCount === 0}
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
  );
}
