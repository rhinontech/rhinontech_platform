"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  ArrowUpRight,
  CalendarIcon,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { fetchAnalytics } from "@/services/seo/seoServive";
import Loading from "@/app/loading";

interface TrafficAnalyticsProps {
  chatbotId: string;
}

export function TrafficAnalytics({ chatbotId }: TrafficAnalyticsProps) {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [deviceOptions, setDeviceOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await fetchAnalytics({
          device: deviceFilter,
          location: locationFilter,
          source: sourceFilter,
          date: dateRange,
          chatbot_id: chatbotId,
        });

        setSeoData(json);
        setLoading(false);
        if (json.deviceTypes) {
          setDeviceOptions(["all", ...Object.keys(json.deviceTypes)]);
        }

        if (json.countries) {
          setLocationOptions(["all", ...Object.keys(json.countries)]);
        }

        if (json.trafficSources) {
          setSourceOptions(["all", ...Object.keys(json.trafficSources)]);
        }
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceFilter, locationFilter, sourceFilter, dateRange]);

  console.log("date", dateRange);
  if (loading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
        <Loading areaOnly />
      </div>
    );

  if (!seoData || !seoData.uniqueVisitors) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Animated SVG */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse dark:from-blue-600 dark:to-purple-700"></div>
              <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm dark:shadow-gray-900">
                <svg
                  className="w-10 h-10 text-gray-600 dark:text-gray-400 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No SEO Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Start tracking your website performance to unlock powerful insights
            and growth opportunities.
          </p>
        </div>
      </div>
    );
  }

  const trafficSourceData = Object.entries(seoData.trafficSources || {}).map(
    ([name, value]) => ({
      name,
      value,
      color: name === "direct" ? "#82ca9d" : "#8884d8",
    })
  );

  const deviceData = Object.entries(seoData.deviceTypes || {}).map(
    ([name, value]) => ({
      name,
      value,
      color: name === "desktop" ? "#8884d8" : "#82ca9d",
    })
  );

  const topPagesData = (seoData.topPages || []).map((page: any) => ({
    page: page.page,
    views: page.views,
    engagement: millisecondsToTime(page.avgTime),
    bounce: `${page.bounceRate.toFixed(2)}%`,
  }));

  const weeklyTrafficData = (seoData.dailyTraffic || []).map((day: any) => ({
    day: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
    visitors: day.visitors,
  }));

  const {
    uniqueVisitors,
    totalPageViews,
    totalSessions,
    bounceRate,
    avgSessionDuration,
    returningVisitors,
    pagesPerSession,
    trend,
  } = seoData;

  function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function formatCountry(code: string) {
    if (code === "Unknown") return "Unknown";
    if (code === "US") return "United States";
    if (code === "UK") return "United Kingdom";
    if (code === "CA") return "Canada";
    if (code === "IN") return "India";
    return capitalize(code);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            {deviceOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Devices" : capitalize(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locationOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Locations" : formatCountry(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Sources" : capitalize(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <CalendarIcon className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unique Visitors"
          icon={<Users />}
          value={uniqueVisitors}
          change={trend.uniqueVisitorsChange}
        />
        <StatCard
          title="Page Views"
          icon={<Eye />}
          value={totalPageViews}
          change={trend.pageViewsChange}
        />
        <StatCard
          title="Sessions"
          icon={<MousePointer />}
          value={totalSessions}
          change={trend.sessionsChange}
          isNegative
        />
        <StatCard
          title="Bounce Rate"
          icon={<ArrowUpRight />}
          value={`${bounceRate.toFixed(2)}%`}
          change={trend.bounceRateChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Avg. Session Duration"
          icon={<Clock />}
          value={millisecondsToTime(avgSessionDuration)}
          change={trend.avgSessionDurationChange}
        />
        <StatCard
          title="Returning Visitors"
          icon={<Users />}
          value={`${returningVisitors.toFixed(2)}%`}
          change={trend.returningVisitorsChange}
        />
        <StatCard
          title="Pages per Session"
          icon={<Eye />}
          value={pagesPerSession.toFixed(2)}
          change={trend.pagesPerSessionChange}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PieChartCard
          title="Traffic Sources"
          description="Breakdown of traffic by source"
          data={trafficSourceData}
        />
        <PieChartCard
          title="Device Types"
          description="Traffic breakdown by device"
          data={deviceData}
        />
      </div>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Traffic Trend</CardTitle>
          <CardDescription>Daily visitors over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ visitors: { label: "Visitors", color: "#8884d8" } }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrafficData}>
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: "#8884d8", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages by Engagement</CardTitle>
          <CardDescription>
            Most visited pages and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Avg. Time</TableHead>
                <TableHead className="text-right">Bounce Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPagesData.map((page: any) => (
                <TableRow key={page.page}>
                  <TableCell className="font-medium">{page.page}</TableCell>
                  <TableCell className="text-right">{page.views}</TableCell>
                  <TableCell className="text-right">
                    {page.engagement}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        parseFloat(page.bounce) > 40
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {page.bounce}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions and components

function StatCard({ title, icon, value, change, isNegative = false }: any) {
  const isDrop = change < 0;
  const Icon = isDrop ? TrendingDown : TrendingUp;
  const color = isDrop ? "text-red-500" : "text-green-500";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs text-muted-foreground`}>
          <Icon className={`h-3 w-3 mr-1 ${color}`} />
          <span className={color}>{change}%</span>
          <span className="ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PieChartCard({ title, description, data }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex flex-wrap gap-2 mt-4">
          {data.map((item: any) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// function secondsToTime(seconds: number) {
//   const mins = Math.floor(seconds / 60);
//   const secs = Math.floor(seconds % 60);
//   return `${mins}m ${secs}s`;
// }
function millisecondsToTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}
