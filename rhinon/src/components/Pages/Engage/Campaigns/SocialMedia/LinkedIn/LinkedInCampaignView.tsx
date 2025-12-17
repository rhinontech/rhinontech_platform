"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Edit, Trash, Copy, Send, Calendar } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  getLinkedInCampaignById,
  publishLinkedInCampaign,
  deleteLinkedInCampaign,
  duplicateLinkedInCampaign,
  scheduleLinkedInCampaign,
  LinkedInCampaign,
} from "@/services/campaigns/linkedinCampaignService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Common/Loader/Loader";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface LinkedInCampaignViewProps {
  campaignId: number;
}

export default function LinkedInCampaignView({
  campaignId,
}: LinkedInCampaignViewProps) {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const [campaign, setCampaign] = useState<LinkedInCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await getLinkedInCampaignById(campaignId);
      if (response.success) {
        setCampaign(response.data);
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Failed to load campaign");
      router.push(`/${role}/engage/campaigns/social-media/linkedin`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/${role}/engage/campaigns/social-media/linkedin/edit/${campaignId}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteLinkedInCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign deleted successfully");
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await duplicateLinkedInCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign duplicated successfully");
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error: any) {
      console.error("Error duplicating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to duplicate campaign");
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await publishLinkedInCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign published successfully to LinkedIn!");
        setPublishDialogOpen(false);
        loadCampaign(); // Refresh campaign data
      }
    } catch (error: any) {
      console.error("Error publishing campaign:", error);
      toast.error(error.response?.data?.message || "Failed to publish campaign");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleTime) {
      toast.error("Please select a schedule time");
      return;
    }

    try {
      setIsPublishing(true);
      const response = await scheduleLinkedInCampaign(campaignId, scheduleTime);
      if (response.success) {
        toast.success("Campaign scheduled successfully!");
        setScheduleDialogOpen(false);
        loadCampaign(); // Refresh campaign data
      }
    } catch (error: any) {
      console.error("Error scheduling campaign:", error);
      toast.error(error.response?.data?.message || "Failed to schedule campaign");
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "cancelled":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "";
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  const canPublish = campaign.status === "draft" || campaign.status === "failed";

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Campaign Details</h2>
            <Badge variant="outline" className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {canPublish && (
              <>
                <Button
                  onClick={() => setScheduleDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button onClick={() => setPublishDialogOpen(true)} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>{campaign.campaign_name}</CardTitle>
                {campaign.campaign_description && (
                  <CardDescription>{campaign.campaign_description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm capitalize">{campaign.campaign_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.scheduled_time && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Scheduled For
                      </p>
                      <p className="text-sm">
                        {format(new Date(campaign.scheduled_time), "PPpp")}
                      </p>
                    </div>
                  )}
                  {campaign.published_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Published At
                      </p>
                      <p className="text-sm">
                        {format(new Date(campaign.published_at), "PPpp")}
                      </p>
                    </div>
                  )}
                  {campaign.is_sponsored && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Sponsored
                        </p>
                        <p className="text-sm">Yes</p>
                      </div>
                      {campaign.budget && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Budget
                          </p>
                          <p className="text-sm">${campaign.budget}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="whitespace-pre-wrap text-sm">{campaign.content}</div>
                  
                  {campaign.hashtags && campaign.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {campaign.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {campaign.media_urls && campaign.media_urls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Media</p>
                      <div className="space-y-2">
                        {campaign.media_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline block"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            {(campaign.call_to_action || campaign.cta_link) && (
              <Card>
                <CardHeader>
                  <CardTitle>Call to Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaign.call_to_action && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Button Text
                      </p>
                      <p className="text-sm">{campaign.call_to_action}</p>
                    </div>
                  )}
                  {campaign.cta_link && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Link</p>
                      <a
                        href={campaign.cta_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        {campaign.cta_link}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Engagement Metrics */}
            {campaign.engagement_metrics && campaign.status === "published" && (
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Likes</p>
                      <p className="text-2xl font-bold">
                        {campaign.engagement_metrics.likes || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Comments
                      </p>
                      <p className="text-2xl font-bold">
                        {campaign.engagement_metrics.comments || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Shares</p>
                      <p className="text-2xl font-bold">
                        {campaign.engagement_metrics.shares || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Views</p>
                      <p className="text-2xl font-bold">
                        {campaign.engagement_metrics.views || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this campaign to LinkedIn now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when you want this campaign to be published on LinkedIn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule_time">Schedule Date & Time</Label>
              <Input
                id="schedule_time"
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isPublishing}>
              {isPublishing ? "Scheduling..." : "Schedule Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
