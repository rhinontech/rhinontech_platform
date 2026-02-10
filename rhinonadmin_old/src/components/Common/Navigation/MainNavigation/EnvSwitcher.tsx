"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface Env {
  name: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
}

interface EnvSwitcherProps {
  envs: Env[];
}

export function EnvSwitcher({ envs }: EnvSwitcherProps) {
  const { isMobile } = useSidebar();
  const [activeEnv, setActiveEnv] = React.useState<Env>(envs[0]);

  React.useEffect(() => {
    const savedEnvName = Cookies.get("NEXT_ADMIN_ENV");
    if (savedEnvName) {
      const foundEnv = envs.find((e) => e.name === savedEnvName);
      if (foundEnv) {
        setActiveEnv(foundEnv);
      }
    }
  }, [envs]);

  const handleEnvChange = (env: Env) => {
    Cookies.set("NEXT_ADMIN_ENV", env.name);
    setActiveEnv(env);
    window.location.reload();
  };

  return (
    <SidebarMenu className="w-fit">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground px-2 gap-2"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <div className="flex aspect-square size-6 items-center justify-center rounded-sm border font-bold">
                  {activeEnv.name.charAt(0)}
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Rhinon Tech</span>
                <span className="truncate text-xs">{activeEnv.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Environments
            </DropdownMenuLabel>
            {envs.map((env, index) => (
              <DropdownMenuItem
                key={env.name}
                onClick={() => handleEnvChange(env)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {env.name.charAt(0)}
                </div>
                {env.name}
                {activeEnv.name === env.name && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
