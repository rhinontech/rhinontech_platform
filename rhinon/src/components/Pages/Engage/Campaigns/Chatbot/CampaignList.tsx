"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Edit, Trash2, BarChart2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { chatbotCampaignsService, ChatbotCampaign } from "@/services/engage/campaigns/chatbot/chatbotCampaignsService";

interface CampaignListProps {
    campaignType: "recurring" | "one-time";
    search: string;
    filter: string;
}

export const CampaignList = ({ campaignType, search, filter }: CampaignListProps) => {
    const params = useParams();
    const role = params.role as string;
    const [campaigns, setCampaigns] = useState<ChatbotCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = campaignType === "recurring"
                    ? await chatbotCampaignsService.getRecurringCampaigns()
                    : await chatbotCampaignsService.getOneTimeCampaigns();
                setCampaigns(data);
            } catch (err) {
                console.error("Error fetching campaigns:", err);
                setError("Failed to load campaigns. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
    }, [campaignType]);

    const openDeleteDialog = (campaignId: string, campaignName: string) => {
        setCampaignToDelete({ id: campaignId, name: campaignName });
        setDeleteDialogOpen(true);
    };

    const handleDeleteCampaign = async () => {
        if (!campaignToDelete) return;

        const originalCampaigns = [...campaigns];
        setCampaigns(campaigns.filter(c => c.id !== campaignToDelete.id));
        setDeleteDialogOpen(false);

        try {
            await chatbotCampaignsService.deleteCampaign(campaignToDelete.id);
        } catch (error) {
            console.error("Error deleting campaign:", error);
            setCampaigns(originalCampaigns);
            alert("Failed to delete campaign. Please try again.");
        } finally {
            setCampaignToDelete(null);
        }
    };

    const handleStatusToggle = async (campaignId: string, currentStatus: string) => {
        // Toggle logic: 
        // - If active → draft (turn off)
        // - If draft or paused → active (turn on)
        let newStatus: "active" | "draft" | "paused";

        if (currentStatus === "active") {
            newStatus = "draft";  // Turn off
        } else {
            newStatus = "active";  // Turn on
        }

        // Optimistic update
        setCampaigns(campaigns.map(c =>
            c.id === campaignId ? { ...c, status: newStatus } : c
        ));

        try {
            await chatbotCampaignsService.updateCampaignStatus(campaignId, newStatus);
        } catch (error) {
            console.error("Error updating campaign status:", error);
            // Revert on error
            setCampaigns(campaigns.map(c =>
                c.id === campaignId ? { ...c, status: currentStatus as "active" | "draft" | "paused" } : c
            ));
            alert("Failed to update campaign status. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading campaigns...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No campaigns found. Create your first campaign to get started!</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Name</span>
                    <span>↑</span>
                </div>

                <div className="space-y-2">
                    {campaigns.filter((campaign) => (campaign.name || campaign.content.heading).toLowerCase().includes(search.toLowerCase()))
                        .filter((campaign) => {
                            if (filter === 'all') return true
                            return filter === campaign.status

                        })
                        .map((campaign) => (
                            <div
                                key={campaign.id}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                        <span className="text-lg">💬</span>
                                    </div>
                                    <div className="flex-1">
                                        <Link
                                            href={`/${role}/engage/campaigns/chatbot/${campaignType}/edit/${campaign.id}`}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {campaign.content.heading || "Untitled Campaign"}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={campaign.status === "active"}
                                            onCheckedChange={() => handleStatusToggle(campaign.id!, campaign.status)}
                                        />
                                        <Badge
                                            variant={
                                                campaign.status === "active"
                                                    ? "default"
                                                    : campaign.status === "paused"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                            className="capitalize"
                                        >
                                            {campaign.status}
                                        </Badge>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/${role}/engage/campaigns/chatbot/${campaignType}/edit/${campaign.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <BarChart2 className="mr-2 h-4 w-4" /> View Reports
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {campaign.status === "active" ? (
                                                <DropdownMenuItem onClick={() => handleStatusToggle(campaign.id!, campaign.status)}>
                                                    <Pause className="mr-2 h-4 w-4" /> Pause
                                                </DropdownMenuItem>
                                            ) : campaign.status === "paused" ? (
                                                <DropdownMenuItem onClick={() => handleStatusToggle(campaign.id!, campaign.status)}>
                                                    <Play className="mr-2 h-4 w-4" /> Resume
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleStatusToggle(campaign.id!, campaign.status)}>
                                                    <Play className="mr-2 h-4 w-4" /> Activate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => openDeleteDialog(campaign.id!, campaign.content.heading)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCampaign}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
