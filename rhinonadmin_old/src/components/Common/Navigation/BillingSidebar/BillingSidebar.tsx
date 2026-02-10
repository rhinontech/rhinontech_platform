"use client";
import { useSidebar } from "@/context/SidebarContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export default function BillingSidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathName = usePathname();
  const { isBillingOpen } = useSidebar();

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden bg-sidebar transition-[height] ease-in-out h-[calc(100vh-4.5rem)]"
      )}
    >
      <div
        className={cn("flex flex-col transition-all duration-300 ease-in-out", {
          "w-56": isBillingOpen,
          "w-0": !isBillingOpen,
        })}
      >
        <div className="flex items-center justify-between h-[60px] p-4 bg-sidebar">
          <h2 className="text-lg font-semibold">Billing</h2>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="space-y-1 p-2">
            <p
              className={`flex text-sm cursor-pointer items-center gap-3 rounded-lg p-2 px-3 transition-colors hover:bg-accent ${
                pathName.includes("subscription") && "bg-accent"
              }`}
              onClick={() => router.push("subscription")}
            >
              Subscription
            </p>
          </div>
        </ScrollArea>
      </div>

      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg border bg-background transition-[height] duration-2000 ease-in-out h-[calc(100vh-4.5rem)]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
