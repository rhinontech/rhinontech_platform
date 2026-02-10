"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

const Seo = () => {
  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full overflow-hidden rounded-lg border-2 bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">SEO Analytics</h2>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-0">
          Hey there! SEO Analytics coming soon...
        </ScrollArea>
      </div>
    </div>
  );
};

export default Seo;
