"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCcw,
} from "lucide-react";
import { fetchCompliance, triggerCompliance } from "@/services/seo/seoServive";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/utils/store";
import io from "socket.io-client";
import { getSocket } from "@/services/webSocket";
import Loading from "@/app/loading";
import { toast } from "sonner";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "needs fix":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "missing":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-gray-500" />;
  }
}

// Helper: Status badge
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "good":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Good
        </Badge>
      );
    case "needs fix":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Needs Fix
        </Badge>
      );
    case "missing":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Missing
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

// Helper: Score text color
function getScoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

// Helper: Score badge
function getScoreBadge(score: number) {
  if (score >= 90)
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Excellent
      </Badge>
    );
  if (score >= 70)
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Good Performance
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      Needs Improvement
    </Badge>
  );
}

interface SeoComplianceProps {
  chatbotId: string;
}
export function SEOCompliance({ chatbotId }: SeoComplianceProps) {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [complianceTriggered, setComplianceTriggered] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const count = useUserStore(
    (state) => state.userData.seoComplianceTriggerCount
  );
  const orgId = useUserStore.getState().userData.orgId;
  const setUserData = useUserStore((state) => state.setUserData);

  const intervalRef = useRef<any>(null);

  const subscriptionMapping: Record<string, number> = {
    Basic: 2,
    Advance: 5,
    Premium: 15,
  };
  const subscription = subscriptionMapping[orgPlan] || 1;

  const fetchData = async () => {
    try {
      const data = await fetchCompliance(chatbotId);
      setSeoData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCompliance = async () => {
    setComplianceTriggered(true);
    try {
      const response = await triggerCompliance(chatbotId);

      // Assuming your API returns something like { message: "Audit started successfully" }
      const message =
        response?.message || "SEO Compliance audit started. Please wait...";

      toast.success(message);
    } catch (error: any) {
      console.error("Trigger error", error);

      // Optional: show message from error response
      const errorMessage =
        error?.response?.data?.message || "Failed to trigger compliance audit.";
      toast.error(errorMessage);

      setComplianceTriggered(false);
    }
  };

  const startCountdown = (start: number, duration: number) => {
    const endTime = start + duration * 1000;
    clearInterval(intervalRef.current);

    const tick = () => {
      const timeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemainingTime(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRemainingTime(null);

        // ⛔️ DO NOT reset state or clear localStorage yet.
        // Wait for the WebSocket to emit "completed" or "error"
        console.log("Timer done, waiting for server response...");
        toast.warning("Timer done, please wait for server response...");
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
  };

  let socket: any = null;

  const initSocket = () => {
    if (socket) return;
    socket = getSocket();

    // Remove previous listeners before adding new ones to avoid duplicates
    socket.off(`seo:compliance:started:${orgId}`);
    socket.off(`seo:compliance:completed:${orgId}`);
    socket.off(`seo:compliance:error:${orgId}`);

    socket.on(`seo:compliance:started:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return; // ignore others

      const { estimated_time, started_at } = data;
      localStorage.setItem(
        "seoCompliance",
        JSON.stringify({ started_at, estimated_time })
      );
      setComplianceTriggered(true);
      startCountdown(started_at, estimated_time);
    });

    socket.on(`seo:compliance:completed:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return;

      fetchData();
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setComplianceTriggered(false);
      setRemainingTime(null);
      localStorage.removeItem("seoCompliance");
    });

    socket.on(`seo:compliance:error:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return;

      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setComplianceTriggered(false);
      setRemainingTime(null);
      localStorage.removeItem("seoCompliance");
    });
  };

  useEffect(() => {
    initSocket();
    fetchData();

    const scanData = localStorage.getItem("seoCompliance");
    if (scanData) {
      const { started_at, estimated_time } = JSON.parse(scanData);
      const timeElapsed = Math.floor((Date.now() - started_at) / 1000);
      const remaining = estimated_time - timeElapsed;
      if (remaining > 0) {
        setComplianceTriggered(true);
        startCountdown(started_at, estimated_time);
      } else {
        localStorage.removeItem("seoCompliance");
      }
    }

    return () => {
      clearInterval(intervalRef.current);
      // if (socket) {
      //   socket.disconnect(); //  disconnect when leaving the page
      //   socket = null;
      // }
      intervalRef.current = null;
    };
  }, []);

  if (loading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
        <Loading areaOnly />
      </div>
    );

  if (!seoData || !seoData.seoScore) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        {/* Animated SVG */}
        <div className="text-center max-w-md mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              {/* Outer pulsing gradient circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse dark:from-blue-600 dark:to-purple-700"></div>

              {/* Inner white/dark circle with bouncing icon */}
              <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm dark:shadow-gray-900">
                <svg
                  className="w-10 h-10 text-gray-600 dark:text-gray-400 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No SEO Score Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            We’re analyzing your site. Once the process completes, your SEO
            score will appear here.
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex items-center justify-center gap-4">
          {remainingTime !== null && (
            <div className="text-sm text-gray-500">
              Processing: {formatTime(remainingTime)}
            </div>
          )}
          <Button
            onClick={handleTriggerCompliance}
            disabled={complianceTriggered}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCcw className="h-4 w-4 mr-2" />
            {complianceTriggered ? "Running..." : "Run SEO Compliance"}
          </Button>
        </div>
      </div>
    );
  }

  const { seoScore, passedChecks, totalChecks, categories, actionItems } =
    seoData;
  const scoreNum = parseInt(seoScore.replace("%", ""));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-4">
        {remainingTime !== null && (
          <div className="text-sm text-gray-500 mr-auto">
            Processing: {formatTime(remainingTime)}
          </div>
        )}
        {seoData.updated_at && (
          <div className="text-sm text-gray-600">
            Last trained: {new Date(seoData.updated_at).toLocaleString()}
          </div>
        )}
        <Button
          onClick={handleTriggerCompliance}
          disabled={complianceTriggered}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {complianceTriggered ? "Running..." : "Run SEO Compliance"}
        </Button>
      </div>

      {/* Enhanced Overall SEO Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Overall SEO Health Score
          </CardTitle>
          <CardDescription>
            Your website's SEO compliance based on {totalChecks} key factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className={`text-4xl font-bold ${getScoreColor(scoreNum)}`}>
              {seoScore}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {passedChecks} of {totalChecks} checks passed
              </div>
              {getScoreBadge(scoreNum)}
            </div>
          </div>
          <Progress value={scoreNum} className="h-2" />
        </CardContent>
      </Card>

      {/* SEO Checks by Category */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((cat: any) => (
          <Card key={cat.category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {cat.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cat.checks.map((check: any) => (
                <div
                  key={check.title}
                  className="flex items-start justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      <span className="font-medium text-sm">{check.title}</span>
                    </div>
                    {check.fix && (
                      <p className="text-xs text-muted-foreground">
                        {check.fix}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Priority Action Items
          </CardTitle>
          <CardDescription>
            Issues that need immediate attention to improve SEO performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionItems.map((item: any) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium">{item.label}</h4>
                  <p className="text-sm text-muted-foreground">{item.fix}</p>
                  <Badge
                    className={`mt-2 ${
                      item.priority === "High"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {item.priority} Priority
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
