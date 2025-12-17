"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import { useUserStore } from "@/utils/store";

export function EngageSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathName = usePathname();
  const { isAutomateOpen } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  //  Dynamic customer count from Zustand
  const customerCount = useUserStore(
    (state) => state.userData.trafficCount || 0
  );

  const role = Cookies.get("currentRole");
  const BASE_PATH = `/${role}/engage`;

  const toggleSubmenu = (id: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  type SidebarItem = {
    id: string;
    label: string | ReactNode;
    path: string;
    isIcon?: boolean;
    submenu?: {
      id: string;
      label: string;
      path: string;
    }[];
  };

  //  Define sidebar items inside component
  const sidebarItems: SidebarItem[] = [
    {
      id: "traffic",
      label: "Traffic",
      // label: (
      //   <p className="flex items-center justify-between gap-2 w-full text-sm font-normal">
      //     Traffic{" "}
      //     <span className="flex gap-1 items-center text-xs">
      //       <span className="px-2 py-0.5 bg-muted rounded-sm">
      //         {customerCount}
      //       </span>
      //       <span>Customer</span>
      //     </span>
      //   </p>
      // ),
      path: `${BASE_PATH}/traffic`,
      isIcon: false,
    },
    // {
    //   id: "campaigns",
    //   label: (
    //     <p className="flex items-center justify-between gap-2 w-full text-sm font-normal">
    //       Campaigns
    //     </p>
    //   ),
    //   path: `${BASE_PATH}/campaigns`,
    //   isIcon: false,
    // },
    {
      id: "campaigns",
      label: "Campaigns",
      path: `${BASE_PATH}/campaigns`,
      isIcon: true,
      submenu: [
        {
          id: "chatbot",
          label: "Chatbot",
          path: `${BASE_PATH}/campaigns/chatbot`,
        },
        // {
        //   id: "social-media",
        //   label: "Social Media",
        //   path: `${BASE_PATH}/campaigns/social-media`,
        // },
      ],
    },
  ];

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden bg-sidebar">
      <div
        className={cn("flex flex-col transition-all duration-300 ease-in-out", {
          "w-[250px]": isAutomateOpen,
          "w-0": !isAutomateOpen,
        })}>
        <div className="flex items-center justify-between h-[60px] p-4 bg-sidebar">
          <h2 className="text-lg font-bold">Engage</h2>
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
