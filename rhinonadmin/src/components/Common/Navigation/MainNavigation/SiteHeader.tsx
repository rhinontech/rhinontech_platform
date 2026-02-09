"use client";

import {
  AudioWaveform,
  CircleDollarSign,
  Command,
  GalleryVerticalEnd,
} from "lucide-react";
import { UserNav } from "./UserNav";
import { TeamSwitcher } from "./TeamSwitcher";
import { useUserStore } from "@/utils/store";
import { ThemeModeToggle } from "@/components/Common/providers/ThemeModeToggle";

export function SiteHeader() {
  // const { toggleSidebar } = useSidebar();

  const roles = useUserStore((state) => state.userData.assignedRoles);

  const dynamicTeams = roles.map((role: string) => {
    return {
      name: "RhinonTech",
      logo: GalleryVerticalEnd,
      role: role,
    };
  });

  // const data = {
  //   teams: [
  //     {
  //       name: "Rhinon Tech",
  //       logo: GalleryVerticalEnd,
  //       href: "Superadmin",
  //       role: "Super Admin",
  //     },
  //     {
  //       name: "Rhinon Tech",
  //       logo: AudioWaveform,
  //       href: "Admin",
  //       role: "Admin",
  //     },
  //     {
  //       name: "Rhinon Tech",
  //       logo: Command,
  //       href: "Support",
  //       role: "Customer Support",
  //     },
  //     {
  //       name: "Rhinon Tech",
  //       logo: CircleDollarSign,
  //       href: "Sales",
  //       role: "Sales Manager",
  //     },
  //   ],
  // };

  return (
    <header className="bg-sidebar sticky top-0 z-50 flex w-full items-center">
      <div className="flex h-(--header-height) w-full justify-between items-center gap-2 px-2">
        <TeamSwitcher teams={dynamicTeams} />
        <div className="flex items-center gap-2">
          <ThemeModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
