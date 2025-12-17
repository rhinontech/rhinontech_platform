"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Search, TrendingUp, TrendingDown, Target, Eye, MousePointer } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface KeywordInsightsProps {
  dateRange: string
}

const topKeywords = [
  { keyword: "seo analytics", position: 3, traffic: 1250, ctr: 8.5, trend: "up", difficulty: "medium" },
  { keyword: "website performance", position: 7, traffic: 890, ctr: 5.2, trend: "up", difficulty: "high" },
  { keyword: "digital marketing tools", position: 12, traffic: 650, ctr: 3.8, trend: "down", difficulty: "high" },
  { keyword: "seo dashboard", position: 5, traffic: 580, ctr: 6.1, trend: "up", difficulty: "low" },
  { keyword: "web analytics", position: 15, traffic: 420, ctr: 2.9, trend: "stable", difficulty: "medium" },
  { keyword: "keyword research", position: 8, traffic: 380, ctr: 4.7, trend: "up", difficulty: "medium" },
  { keyword: "site optimization", position: 18, traffic: 290, ctr: 2.1, trend: "down", difficulty: "low" },
]

const keywordTrendData = [
  { month: "Jan", keywords: 45 },
  { month: "Feb", keywords: 52 },
  { month: "Mar", keywords: 48 },
  { month: "Apr", keywords: 61 },
  { month: "May", keywords: 67 },
  { month: "Jun", keywords: 73 },
]

const competitorGaps = [
  {
    keyword: "marketing automation",
    competitor: "competitor.com",
    theirPosition: 4,
    ourPosition: null,
    opportunity: "high",
  },
  {
    keyword: "conversion optimization",
    competitor: "example.com",
    theirPosition: 6,
    ourPosition: null,
    opportunity: "medium",
  },
  {
    keyword: "user experience design",
    competitor: "competitor.com",
    theirPosition: 8,
    ourPosition: 15,
    opportunity: "medium",
  },
  { keyword: "growth hacking", competitor: "example.com", theirPosition: 3, ourPosition: null, opportunity: "high" },
]

function getTrendIcon(trend: string) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <div className="h-4 w-4" />
  }
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
    case "high":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

function getOpportunityBadge(opportunity: string) {
  switch (opportunity) {
    case "high":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">High</Badge>
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
    case "low":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export function KeywordInsights({ dateRange }: KeywordInsightsProps) {
  const totalTraffic = topKeywords.reduce((sum, keyword) => sum + keyword.traffic, 0)
  const avgPosition = Math.round(topKeywords.reduce((sum, keyword) => sum + keyword.position, 0) / topKeywords.length)
  const avgCTR = Math.round((topKeywords.reduce((sum, keyword) => sum + keyword.ctr, 0) / topKeywords.length) * 10) / 10

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73</div>
            <p className="text-xs text-muted-foreground">+6 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keyword Traffic</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTraffic.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly organic visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPosition}</div>
            <p className="text-xs text-muted-foreground">Average ranking position</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR}%</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Keyword Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Growth Over Time</CardTitle>
          <CardDescription>Number of ranking keywords by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              keywords: { label: "Keywords", color: "#8884d8" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={keywordTrendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="keywords"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Keywords by Traffic</CardTitle>
          <CardDescription>Your highest performing keywords and their metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-right">Traffic</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-center">Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topKeywords.map((keyword) => (
                <TableRow key={keyword.keyword}>
                  <TableCell className="font-medium">{keyword.keyword}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={keyword.position <= 5 ? "default" : keyword.position <= 10 ? "secondary" : "outline"}
                    >
                      #{keyword.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{keyword.traffic.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{keyword.ctr}%</TableCell>
                  <TableCell className="text-center">{getTrendIcon(keyword.trend)}</TableCell>
                  <TableCell className="text-center">{getDifficultyBadge(keyword.difficulty)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Competitor Keyword Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Keyword Gaps</CardTitle>
          <CardDescription>Keywords your competitors rank for but you don't</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Competitor</TableHead>
                <TableHead className="text-center">Their Position</TableHead>
                <TableHead className="text-center">Our Position</TableHead>
                <TableHead className="text-center">Opportunity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitorGaps.map((gap) => (
                <TableRow key={gap.keyword}>
                  <TableCell className="font-medium">{gap.keyword}</TableCell>
                  <TableCell>{gap.competitor}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">#{gap.theirPosition}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {gap.ourPosition ? (
                      <Badge variant="secondary">#{gap.ourPosition}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not ranking</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{getOpportunityBadge(gap.opportunity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
