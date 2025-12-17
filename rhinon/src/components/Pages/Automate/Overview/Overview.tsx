"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  X,
  SquarePen,
  RefreshCw,
  Paperclip,
  Newspaper,
  Workflow,
  Clock,
  PanelLeft,
  Sparkles,
  ArrowRight,
  Globe,
  FileText,
  BookOpen,
  Settings,
  Mail,
  MessageSquare,
  Inbox,
  Target,
  TrendingUp,
  BarChart3,
  Users,
  Briefcase,
  Calendar,
  Kanban,
  ListTodo,
  MessageCircle,
  UserPlus,
  Palette,
  FileQuestion,
  Search,
  Info,
  Zap,
  Bot,
  PenTool,
  MessagesSquare,
} from "lucide-react";
import Loading from "@/app/loading";
import { useUserStore } from "@/utils/store";
import { cn } from "@/lib/utils";
import images from "@/components/Constants/Images";
import { toast } from "sonner";
import { useCopilot } from "@/context/CopilotContext";

const sections = [
  {
    section: "Speed up chatting",
    description: "AI-powered tools to enhance your communication",
    icon: Zap,
    gradient: "from-yellow-500/10 via-orange-500/10 to-red-500/10",
    items: [
      {
        id: "chat-copilot",
        title: "Chat with Copilot",
        desc: "Get instant answers from AI assistant",
        icon: Bot,
        gradient: "from-yellow-500 to-orange-600",
        action: "open-copilot",
      },
      {
        id: "enhance-messages",
        title: "Enhance your messages",
        desc: "Adjust the tone, fix grammar and more",
        icon: PenTool,
        gradient: "from-orange-500 to-red-600",
        action: "open-copilot-with-prompt",
        prompt: "Tell me more about text enhancements",
      },
      {
        id: "reply-suggestions",
        title: "Get Reply suggestions",
        desc: "Suggest smart replies while chatting with customers",
        icon: MessagesSquare,
        gradient: "from-red-500 to-pink-600",
        route: "/automate/knowledge-hub",
      },
    ],
  },
  {
    section: "Knowledge Hub",
    description: "Build your AI's knowledge base with content from multiple sources",
    icon: BookOpen,
    gradient: "from-blue-500/10 via-indigo-500/10 to-purple-500/10",
    items: [
      {
        id: "sync-websites",
        title: "Sync Websites",
        desc: "Let AI agent use any public website",
        icon: Globe,
        gradient: "from-blue-500 to-indigo-600",
        route: "/automate/knowledge-hub/websites?addWebsite=true",
      },
      {
        id: "import-files",
        title: "Import Content from Files",
        desc: "Upload PDF files and extract text",
        icon: FileText,
        gradient: "from-indigo-500 to-purple-600",
        route: "/automate/knowledge-hub/files?addFile=true",
      },
      {
        id: "sync-articles",
        title: "Sync Articles",
        desc: "Let AI agent use any public articles",
        icon: Newspaper,
        gradient: "from-purple-500 to-pink-600",
        route: "/automate/knowledge-hub/articles?addArticle=true",
      },
    ],
  },
  {
    section: "Inbox Management",
    description: "Manage all customer communications in one place",
    icon: Inbox,
    gradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
    items: [
      {
        id: "manage-emails",
        title: "Manage Emails",
        desc: "Handle customer emails efficiently",
        icon: Mail,
        gradient: "from-emerald-500 to-teal-600",
        route: "/inbox/emails",
      },
      {
        id: "manage-tickets",
        title: "Manage Tickets",
        desc: "Track and resolve support tickets",
        icon: FileQuestion,
        gradient: "from-teal-500 to-cyan-600",
        route: "/tickets",
      },
      {
        id: "live-chats",
        title: "Live Chats",
        desc: "Real-time customer conversations",
        icon: MessageSquare,
        gradient: "from-cyan-500 to-blue-600",
        route: "/chats",
      },
    ],
  },
  {
    section: "Customer Engagement",
    description: "Drive engagement with targeted campaigns and analytics",
    icon: Target,
    gradient: "from-violet-500/10 via-purple-500/10 to-fuchsia-500/10",
    items: [
      {
        id: "engagement-overview",
        title: "Engagement Overview",
        desc: "View all engagement metrics and campaigns",
        icon: BarChart3,
        gradient: "from-violet-500 to-purple-600",
        route: "/engage",
      },
      {
        id: "set-goals",
        title: "Set Goals",
        desc: "Define and track engagement goals",
        icon: Target,
        gradient: "from-purple-500 to-fuchsia-600",
        route: "",
      },
      {
        id: "traffic-analytics",
        title: "Traffic Analytics",
        desc: "Monitor website traffic and user behavior",
        icon: TrendingUp,
        gradient: "from-fuchsia-500 to-pink-600",
        route: "/engage/traffic",
      },
    ],
  },
  {
    section: "CRM & Sales",
    description: "Manage customer relationships and sales pipeline",
    icon: Briefcase,
    gradient: "from-rose-500/10 via-red-500/10 to-orange-500/10",
    items: [
      {
        id: "crm-dashboard",
        title: "CRM Dashboard",
        desc: "Overview of your sales pipeline",
        icon: BarChart3,
        gradient: "from-rose-500 to-red-600",
        route: "/crm/dashboard",
      },
      {
        id: "manage-contacts",
        title: "Manage Contacts",
        desc: "Organize customer and lead information",
        icon: Users,
        gradient: "from-red-500 to-orange-600",
        route: "/crm",
      },
      {
        id: "sales-pipeline",
        title: "Sales Pipeline",
        desc: "Track deals through your sales process",
        icon: Briefcase,
        gradient: "from-orange-500 to-amber-600",
        route: "/crm",
      },
    ],
  },
  {
    section: "Project Spaces",
    description: "Collaborate on projects with your team",
    icon: Kanban,
    gradient: "from-sky-500/10 via-blue-500/10 to-indigo-500/10",
    items: [
      {
        id: "kanban-board",
        title: "Kanban Board",
        desc: "Visualize work with drag-and-drop boards",
        icon: Kanban,
        gradient: "from-sky-500 to-blue-600",
        route: "/spaces/board",
      },
      {
        id: "calendar-view",
        title: "Calendar View",
        desc: "See tasks and deadlines in calendar format",
        icon: Calendar,
        gradient: "from-blue-500 to-indigo-600",
        route: "/spaces/calendar",
      },
      {
        id: "project-summary",
        title: "Project Summary",
        desc: "Get overview of project progress",
        icon: ListTodo,
        gradient: "from-indigo-500 to-violet-600",
        route: "/spaces/summary",
      },
    ],
  },
  {
    section: "Team Collaboration",
    description: "Work together seamlessly with your team",
    icon: Users,
    gradient: "from-green-500/10 via-emerald-500/10 to-teal-500/10",
    items: [
      {
        id: "team-members",
        title: "Team Members",
        desc: "Manage your team and permissions",
        icon: UserPlus,
        gradient: "from-green-500 to-emerald-600",
        route: "/teams",
      },
      {
        id: "working-hours",
        title: "Set Working Hours",
        desc: "Simplify teamwork with clear availability",
        icon: Clock,
        gradient: "from-emerald-500 to-teal-600",
        route: "",
      },
      {
        id: "create-workflow",
        title: "Create Workflows",
        desc: "Map each step to simplify work and speed things up",
        icon: Workflow,
        gradient: "from-teal-500 to-cyan-600",
        route: "/automate/workflows",
      },
    ],
  },
  {
    section: "Customization & Settings",
    description: "Personalize your experience and configure settings",
    icon: Settings,
    gradient: "from-slate-500/10 via-gray-500/10 to-zinc-500/10",
    items: [
      {
        id: "customize-widget",
        title: "Customize Chat Widget",
        desc: "Your chat. Fully customizable",
        icon: Palette,
        gradient: "from-slate-500 to-gray-600",
        route: "/settings/theme",
      },
      {
        id: "knowledge-base-settings",
        title: "Knowledge Base",
        desc: "Create and manage help articles",
        icon: BookOpen,
        gradient: "from-gray-500 to-zinc-600",
        route: "/knowledge-base",
      },
      {
        id: "seo-settings",
        title: "SEO Settings",
        desc: "Optimize your help center for search engines",
        icon: Search,
        gradient: "from-zinc-500 to-neutral-600",
        route: "/seo",
      },
    ],
  },
];

export default function Overview() {
  const { toggleAutomateSidebar } = useSidebar();
  const { openCopilot } = useCopilot();
  const [showHero, setShowHero] = useState(true);
  const [loading, setloading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const role = params?.role || "admin";
  const onboarding = useUserStore((state) => state.userData.onboarding);
  const chatbotInstalled = onboarding?.chatbot_installed || false;

  const handleItemClick = (item: (typeof sections)[0]["items"][0]) => {
    // Handle Copilot actions
    if (item.action === "open-copilot") {
      openCopilot();
      return;
    }

    if (item.action === "open-copilot-with-prompt") {
      openCopilot(item.prompt, true); // true = auto-send
      return;
    }

    // Navigate to route if available
    if (item.route) {
      setloading(true);
      router.push(`/${role}${item.route}`);
    }
  };

  if (loading) {
    return (
      <div className="flex relative items-center justify-center h-full w-full">
        <Loading areaOnly />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleAutomateSidebar}
              className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Overview</h2>
              <div className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                AI Powered
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          {/* Hero Placeholder - Always show at top */}
          {showHero && (
            <div className="flex flex-col items-center justify-center p-10">
              <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary">
                <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
                  <p className="font-semibold text-2xl">
                    Welcome to Automate
                  </p>
                  <p className="text-base text-muted-foreground">
                    Discover powerful features to automate your workflow.
                    Explore AI-powered tools, manage customer interactions,
                    and boost team productivity all in one place.
                  </p>
                  <p className="flex items-center gap-2 text-primary cursor-pointer hover:underline">
                    <Info className="h-4 w-4" />
                    Tell me more
                  </p>
                </div>
                <div className="flex-shrink-0 flex gap-[9px] items-start">
                  <Image
                    src={images.RhinoWebsite}
                    width={167}
                    height={213}
                    alt="Rhino mascot"
                    className="object-contain"
                  />
                  <X
                    className="cursor-pointer hover:bg-accent rounded-full p-1 transition-colors"
                    onClick={() => setShowHero(false)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">

            {/* Chatbot Setup Hero - Only show if chatbot not installed */}
            {!chatbotInstalled && (
              <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/20 p-8 shadow-lg">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Left Content */}
                  <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      <Sparkles className="h-4 w-4" />
                      Get Started
                    </div>

                    <div className="space-y-3">
                      <h1 className="font-bold text-3xl md:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Smarter Support,
                        <br />
                        Seamless Automation
                      </h1>
                      <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                        Use AI-powered chatbots to resolve queries instantly,
                        reduce team workload, and deliver exceptional customer
                        experiences.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => {
                          setloading(true);
                          router.push(`/${role}/settings/messenger`);
                        }}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-6 shadow-lg hover:shadow-xl transition-all group"
                      >
                        Set up Chatbot
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sections */}
            {sections.map((section, sectionIndex) => (
              <div
                key={section.section}
                className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${sectionIndex * 100}ms` }}
              >
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl bg-gradient-to-br",
                      section.gradient
                    )}
                  >
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{section.section}</h2>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl border-2 bg-card hover:bg-accent/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
                      onClick={() => handleItemClick(item)}
                      style={{ animationDelay: `${itemIndex * 50}ms` }}
                    >
                      <div className="p-5 space-y-3">
                        {/* Icon */}
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                              item.gradient
                            )}
                          >
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Hover gradient effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom CTA */}
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">
                  Need Help Getting Started?
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Our team is here to help you set up and optimize your AI
                  automation workflow
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl font-semibold"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
