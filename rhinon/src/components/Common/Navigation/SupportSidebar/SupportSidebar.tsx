"use client";
import { useSidebar } from "@/context/SidebarContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function SupportSidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathName: any = usePathname();
  const { isSupportOpen } = useSidebar();
  const roleAccessRaw = Cookies.get("roleAccess");

  // Decode roleAccess
  let roleAccess: Record<string, string[]> = {};
  if (roleAccessRaw) {
    try {
      roleAccess = JSON.parse(decodeURIComponent(roleAccessRaw));
    } catch (e) {
      console.error("Invalid roleAccess cookie:", e);
    }
  }

  const [currentRole, setCurrentRole] = useState<string>(
    Cookies.get("currentRole") || ""
  );

  // Listen for cookie changes (via interval or via a role switch callback)
  useEffect(() => {
    const interval = setInterval(() => {
      const roleFromCookie = Cookies.get("currentRole");
      if (roleFromCookie && roleFromCookie !== currentRole) {
        setCurrentRole(roleFromCookie);
      }
    }, 100); // check every 100ms
    return () => clearInterval(interval);
  }, [currentRole]);

  const BASE_PATH = `/${currentRole}/inbox`;
  //  Only one open at a time

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (id: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sidebarItems = [
    {
      id: "tickets",
      label: "Tickets",
      isIcon: true,
      submenu: [
        {
          id: "all",
          label: "All tickets",
          path: `${BASE_PATH}/tickets/filter/all`,
        },
        {
          id: "open",
          label: "Open tickets",
          path: `${BASE_PATH}/tickets/filter/open`,
        },
        {
          id: "in-progress",
          label: "In progress tickets",
          path: `${BASE_PATH}/tickets/filter/in_progress`,
        },
        {
          id: "resolved",
          label: "Resolved tickets",
          path: `${BASE_PATH}/tickets/filter/resolved`,
        },
        // {
        //   id: "raised",
        //   label: "Tickets I raised",
        //   path: `${BASE_PATH}/tickets/filter/raised_by_me`,
        // },
      ],
    },
    {
      id: "emails",
      label: "Emails",
      isIcon: false,
      path: `${BASE_PATH}/emails`,
    },
  ];

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden bg-sidebar">
      <div
        className={cn("flex flex-col transition-all duration-300 ease-in-out", {
          "w-56": isSupportOpen,
          "w-0": !isSupportOpen,
        })}
      >
        <div className="flex items-center justify-between h-[60px] p-4 bg-sidebar">
          <h2 className="text-lg font-semibold">Inbox</h2>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="space-y-1 p-2">
            {sidebarItems.map((item) => {
              const isSubmenuOpen =
                openMenus[item.id] ||
                (item.submenu &&
                  item.submenu.some((sub) => pathName.includes(sub.path)));

              return (
                <div key={item.id}>
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2 px-3 text-sm transition-colors hover:bg-accent",
                      pathName.includes(item.path) &&
                      !(
                        item.submenu &&
                        item.submenu.some((sub) =>
                          pathName.includes(sub.path)
                        )
                      ) &&
                      "bg-accent"
                    )}
                    onClick={() => {
                      if (item.submenu) {
                        toggleSubmenu(item.id);
                      } else {
                        router.push(item.path);
                      }
                    }}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      {item.isIcon && item.submenu ? (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            isSubmenuOpen ? "rotate-180" : "rotate-0"
                          )}
                        />
                      ) : (
                        <p className="w-4 h-4" />
                      )}
                      {item.label}
                    </span>
                  </div>

                  {item.submenu && isSubmenuOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((sub) => (
                        <div
                          key={sub.id}
                          className={cn(
                            "cursor-pointer rounded-lg px-3 py-1 text-sm text-muted-foreground hover:bg-muted",
                            pathName.includes(sub.path) && "bg-muted"
                          )}
                          onClick={() => router.push(sub.path)}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
        {children}
      </div>
    </div>
  );
}
