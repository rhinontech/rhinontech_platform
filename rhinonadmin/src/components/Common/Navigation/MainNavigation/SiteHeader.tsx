
"use client";

import { UserNav } from "./UserNav";
import { useUserStore } from "@/utils/store";
import { ThemeModeToggle } from "@/components/Common/providers/ThemeModeToggle";
import { Env, EnvSwitcher } from "./EnvSwitcher";

export function SiteHeader() {
  // const { toggleSidebar } = useSidebar();

  const roles = useUserStore((state) => state.userData.assignedRoles);

  const envs: Env[] = [
    {
      name: "Beta",
      DB_HOST: process.env.NEXT_PUBLIC_BETA_DB_HOST || "",
      DB_PORT: process.env.NEXT_PUBLIC_BETA_DB_PORT || "5432",
      DB_NAME: process.env.NEXT_PUBLIC_BETA_DB_NAME || "",
    },
    {
      name: "Production",
      DB_HOST: process.env.NEXT_PUBLIC_PROD_DB_HOST || "",
      DB_PORT: process.env.NEXT_PUBLIC_PROD_DB_PORT || "5432",
      DB_NAME: process.env.NEXT_PUBLIC_PROD_DB_NAME || "",
    },
  ];

  return (
    <header className="bg-sidebar sticky top-0 z-50 flex w-full items-center">
      <div className="flex h-(--header-height) w-full justify-between items-center gap-2 px-2">
        <EnvSwitcher envs={envs} />
        <div className="flex items-center gap-2">
          <ThemeModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
