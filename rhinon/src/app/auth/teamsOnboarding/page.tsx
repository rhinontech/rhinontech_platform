"use client";

import { TeamsOnboarding } from "@/components/Common/Auth/TeamsOnboarding/TeamsOnboarding";


export default function TeamsOnboardingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <TeamsOnboarding />
      </div>
    </div>
  );
}
