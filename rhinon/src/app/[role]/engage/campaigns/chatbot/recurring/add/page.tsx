"use client";

import { Suspense } from "react";
import ChatbotBuilder from "@/components/Pages/Engage/Campaigns/Chatbot/Common/Editor/ChatbotBuilder";

function AddPageContent() {
    return <ChatbotBuilder campaignType="recurring" mode="create" />;
}

export default function AddPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddPageContent />
        </Suspense>
    );
}
