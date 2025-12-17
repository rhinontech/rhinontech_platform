"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp, DollarSign, Target, Award } from "lucide-react";
import { getDashboardStats } from "@/services/crm/groupViewServices";
import Loader from "@/components/Common/Loader/Loader";
import Loading from "@/app/loading";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        setStats(res);
      })
      .finally(() => setLoading(false));
  }, []);

  // Show loader
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        <Loading areaOnly />
      </div>
    );
  }

  // Extract values from API
  const {
    metrics,
    leadsByStatus,
    leadsByIndustry,
    leadsByMonth,
    revenueByPipeline,
    leadsByPriority,
    topDeals,
  } = stats;

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)] w-full rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-border h-[60px] p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-bold text-foreground">Dashboard</h2>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex flex-1 h-0 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Generated Revenue
              </span>
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              ${(metrics.totalRevenue / 1000).toFixed(0)}K
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Conversion Rate</span>
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-bold">
              {metrics.conversionRate.toFixed(0)}%
            </div>
          </div>

          {/* Avg Deal Value */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Avg Deal Value</span>
              <Target className="h-5 w-5 text-[var(--chart-2)]" />
            </div>
            <div className="text-3xl font-bold">
              ${(metrics.avgDealValue / 1000).toFixed(0)}K
            </div>
          </div>

          {/* Total Leads */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Leads</span>
              <Award className="h-5 w-5 text-[var(--chart-4)]" />
            </div>
            <div className="text-3xl font-bold">{metrics.totalLeads}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Month */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">
              Leads by Creation Date
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--chart-1)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Pipeline */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Revenue by Pipeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByPipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="pipeline" />
                <YAxis />
                <Tooltip formatter={(v) => `$${v}K`} />
                <Bar
                  dataKey="revenue"
                  fill="var(--chart-2)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leads By Status */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Leads by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="var(--chart-5)"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leads by Industry */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Leads by Industry</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leadsByIndustry || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }>
                  {(leadsByIndustry || []).map((_: any, i: any) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leads by Priority */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Leads by Priority</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Deals */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Top 5 Deals by Value</h3>

            <div className="space-y-3">
              {topDeals?.map((deal: any, idx: number) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.company}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    ${(deal.dealValue / 1000).toFixed(0)}K
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </ScrollArea>
    </div>
  );
}
