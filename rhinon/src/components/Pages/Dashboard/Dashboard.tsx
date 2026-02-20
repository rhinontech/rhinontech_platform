"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Settings,
  Users,
  MessageCircle,
  Shield,
  ExternalLink,
  Sparkles,
  Clock,
  Star,
  Server,
  Accessibility,
  Code2,
  Layers,
  Moon,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/utils/store";
import { useEffect, useState, useRef } from "react";
import {
  getActivities,
  getStatics,
} from "@/services/dashborad/dashboardService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Feature197 } from "./accordion-feature-section";
import Link from "next/link";
import Cookies from "js-cookie";
import { Tour } from "antd";
import type { TourProps } from "antd";

interface ActivityMetadata {
  [key: string]: any;
}

// Define the activity type
export interface Activity {
  id: number;
  user_id: number;
  organization_id: number;
  action: string;
  message: string;
  metadata: ActivityMetadata;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  user_name: string;
  user_image: string | null;
}

interface StatItem {
  label: string;
  value: number;
  change: string;
  icon: React.ComponentType<any>;
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type SetupStep = {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  completed: boolean;
  icon: IconType;
};

export default function ModernDashboard() {
  const [stats, setStats] = useState<StatItem[]>([
    {
      label: "Active Conversations",
      value: 0,
      change: "0%",
      icon: MessageCircle,
    },
    { label: "Active Tickets", value: 0, change: "0%", icon: Clock },
    { label: "Visitors", value: 0, change: "0%", icon: Star },
    { label: "Team Members", value: 0, change: "0%", icon: Users },
  ]);

  const router = useRouter();
  const firstName = useUserStore((state) => state.userData.userFirstName);
  const lastName = useUserStore((state) => state.userData.userLastName);
  const userId = useUserStore((state) => state.userData.userId);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);
  const onboarding = useUserStore((state) => state.userData.onboarding);

  const isPlanValid = useUserStore((state) => state.userData.isPlanValid);
  const role = Cookies.get("currentRole");

  // Tour refs
  const statsRef = useRef(null);
  const setupGuideRef = useRef(null);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const activityRef = useRef(null);

  const [tourOpen, setTourOpen] = useState(false);

  // Extract onboarding state
  const installationGuide = onboarding?.installation_guide || {};
  const chatbotInstalled = onboarding?.chatbot_installed || false;

  // Compute step completion status
  const stepsCompleted = [
    installationGuide.syncWebsite,
    installationGuide.customizeChatbot,
    installationGuide.addTeamMember,
    chatbotInstalled,
  ].filter(Boolean).length;

  const totalSteps = 4;
  const progressPercentage = (stepsCompleted / totalSteps) * 100;

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const userName = `${capitalize(firstName)} ${capitalize(lastName)}`.trim();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  // Tour steps configuration
  const tourSteps: TourProps["steps"] = [
    {
      title: "📊 Dashboard Overview",
      description:
        "Welcome! Here you can see your key metrics at a glance - active conversations, tickets, visitors, and team members.",
      target: () => statsRef.current,
      placement: "bottom",
    },
    {
      title: "🚀 Installation Guide",
      description:
        "This is your setup checklist. Complete these 4 steps to get your chatbot up and running. Track your progress here!",
      target: () => setupGuideRef.current,
      placement: "bottom",
    },
    {
      title: "🌐 Step 1: Website Sync",
      description:
        "Connect your website to enable seamless chatbot integration. Click to expand and start this step.",
      target: () => step1Ref.current,
      placement: "right",
    },
    {
      title: "🎨 Step 2: Customize Chatbot",
      description:
        "Personalize your chatbot's appearance, personality, and responses to match your brand.",
      target: () => step2Ref.current,
      placement: "right",
    },
    {
      title: "💻 Step 3: Install Chatbot",
      description:
        "Embed the chatbot code into your website and go live instantly!",
      target: () => step3Ref.current,
      placement: "right",
    },
    {
      title: "👥 Step 4: Manage Team",
      description:
        "Add and manage your team members for smooth collaboration and support.",
      target: () => step4Ref.current,
      placement: "right",
    },
    {
      title: "📝 Recent Activity",
      description:
        "Stay updated with recent actions and changes in your organization. Click 'View All' to see complete activity history.",
      target: () => activityRef.current,
      placement: "left",
    },
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getStatics(chatbotId);

        const formatChange = (value: any) => {
          if (value == null) return "0%";
          return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
        };

        setStats([
          {
            label: "Active Conversations",
            value: data?.chats?.count ?? 0,
            change: formatChange(data?.chats?.weeklyChange),
            icon: MessageCircle,
          },
          {
            label: "Active Tickets",
            value: data?.tickets?.count ?? 0,
            change: formatChange(data?.tickets?.weeklyChange),
            icon: Clock,
          },
          {
            label: "Visitors",
            value: data?.liveVisitors?.count ?? 0,
            change: formatChange(data?.liveVisitors?.weeklyChange),
            icon: Star,
          },
          {
            label: "Team Members",
            value: data?.teamMembers?.count ?? 0,
            change: formatChange(data?.teamMembers?.weeklyChange),
            icon: Users,
          },
        ]);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);

        // Fallback to all 0 if fetch fails
        setStats([
          {
            label: "Active Conversations",
            value: 0,
            change: "0%",
            icon: MessageCircle,
          },
          { label: "Active Tickets", value: 0, change: "0%", icon: Clock },
          { label: "Visitors", value: 0, change: "0%", icon: Star },
          { label: "Team Members", value: 0, change: "0%", icon: Users },
        ]);
      }
    };

    loadDashboard();
  }, [chatbotId]);

  const setUpStep = [
    {
      id: 1,
      title: "Website Sync",
      description:
        "Connect your website to enable chatbot integration seamlessly.",
      icon: Zap,
      href: `${role}/automate/knowledge-hub/websites?addWebsite=true`,
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
      ref: step1Ref,
    },
    {
      id: 2,
      title: "Customize Chatbot",
      description:
        "Set up your chatbot's personality, responses, and appearance.",
      icon: Settings,
      href: `${role}/settings/theme`,
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop",
      ref: step2Ref,
    },
    {
      id: 3,
      title: "Install Chatbot",
      description: "Embed the chatbot into your website and go live instantly.",
      icon: Code2,
      href: `${role}/settings/messenger`,
      image:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop",
      ref: step3Ref,
    },
    {
      id: 4,
      title: "Manage your Team Effortlessly",
      description: "Add and manage your teammates for smooth collaboration.",
      icon: Users,
      href: `${role}/teams?addAgent=true`,
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
      ref: step4Ref,
    },
  ];

  const getAllActivities = async () => {
    try {
      const response = await getActivities(); // your API call
      // console.log(response.data);
      setActivities(response.data || []); // set fetched activities
    } catch (error) {
      console.error("Failed to fetch activities", error);
    }
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000); // in seconds

    if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  };

  const iconFeatures = [
    {
      id: 1,
      title: "Blazing-Fast Setup",
      description:
        "Kickstart your UI in minutes with ready-to-use building blocks that follow shadcn/ui and Tailwind best practices.",
      icon: Zap,
    },
    {
      id: 2,
      title: "Type-Safe by Default",
      description:
        "Enjoy end-to-end type safety with strict TypeScript types and predictable component APIs.",
      icon: Code2,
    },
    {
      id: 3,
      title: "Dark Mode Ready",
      description:
        "All components adapt to dark mode using semantic tokens for consistent contrast and accessibility.",
      icon: Moon,
    },
    {
      id: 4,
      title: "Accessible UI",
      description:
        "Built with ARIA attributes, keyboard support, and semantic HTML to meet WCAG guidelines.",
      icon: Accessibility,
    },
    {
      id: 5,
      title: "Composable Architecture",
      description:
        "Compose primitives into advanced patterns and ship complex sections with minimal code.",
      icon: Layers,
    },
  ] as const;

  useEffect(() => {
    getAllActivities();
  }, []);

  if (!isPlanValid) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] w-full">
        <div className="text-center space-y-6 p-8 max-w-lg w-full">
          <h1 className="text-3xl font-bold text-foreground">
            Your plan has expired
          </h1>
          <p className="text-muted-foreground text-lg">
            Please renew your subscription to regain access to your dashboard
            and all features.
          </p>
          <Button
            onClick={() => router.push(`/${role}/billings`)}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            Go to Billing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-var(--header-height)-1rem)] overflow-hidden rounded-lg border bg-background dark:bg-background-dark">
      <div className="flex flex-1 flex-col w-full">
        <ScrollArea className="flex-1 h-0 p-4">
          <div className="max-w-7xl mx-auto py-10">
            <div className="mb-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    Welcome back,{" "}
                    <span className="text-primary">{userName}</span>
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Let's continue building something amazing together
                  </p>
                </div>
                <Button
                  onClick={() => setTourOpen(true)}
                  className="flex items-center gap-2"
                  variant="outline">
                  <Play className="w-4 h-4" />
                  Start Tour
                </Button>
              </div>

              {/* Stats Row */}
              <div
                ref={statsRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="bg-card border border-border shadow-sm transition-shadow">
                    <CardContent className="px-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <stat.icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stat.change}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel - Setup Checklist */}

              <div className="lg:col-span-2 space-y-6">
                <Card
                  ref={setupGuideRef}
                  className="bg-card border border-border shadow-sm py-0">
                  <CardContent className="p-8">
                    {/* Header with progress */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            Installation Guide
                          </h2>
                          <p className="text-muted-foreground">
                            Complete setup in just {totalSteps} steps
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {stepsCompleted}/{totalSteps}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(progressPercentage)}% complete
                        </p>
                      </div>
                    </div>

                    {/* Steps */}
                    <motion.div
                      className="space-y-5"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.15 },
                        },
                      }}>
                      {setUpStep.map((step) => {
                        const StepIcon = step.icon;
                        const isOpen = openStep === step.id;
                        const isCompleted =
                          (step.id === 1 && installationGuide.syncWebsite) ||
                          (step.id === 2 &&
                            installationGuide.customizeChatbot) ||
                          (step.id === 3 && chatbotInstalled) ||
                          (step.id === 4 && installationGuide.addTeamMember);

                        return (
                          <motion.div
                            key={step.id}
                            ref={step.ref}
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.4 }}
                            className={`rounded-xl border border-border bg-card transition-all duration-200 overflow-hidden 
          ${isOpen ? "shadow-md ring-1 ring-primary/20" : "shadow-sm"}`}>
                            {/* Header */}
                            <motion.div
                              className="flex items-center justify-between p-6 cursor-pointer select-none"
                              onClick={() =>
                                setOpenStep(isOpen ? null : step.id)
                              }
                              transition={{ duration: 0.3 }}>
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-shrink-0">
                                  <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-lg shadow-sm  bg-primary/10 text-primary `}>
                                    <StepIcon className="w-6 h-6 text-primary" />
                                  </div>
                                  {isCompleted && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-1 border border-emerald-200">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                      Step {step.id}
                                    </span>
                                    {isCompleted && (
                                      <span
                                        className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary
                                    ">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                  <h3
                                    className={`text-lg font-semibold text-primary`}>
                                    {step.title}
                                  </h3>
                                </div>
                              </div>

                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className={`p-2.5 rounded-lg ${isOpen
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                  }`}>
                                <ChevronDown className="w-4 h-4" />
                              </motion.div>
                            </motion.div>

                            {/* Expanded content */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.4 }}
                                  className="border-t border-border bg-muted/30">
                                  <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                                      <div className="flex gap-6 items-start">
                                        {/* Left side - Text and Button */}
                                        <div className="flex-1 space-y-5">
                                          <div>
                                            <p className="text-muted-foreground leading-relaxed text-xl mt-1">
                                              {step.description}
                                            </p>
                                          </div>

                                          <div className="flex justify-start">
                                            {!isCompleted ? (
                                              <Button
                                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 flex items-center gap-2"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  router.push(`/${step.href}`);
                                                }}>
                                                Start Now
                                                <ArrowRight className="w-4 h-4" />
                                              </Button>
                                            ) : (
                                              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                  Step Completed
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Right side - Image */}
                                        <div className="flex-1">
                                          <img
                                            src={step.image}
                                            alt={step.title}
                                            className="w-full h-36 object-cover rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Command Center */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card
                  ref={activityRef}
                  className="bg-card border border-border shadow-sm py-4">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-foreground">
                        Recent Activity
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowModal(true)}>
                        View All
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {activities.slice(0, 5).map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {activity.message} {/* Only message on card */}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {activity.user_id === userId
                                ? "you"
                                : activity.user_name}{" "}
                              • {timeAgo(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={showModal} onOpenChange={setShowModal}>
                  <DialogContent className="sm:max-w-[600px] w-full max-h-[80vh] overflow-y-auto p-6 rounded-xl bg-card text-foreground border border-border">
                    <DialogHeader>
                      <DialogTitle>All Activities</DialogTitle>
                      <DialogDescription>
                        View recent activities for your organization
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors flex flex-col gap-1">
                          {/* Top line: message */}
                          <p className="text-sm font-semibold break-words">
                            {activity.message}
                          </p>

                          {/* User and time */}
                          <p className="text-xs text-muted-foreground capitalize">
                            {activity.user_id === userId
                              ? "you"
                              : activity.user_name}{" "}
                            • {timeAgo(activity.created_at)}
                          </p>

                          {/* Metadata */}
                          {activity.metadata &&
                            Object.keys(activity.metadata).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {Object.entries(activity.metadata).map(
                                  ([key, value]) => (
                                    <p key={key} className="break-words">
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {typeof value === "object"
                                        ? JSON.stringify(value, null, 2)
                                        : value}
                                    </p>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>

                    <DialogFooter className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowModal(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Ant Design Tour */}
      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={tourSteps}
      />
    </div>
  );
}
