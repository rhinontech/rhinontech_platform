"use client";

import { TargetingPage } from "@/components/Pages/Engage/Campaigns/Chatbot/Common/Targeting/TargetingPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TargetingPageContent() {
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");
    const mode = campaignId ? "edit" : "create";

    return <TargetingPage campaignType="one-time" mode={mode} />;
}

export default function TargetingPageRoute() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TargetingPageContent />
        </Suspense>
    );
}
