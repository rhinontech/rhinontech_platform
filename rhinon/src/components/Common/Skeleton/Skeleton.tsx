import React from "react";

export  function ChatSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-background/40 "
          >
            {/* circular avatar placeholder */}
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 animate-pulse" />

            {/* text lines */}
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="mt-3 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RightSidebarSkeleton() {
  return (
    <div className="w-full space-y-10">
      {/* Section 1 */}
      <div className="space-y-4 w-full">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="space-y-3 ml-6 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse w-full">
              <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-4 w-full">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="space-y-3 ml-6 w-full">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 w-full">
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 */}
      <div className="space-y-4 w-full">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="space-y-3 ml-6 w-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 w-full">
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

