"use client";

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
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Globe,
  Shield,
  Accessibility,
  Search,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  fetchPerformance,
  triggerPerformance,
} from "@/services/seo/seoServive";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/utils/store";
import { getSocket } from "@/services/webSocket";
import Loading from "@/app/loading";
import { toast } from "sonner";

interface SeoPerformanceProps {
  chatbotId: string;
}

// -----------------------------
// Icon Mapping
const categoryIcons = {
  performance: Zap,
  accessibility: Accessibility,
  bestPractices: Shield,
  seo: Search,
};

type CategoryKey = keyof typeof categoryIcons;

function getCategoryIcon(key: string) {
  return (categoryIcons as Record<string, typeof Globe>)[key] || Globe;
}

// -----------------------------
// Helpers
const getStatusIcon = (value: string) => {
  const val = value.toLowerCase();
  if (val.includes("fail")) return <XCircle className="h-4 w-4 text-red-500" />;
  if (val.includes("pass"))
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

const getScoreBadge = (score: number) => {
  if (score >= 90)
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Excellent
      </Badge>
    );
  if (score >= 70)
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Good
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      Needs Improvement
    </Badge>
  );
};
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PerformanceAudit({ chatbotId }: SeoPerformanceProps) {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [performanceTriggered, setPerformanceTriggered] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const intervalRef = useRef<any>(null);

  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const count = useUserStore(
    (state) => state.userData.seoPerformanceTriggerCount
  );
  const orgId = useUserStore.getState().userData.orgId;

  const subscriptionMapping: Record<string, number> = {
    Basic: 2,
    Advance: 5,
    Premium: 15,
  };
  const subscription = subscriptionMapping[orgPlan] || 1;

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchPerformance(chatbotId);
      setSeoData(response);
    } catch (err) {
      console.error("Error loading performance data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    setPerformanceTriggered(true);
    try {
      const response = await triggerPerformance(chatbotId);

      // Assuming API returns { message: "Performance audit started" }
      const message =
        response?.message || "SEO performance audit started. Please wait...";

      toast.success(message);
    } catch (err: any) {
      console.error("Error triggering audit", err);

      const errorMessage =
        err?.response?.data?.message || "Failed to trigger performance audit.";
      toast.error(errorMessage);

      setPerformanceTriggered(false);
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

        // DO NOT reset state or clear localStorage yet.
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

    socket.off(`seo:performance:started:${orgId}`);
    socket.off(`seo:performance:completed:${orgId}`);
    socket.off(`seo:performance:error:${orgId}`);

    socket.on(`seo:performance:started:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return; // ignore others

      const { estimated_time, started_at } = data;
      localStorage.setItem(
        "seoPerformance",
        JSON.stringify({ started_at, estimated_time })
      );
      setPerformanceTriggered(true);
      startCountdown(started_at, estimated_time);
    });

    socket.on(`seo:performance:completed:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return;

      fetchData();
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPerformanceTriggered(false);
      setRemainingTime(null);
      localStorage.removeItem("seoPerformance");
    });

    socket.on(`seo:performance:error:${orgId}`, (data: any) => {
      if (data.organization_id !== orgId) return;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPerformanceTriggered(false);
      setRemainingTime(null);
      localStorage.removeItem("seoPerformance");
    });
  };

  useEffect(() => {
    initSocket();
    fetchData();
    const stored = localStorage.getItem("seoPerformance");
    if (stored) {
      const { started_at, estimated_time } = JSON.parse(stored);
      const elapsed = Math.floor((Date.now() - started_at) / 1000);
      const remaining = estimated_time - elapsed;
      if (remaining > 0) {
        setPerformanceTriggered(true);
        startCountdown(started_at, estimated_time);
      } else {
        localStorage.removeItem("seoPerformance");
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

  if (!seoData || seoData.recommendations.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        {/* Animated SVG */}
        <div className="text-center max-w-md mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              {/* Outer gradient pulsing circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse dark:from-blue-600 dark:to-purple-700"></div>

              {/* Inner circle with icon */}
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

          {/* Title + Description */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No SEO Recommendations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Run an SEO performance check to generate actionable recommendations
            and insights for your site.
          </p>
        </div>

        {/* Button + Timer */}
        <div className="flex items-center justify-center gap-4">
          {remainingTime !== null && (
            <div className="text-sm text-gray-500">
              Processing: {formatTime(remainingTime)}
            </div>
          )}
          <Button
            onClick={handleTrigger}
            disabled={performanceTriggered}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCcw className="h-4 w-4 mr-2" />
            {performanceTriggered ? "Running..." : "Run SEO Performance"}
          </Button>
        </div>
      </div>
    );
  }

  const overall = seoData.overallScore || {};
  const scores = [
    { key: "performance", label: "Performance", score: overall.performance },
    {
      key: "accessibility",
      label: "Accessibility",
      score: overall.accessibility,
    },
    {
      key: "bestPractices",
      label: "Best Practices",
      score: overall.bestPractices,
    },
    { key: "seo", label: "SEO", score: overall.seo },
  ];

  const overallScore = Math.round(
    (overall.performance +
      overall.accessibility +
      overall.bestPractices +
      overall.seo) /
    4
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-end">
        {remainingTime !== null && (
          <div className="text-sm text-gray-500 mr-auto">
            Processing: {formatTime(remainingTime)}
          </div>
        )}
        {seoData && (
          <div className="text-sm text-gray-600">
            Last trained: {new Date(seoData.updated_at).toLocaleString()}
          </div>
        )}
        <Button onClick={handleTrigger} disabled={performanceTriggered}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {performanceTriggered ? "Running..." : "Run SEO performance"}
        </Button>
      </div>

      {/* Overall Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Comprehensive audit based on Lighthouse metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div
              className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </div>
            {getScoreBadge(overallScore)}
          </div>
          <Progress value={overallScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Individual Score Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {scores.map((item) => {
          const Icon = getCategoryIcon(item.key);
          return (
            <Card key={item.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  <div
                    className={`text-xl font-bold ${getScoreColor(
                      item.score
                    )}`}>
                    {item.score}
                  </div>
                </CardTitle>
                <Progress value={item.score} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                {item.key === "performance" &&
                  Object.entries(seoData.metrics || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key.toUpperCase()}</span>
                      <span className="font-medium">{String(val)}</span>
                    </div>
                  ))}

                {item.key === "accessibility" &&
                  Object.entries(seoData.accessibility || {}).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm">
                        <div className="flex gap-2 items-center">
                          {getStatusIcon(String(val))}
                          <span>{key}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {String(val)}
                        </span>
                      </div>
                    )
                  )}

                {item.key === "bestPractices" &&
                  Object.entries(seoData.bestPractices || {}).map(
                    ([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{key}</span>
                        <span className="text-muted-foreground">
                          {String(val)}
                        </span>
                      </div>
                    )
                  )}

                {item.key === "seo" &&
                  Object.entries(seoData.seo || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm">
                      <div className="flex gap-2 items-center">
                        {getStatusIcon(String(val))}
                        <span>{key}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {String(val)}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      {seoData.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to improve your scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {seoData.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="border p-4 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{rec.title}</h4>
                  <Badge>{rec.priority}</Badge>
                </div>
                {/* <p className="text-sm text-muted-foreground">
                  {rec.description}
                </p> */}
                <div className="flex gap-4 text-xs">
                  <span className="text-green-700">Impact: {rec.impact}</span>
                  <span className="text-blue-700">Effort: {rec.effort}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Diagnostics */}
      {seoData.diagnostics?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostics</CardTitle>
            <CardDescription>Deep technical insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-auto">
            {seoData.diagnostics.map((diag: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {getStatusIcon(diag.status || diag.title)}
                <span>{diag.title}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
