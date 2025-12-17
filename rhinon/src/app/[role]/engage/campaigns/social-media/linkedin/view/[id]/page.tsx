import LinkedInCampaignView from "@/components/Pages/Engage/Campaigns/SocialMedia/LinkedIn/LinkedInCampaignView";

export default function ViewLinkedInCampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const campaignId = parseInt(params.id);

  return <LinkedInCampaignView campaignId={campaignId} />;
}
