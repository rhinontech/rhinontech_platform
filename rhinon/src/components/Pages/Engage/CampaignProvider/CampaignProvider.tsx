"use client";

import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarClock, PanelLeft, Rocket, Zap, Target } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CampaignProvider() {
  const { toggleAutomateSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  // Extract tab from the URL path
  const pathSegments = pathname.split("/");
  const activeTab = pathSegments[pathSegments.length - 1];

  const handleTabChange = (value: string) => {
    router.push(`${value}`);
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
            <h2 className="text-base font-bold">Campaigns</h2>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </div>
        <ScrollArea className="flex-1 h-0 p-4">
          <div className="flex flex-col items-center justify-center min-h-full py-12">
            <div className="text-center max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Rocket className="h-16 w-16 text-primary" />
                    <div className="absolute -top-1 -right-1">
                      <div className="h-4 w-4 bg-chart-1 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-balance">
                  Campaigns Are Coming Soon
                </h1>
                <p className="text-lg text-muted-foreground text-pretty">
                  We're building powerful on-site marketing campaigns to help
                  you engage visitors, reduce cart abandonment, and boost
                  conversions with intelligent pop-ups and chat messages.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="text-center">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-2">
                      <Target className="h-8 w-8 text-chart-1" />
                    </div>
                    <CardTitle className="text-lg">Smart Targeting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Target visitors based on behavior, time on page, and exit
                      intent to maximize engagement
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-2">
                      <Zap className="h-8 w-8 text-chart-2" />
                    </div>
                    <CardTitle className="text-lg">Instant Offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Show discount codes, product recommendations, and helpful
                      resources at the perfect moment
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-2">
                      <CalendarClock className="h-8 w-8 text-chart-3" />
                    </div>
                    <CardTitle className="text-lg">Automated Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Set up once and let campaigns run automatically to convert
                      visitors into customers
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-2">What to expect:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Exit-intent pop-ups with discount codes</li>
                  <li>• Welcome messages for first-time visitors</li>
                  <li>• Product recommendations based on browsing</li>
                  <li>• Lead capture forms and newsletter signups</li>
                  <li>• Real-time campaign performance analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

{
  /* <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger
                value="recurring"
                className="flex items-center gap-2"
              >
                <CalendarClock className="w-4 h-4" />
                Recurring
              </TabsTrigger>
              <TabsTrigger value="one-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                One-time
              </TabsTrigger>
            </TabsList>
            <TabsContent value="recurring">
              Make changes to your recurring here.
            </TabsContent>
            <TabsContent value="one-time">
              Change your one-time here.
            </TabsContent>
          </Tabs> */
}
