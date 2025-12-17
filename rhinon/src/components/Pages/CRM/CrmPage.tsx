import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, BarChart3, Calendar, Mail, Phone, Building2, TrendingUp } from 'lucide-react';

export default function CrmPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b h-[60px] p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-bold">CRM</h2>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Coming Soon
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="flex flex-col items-center justify-center min-h-full p-8">
          {/* Hero Section */}
          <div className="text-center mb-12 max-w-2xl">
            <div className="mb-8 relative">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-full flex items-center justify-center">
                <Users className="w-16 h-16 text-accent" />
              </div>
              <div className="absolute -top-2 -right-8 w-8 h-8 bg-chart-4 rounded-full animate-pulse" />
              <div className="absolute -bottom-4 -left-6 w-6 h-6 bg-chart-2 rounded-full animate-pulse delay-300" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-balance">
              Customer Relationship Management
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Powerful CRM tools are coming to help you manage relationships, track deals, and grow your business with intelligent insights.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Contact Management</h3>
                <p className="text-sm text-muted-foreground">
                  Organize and track all customer interactions in one place
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 mx-auto mb-4 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="font-semibold mb-2">Sales Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Visual pipeline to track deals from lead to close
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 mx-auto mb-4 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="font-semibold mb-2">Analytics & Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed insights into sales performance and trends
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Task Automation</h3>
                <p className="text-sm text-muted-foreground">
                  Automate follow-ups and streamline workflows
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">What's Coming</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Email integration and tracking</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Call logging and scheduling</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <Building2 className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Company and deal management</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <BarChart3 className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Advanced reporting dashboard</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <Target className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Lead scoring and qualification</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                <Users className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Team collaboration tools</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
