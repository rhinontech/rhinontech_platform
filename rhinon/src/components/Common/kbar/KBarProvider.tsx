"use client";

import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  ActionImpl,
  ActionId,
} from "kbar";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Search,
  Link,
  Zap,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Users,
  BarChart3,
  MessageCircle,
  Clock,
  Home,
  Bell,
  HelpCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";


import Cookies from "js-cookie";
import { logout } from "@/services/authServices";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
            {item}
          </div>
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId}
          />
        )
      }
    />
  );
}

const ResultItem = ({
  action,
  active,
  currentRootActionId,
}: {
  action: ActionImpl;
  active: boolean;
  currentRootActionId: ActionId | null | undefined;
}) => {
  const ancestors = useMemo(() => {
    if (!currentRootActionId) return action.ancestors;
    const index = action.ancestors.findIndex(
      (ancestor) => ancestor.id === currentRootActionId
    );
    return action.ancestors.slice(index + 1);
  }, [action.ancestors, currentRootActionId]);

  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
        active ? "bg-muted/80" : "hover:bg-muted/50"
      }`}>
      {action.icon && (
        <div className="flex h-6 w-6 items-center justify-center">
          {action.icon}
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {ancestors.length > 0 &&
            ancestors.map((ancestor) => (
              <React.Fragment key={ancestor.id}>
                <span className="text-muted-foreground text-sm">
                  {ancestor.name}
                </span>
                <span className="text-muted-foreground">›</span>
              </React.Fragment>
            ))}
          <span className="text-sm font-medium">{action.name}</span>
        </div>
        {action.subtitle && (
          <span className="text-xs text-muted-foreground">
            {action.subtitle}
          </span>
        )}
      </div>
      {action.shortcut?.length && (
        <div className="flex items-center gap-1">
          {action.shortcut.map((sc) => (
            <kbd
              key={sc}
              className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {sc}
            </kbd>
          ))}
        </div>
      )}
    </div>
  );
};

export function KBarCommandPalette({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const role = Cookies.get("currentRole");
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setOpenConfirm(false);
    router.push("/auth/login");
  };

  const actions = [
      // Quick Actions
      // {
      //   id: "stop-chats",
      //   name: "Stop Accepting Chats",
      //   shortcut: ["s", "c"],
      //   keywords: "stop pause chats accepting",
      //   icon: <Link className="h-4 w-4 text-muted-foreground" />,
      //  perform: () => {router.push("/dashboard")
      //  console.log("stop chat ...")
      //  },
      //   section: "Quick Actions",
      // },
      // {
      //   id: "start-chats",
      //   name: "Start Accepting Chats",
      //   shortcut: ["s", "t"],
      //   keywords: "start resume chats accepting",
      //   icon: <MessageCircle className="h-4 w-4 text-muted-foreground" />,
      //    perform: () =>{ router.push(`/${role}/teams`)
      //   console.log("start chat ...")
      //   },
    
      //   section: "Quick Actions",
      // },
      // Navigation
      {
        id: "dashboard",
        name: "Go to Dashboard",
        shortcut: ["g", "d"],
        keywords: "dashboard home overview",
        icon: <Home className="h-4 w-4 text-muted-foreground" />,
        perform: () => router.push(`/${role}/dashboard`),
        section: "Navigation",
      },
      {
        id: "knowledge-hub",
        name: "Knowledge Hub",
        subtitle: "Go to Automate",
        shortcut: ["g", "k"],
        keywords: "knowledge hub automate automation",
        icon: <Zap className="h-4 w-4 text-muted-foreground" />,
        perform: () => router.push(`/${role}/automate/knowledge-hub`),
        section: "Navigation",
      },
      {
        id: "team-management",
        name: "Team Management",
        shortcut: ["g", "t"],
        keywords: "team members users management",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        perform: () =>{ router.push(`/${role}/teams/`);

        console.log("team manage ...")
        },
        section: "Navigation",
      },
      // {
      //   id: "reports",
      //   name: "View Reports",
      //   shortcut: ["g", "r"],
      //   keywords: "reports analytics performance",
      //   icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => router.push("/reports"),
      //   section: "Navigation",
      // },
      {
        id: "settings",
        name: "Settings",
        shortcut: ["g", "s"],
        keywords: "settings preferences configuration",
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        perform: () => router.push(`/${role}/settings`),
        section: "Navigation",
      },

      // Team Actions
      {
        id: "invite-agents",
        name: "Invite New Agents",
        shortcut: ["i", "a"],
        keywords: "invite agents team members add users",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        perform: () => {
          router.push(`/${role}/teams?invite=true`);
          console.log("Opening invite modal...");
        },
        section: "Team",
      },
      // {
      //   id: "working-hours",
      //   name: "Set Working Hours",
      //   shortcut: ["w", "h"],
      //   keywords: "working hours schedule availability",
      //   icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => {
      //     // Add your working hours logic here
      //     console.log("Opening working hours settings...");
      //   },
      //   section: "Team",
      // },
      // {
      //   id: "team-performance",
      //   name: "View Team Performance",
      //   shortcut: ["t", "p"],
      //   keywords: "team performance metrics stats",
      //   icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => router.push("/team/performance"),
      //   section: "Team",
      // },

      // Theme
      {
        id: "theme-light",
        name: "Switch to Light Theme",
        shortcut: ["t", "l"],
        keywords: "theme light mode",
        icon: <Sun className="h-4 w-4 text-muted-foreground" />,
        perform: () => setTheme("light"),
        section: "Preferences",
      },
      {
        id: "theme-dark",
        name: "Switch to Dark Theme",
        shortcut: ["t", "d"],
        keywords: "theme dark mode",
        icon: <Moon className="h-4 w-4 text-muted-foreground" />,
        perform: () => setTheme("dark"),
        section: "Preferences",
      },
      // {
      //   id: "theme-system",
      //   name: "Use System Theme",
      //   shortcut: ["t", "s"],
      //   keywords: "theme system auto",
      //   icon: <Settings className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => setTheme("system"),
      //   section: "Preferences",
      // },

      // Account
      {
        id: "profile",
        name: "View Profile",
        shortcut: ["g", "p"],
        keywords: "profile account user settings",
        icon: <User className="h-4 w-4 text-muted-foreground" />,
        perform: () => router.push("/superadmin/profile"),
        section: "Account",
      },
      // {
      //   id: "notifications",
      //   name: "Notifications",
      //   shortcut: ["g", "n"],
      //   keywords: "notifications alerts messages",
      //   icon: <Bell className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => router.push("/notifications"),
      //   section: "Account",
      // },
      // {
      //   id: "help",
      //   name: "Help & Support",
      //   shortcut: ["?"],
      //   keywords: "help support documentation faq",
      //   icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
      //   perform: () => router.push("/help"),
      //   section: "Account",
      // },
      {
        id: "logout",
        name: "Sign Out",
        shortcut: ["s", "o"],
        keywords: "logout sign out exit",
        icon: <LogOut className="h-4 w-4 text-muted-foreground" />,
        perform: () => setOpenConfirm(true), //  open confirmation instead of logging out immediately
        section: "Account",
      },
    ]

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs !p-0">
          <KBarAnimator className="relative top-[2%] mx-auto max-w-2xl w-full">
            <div className="overflow-hidden rounded-lg border bg-background shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center border-b px-4 py-3">
                <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                <KBarSearch
                  className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
                  placeholder="Search or ask..."
                />
                <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  esc
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[450px] overflow-y-auto">
                <RenderResults />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span>Navigate</span>
                    <div className="flex gap-0.5">
                      <kbd className="inline-flex h-5 w-5 select-none items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium">
                        ↑
                      </kbd>
                      <kbd className="inline-flex h-5 w-5 select-none items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium">
                        ↓
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Select</span>
                    <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      ↵
                    </kbd>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Close</span>
                    <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      esc
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You’ll need to log in again to
              access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {children}
    </KBarProvider>
  );
}
      