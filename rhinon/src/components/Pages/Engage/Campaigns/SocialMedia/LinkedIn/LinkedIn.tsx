"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, Plus, LinkedinIcon, Sparkles } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAllLinkedInCampaigns, LinkedInCampaign } from "@/services/campaigns/linkedinCampaignService";
import { getLinkedInStatus } from "@/services/settings/linkedinServices";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash, Copy } from "lucide-react";
import Loader from "@/components/Common/Loader/Loader";
import { format } from "date-fns";

export default function LinkedInCampaigns() {
  const { toggleAutomateSidebar } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const [campaigns, setCampaigns] = useState<LinkedInCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkLinkedInConnection();
    fetchCampaigns();
  }, []);

  const checkLinkedInConnection = async () => {
    try {
      const response = await getLinkedInStatus();
      setIsLinkedInConnected(response.connected);
    } catch (error) {
      console.error("Error checking LinkedIn connection:", error);
      setIsLinkedInConnected(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await getAllLinkedInCampaigns({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (response.success) {
        setCampaigns(response.data);
        setPagination({
          ...pagination,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    if (!isLinkedInConnected) {
      toast.error("Please connect your LinkedIn account first");
      router.push(`/${role}/settings/accounts`);
      return;
    }
    router.push(`/${role}/engage/campaigns/social-media/linkedin/create`);
  };

  const handleView = (campaignId: number) => {
    router.push(`/${role}/engage/campaigns/social-media/linkedin/view/${campaignId}`);
  };

  const handleEdit = (campaignId: number) => {
    router.push(`/${role}/engage/campaigns/social-media/linkedin/edit/${campaignId}`);
  };

  const handleDeleteClick = (campaignId: number) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    try {
      setIsDeleting(true);
      const { deleteLinkedInCampaign } = await import("@/services/campaigns/linkedinCampaignService");
      const response = await deleteLinkedInCampaign(campaignToDelete);
      
      if (response.success) {
        toast.success("Campaign deleted successfully");
        fetchCampaigns(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleDuplicate = async (campaignId: number) => {
    try {
      const { duplicateLinkedInCampaign } = await import("@/services/campaigns/linkedinCampaignService");
      const response = await duplicateLinkedInCampaign(campaignId);
      
      if (response.success) {
        toast.success("Campaign duplicated successfully");
        fetchCampaigns(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error duplicating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to duplicate campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "cancelled":
        return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return "📄";
      case "video":
        return "🎥";
      case "carousel":
        return "🖼️";
      case "poll":
        return "📊";
      default:
        return "📝";
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleAutomateSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">LinkedIn Campaigns</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push(`/${role}/engage/campaigns/social-media/linkedin/ai-create`)} 
              size="sm"
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Campaign
            </Button>
            <Button onClick={handleCreateCampaign} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Manual
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6">
            {/* LinkedIn Connection Banner */}
            {!isLinkedInConnected && (
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">Connect LinkedIn Account</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your LinkedIn account to start publishing campaigns
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push(`/${role}/settings/accounts`)}
                      variant="default"
                    >
                      <LinkedinIcon className="h-4 w-4 mr-2" />
                      Connect LinkedIn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Banner */}
            <div className="flex w-full rounded-lg overflow-hidden bg-gradient-to-r from-transparent to-secondary">
              <div className="flex-1 flex flex-col gap-3 justify-center items-start p-6">
                <p className="font-semibold text-2xl">
                  Grow your professional network
                </p>
                <p className="text-base text-muted-foreground">
                  Create engaging LinkedIn campaigns to reach your target audience
                  and boost your brand visibility.
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center p-6">
                <LinkedinIcon className="h-32 w-32 text-[#0A66C2]" />
              </div>
            </div>

            {/* Campaigns List */}
            {isLoading ? (
              <Loader />
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <LinkedinIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No campaigns yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get started by creating your first LinkedIn campaign
                    </p>
                    <Button onClick={handleCreateCampaign}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Campaigns</CardTitle>
                  <CardDescription>
                    Manage your LinkedIn campaigns and track their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 line-clamp-1">Campaign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {campaign.campaign_name}
                              </p>
                              {/* <p className="text-sm text-muted-foreground line-clamp-1">
                                {campaign.campaign_description}
                              </p> */}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              {getTypeIcon(campaign.campaign_type)}
                              <span className="capitalize">
                                {campaign.campaign_type}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(campaign.status)}
                            >
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {campaign.scheduled_time ? (
                              <span className="text-sm">
                                {format(
                                  new Date(campaign.scheduled_time),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Not scheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {campaign.engagement_metrics ? (
                              <div className="text-sm">
                                <span className="text-muted-foreground">
                                  👍 {campaign.engagement_metrics.likes || 0} · 💬{" "}
                                  {campaign.engagement_metrics.comments || 0}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No data
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(campaign.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(campaign.id)}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
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
              onClick={handleDeleteConfirm}
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