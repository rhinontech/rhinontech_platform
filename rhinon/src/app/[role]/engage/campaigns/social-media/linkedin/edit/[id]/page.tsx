"use client";

import LinkedInCampaignForm from "@/components/Pages/Engage/Campaigns/SocialMedia/LinkedIn/LinkedInCampaignForm";
import { useParams } from "next/navigation";

export default function EditLinkedInCampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return <LinkedInCampaignForm campaignId={parseInt(campaignId)} />;
}
