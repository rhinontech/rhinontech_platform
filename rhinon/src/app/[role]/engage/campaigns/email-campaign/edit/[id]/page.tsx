"use client";

import { CampaignWizard } from "@/components/Pages/Engage/Campaigns/EmailCampaign/CampaignWizard/CampaignWizard";
import { useParams } from "next/navigation";

export default function EditCampaignPage() {
    const params = useParams();
    // In a real app, we would fetch the campaign data using params.id

    return <CampaignWizard />;
}
