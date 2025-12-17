"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, ArrowLeft, Send, Calendar, Save } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  createLinkedInCampaign,
  updateLinkedInCampaign,
  getLinkedInCampaignById,
  publishLinkedInCampaign,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loader from "@/components/Common/Loader/Loader";
import { Badge } from "@/components/ui/badge";

interface LinkedInCampaignFormProps {
  campaignId?: number;
}

export default function LinkedInCampaignForm({
  campaignId,
}: LinkedInCampaignFormProps) {
  const { toggleAutomateSidebar } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_description: "",
    campaign_type: "post" as "post" | "article" | "video" | "carousel" | "poll",
    content: "",
    media_urls: [] as string[],
    hashtags: [] as string[],
    is_sponsored: false,
    budget: "",
    call_to_action: "",
    cta_link: "",
  });

  const [hashtagInput, setHashtagInput] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await getLinkedInCampaignById(campaignId!);
      if (response.success) {
        const campaign = response.data;
        setFormData({
          campaign_name: campaign.campaign_name,
          campaign_description: campaign.campaign_description || "",
          campaign_type: campaign.campaign_type,
          content: campaign.content,
          media_urls: campaign.media_urls || [],
          hashtags: campaign.hashtags || [],
          is_sponsored: campaign.is_sponsored || false,
          budget: campaign.budget?.toString() || "",
          call_to_action: campaign.call_to_action || "",
          cta_link: campaign.cta_link || "",
        });
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
      const tag = hashtagInput.trim().startsWith("#")
        ? hashtagInput.trim()
        : `#${hashtagInput.trim()}`;
      handleInputChange("hashtags", [...formData.hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    handleInputChange(
      "hashtags",
      formData.hashtags.filter((h) => h !== tag)
    );
  };

  const addMediaUrl = () => {
    if (mediaUrlInput.trim() && !formData.media_urls.includes(mediaUrlInput.trim())) {
      handleInputChange("media_urls", [...formData.media_urls, mediaUrlInput.trim()]);
      setMediaUrlInput("");
    }
  };

  const removeMediaUrl = (url: string) => {
    handleInputChange(
      "media_urls",
      formData.media_urls.filter((u) => u !== url)
    );
  };

  const validateForm = () => {
    if (!formData.campaign_name.trim()) {
      toast.error("Campaign name is required");
      return false;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      if (campaignId) {
        const response = await updateLinkedInCampaign(campaignId, payload);
        if (response.success) {
          toast.success("Campaign updated successfully");
          router.push(`/${role}/engage/campaigns/social-media/linkedin`);
        }
      } else {
        const response = await createLinkedInCampaign(payload);
        if (response.success) {
          toast.success("Campaign saved as draft");
          router.push(`/${role}/engage/campaigns/social-media/linkedin`);
        }
      }
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.response?.data?.message || "Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      let campaignIdToPublish = campaignId;

      // If new campaign, create it first
      if (!campaignIdToPublish) {
        const payload = {
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        };
        const createResponse = await createLinkedInCampaign(payload);
        if (!createResponse.success) {
          throw new Error("Failed to create campaign");
        }
        campaignIdToPublish = createResponse.data.id;
      }

      // Publish the campaign
      const response = await publishLinkedInCampaign(campaignIdToPublish!);
      if (response.success) {
        toast.success("Campaign published successfully to LinkedIn!");
        router.push(`/${role}/engage/campaigns/social-media/linkedin`);
      }
    } catch (error: any) {
      console.error("Error publishing campaign:", error);
      toast.error(
        error.response?.data?.message || "Failed to publish campaign"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;
    if (!scheduleTime) {
      toast.error("Please select a schedule time");
      return;
    }

    try {
      setIsSaving(true);
      let campaignIdToSchedule = campaignId;

      // If new campaign, create it first
      if (!campaignIdToSchedule) {
        const payload = {
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          scheduled_time: scheduleTime,
        };
        const createResponse = await createLinkedInCampaign(payload);
        if (!createResponse.success) {
          throw new Error("Failed to create campaign");
        }
        campaignIdToSchedule = createResponse.data.id;
      } else {
        // Schedule existing campaign
        await scheduleLinkedInCampaign(campaignIdToSchedule, scheduleTime);
      }

      toast.success("Campaign scheduled successfully!");
      router.push(`/${role}/engage/campaigns/social-media/linkedin`);
    } catch (error: any) {
      console.error("Error scheduling campaign:", error);
      toast.error(error.response?.data?.message || "Failed to schedule campaign");
    } finally {
      setIsSaving(false);
      setShowScheduleDialog(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">
              {campaignId ? "Edit Campaign" : "Create LinkedIn Campaign"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => setShowScheduleDialog(true)}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={handlePublishNow} size="sm" disabled={isSaving}>
              <Send className="h-4 w-4 mr-2" />
              {isSaving ? "Publishing..." : "Publish Now"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the basic details of your LinkedIn campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">
                    Campaign Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="campaign_name"
                    placeholder="e.g., Product Launch Announcement"
                    value={formData.campaign_name}
                    onChange={(e) =>
                      handleInputChange("campaign_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_description">Description</Label>
                  <Textarea
                    id="campaign_description"
                    placeholder="Describe your campaign objectives and target audience"
                    value={formData.campaign_description}
                    onChange={(e) =>
                      handleInputChange("campaign_description", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) =>
                      handleInputChange("campaign_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="poll">Poll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write the content that will be posted to LinkedIn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">
                    Post Content <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Write your LinkedIn post content here..."
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content.length} characters
                  </p>
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <Label>Hashtags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add hashtag (without #)"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHashtag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addHashtag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.hashtags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeHashtag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Media URLs */}
                <div className="space-y-2">
                  <Label>Media URLs</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add image or video URL"
                      value={mediaUrlInput}
                      onChange={(e) => setMediaUrlInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMediaUrl();
                        }
                      }}
                    />
                    <Button type="button" onClick={addMediaUrl} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {formData.media_urls.map((url) => (
                      <div
                        key={url}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm truncate">{url}</span>
                        <Button
                          type="button"
                          onClick={() => removeMediaUrl(url)}
                          variant="ghost"
                          size="sm"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card>
              <CardHeader>
                <CardTitle>Call to Action (Optional)</CardTitle>
                <CardDescription>
                  Add a call-to-action button to your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="call_to_action">Button Text</Label>
                  <Input
                    id="call_to_action"
                    placeholder="e.g., Learn More, Sign Up, Get Started"
                    value={formData.call_to_action}
                    onChange={(e) =>
                      handleInputChange("call_to_action", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta_link">Button Link</Label>
                  <Input
                    id="cta_link"
                    placeholder="https://example.com"
                    value={formData.cta_link}
                    onChange={(e) =>
                      handleInputChange("cta_link", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sponsored Post */}
            <Card>
              <CardHeader>
                <CardTitle>Sponsored Post (Optional)</CardTitle>
                <CardDescription>
                  Promote your post with a budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sponsored Post</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn this into a paid promotion
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_sponsored}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_sponsored", checked)
                    }
                  />
                </div>

                {formData.is_sponsored && (
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      value={formData.budget}
                      onChange={(e) =>
                        handleInputChange("budget", e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
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
              onClick={() => setShowScheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isSaving}>
              {isSaving ? "Scheduling..." : "Schedule Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
