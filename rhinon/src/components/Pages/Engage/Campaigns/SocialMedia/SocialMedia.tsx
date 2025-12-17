"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkedInIcon } from "@/components/Constants/SvgIcons";
import { Button } from "@/components/ui/button";

export default function SocialMedia() {
  const { toggleAutomateSidebar } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Professional networking and B2B marketing",
      icon: <LinkedInIcon />,
      available: true,
      route: `/${role}/engage/campaigns/social-media/linkedin`,
    },
    {
      id: "twitter",
      name: "Twitter / X",
      description: "Real-time updates and news",
      icon: "𝕏",
      available: false,
      route: "",
    },
    {
      id: "facebook",
      name: "Facebook",
      description: "Social networking and community building",
      icon: "📘",
      available: false,
      route: "",
    },
    {
      id: "instagram",
      name: "Instagram",
      description: "Visual storytelling and engagement",
      icon: "📷",
      available: false,
      route: "",
    },
  ];

  const handlePlatformClick = (platform: typeof platforms[0]) => {
    if (platform.available) {
      router.push(platform.route);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleAutomateSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Social Media Campaigns</h2>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Choose a platform</h1>
              <p className="text-muted-foreground">
                Select a social media platform to create and manage your campaigns
              </p>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <Card
                  key={platform.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    platform.available
                      ? "hover:border-primary"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => handlePlatformClick(platform)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{platform.icon}</div>
                        <div>
                          <CardTitle className="text-lg">
                            {platform.name}
                          </CardTitle>
                        </div>
                      </div>
                      {!platform.available && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platform.available ? (
                      <Button variant="outline" className="w-full">
                        Manage Campaigns
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Not Available
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info Section */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Getting Started</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Connect your social media accounts in Settings → Accounts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Create campaigns with text, images, videos, and more
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Schedule posts or publish immediately
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Track engagement and campaign performance
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}