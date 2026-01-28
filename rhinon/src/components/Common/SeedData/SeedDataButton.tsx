"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    getSeedDataStatus,
    addSeedData,
    deleteSeedData,
} from "@/services/seedDataService";
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
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function SeedDataButton() {
    const router = useRouter();
    const [hasSeedData, setHasSeedData] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [actionType, setActionType] = useState<"add" | "delete">("add");

    // Check seed data status on component mount
    useEffect(() => {
        checkSeedDataStatus();
    }, []);

    const checkSeedDataStatus = async () => {
        try {
            setIsCheckingStatus(true);
            const response = await getSeedDataStatus();

            if (response.success) {
                setHasSeedData(response.hasSeedData);
            }
        } catch (error: any) {
            console.error("Error checking seed data status:", error);
            // Silently fail on status check to not disrupt user experience
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleAddSeedData = async () => {
        try {
            setIsLoading(true);
            const response = await addSeedData();

            if (response.success) {
                toast.success("Seed data added successfully!", {
                    description: "Sample data has been created for all features.",
                });
                setHasSeedData(true);
                router.push("/");
            }
        } catch (error: any) {
            console.error("Error adding seed data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to add seed data";
            toast.error("Error", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
            setShowConfirmDialog(false);
        }
    };

    const handleDeleteSeedData = async () => {
        try {
            setIsLoading(true);
            const response = await deleteSeedData();

            if (response.success) {
                toast.success("Seed data deleted successfully!", {
                    description: "All sample data has been removed. Your actual data remains intact.",
                });
                setHasSeedData(false);
                router.push("/");
            }
        } catch (error: any) {
            console.error("Error deleting seed data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to delete seed data";
            toast.error("Error", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
            setShowConfirmDialog(false);
        }
    };

    const handleButtonClick = () => {
        setActionType(hasSeedData ? "delete" : "add");
        setShowConfirmDialog(true);
    };

    const handleConfirm = () => {
        if (actionType === "add") {
            handleAddSeedData();
        } else {
            handleDeleteSeedData();
        }
    };

    if (isCheckingStatus) {
        return null; // Don't show button while checking status
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={hasSeedData ? "destructive" : "outline"}
                            size="icon"
                            onClick={handleButtonClick}
                            disabled={isLoading}
                            className={cn(
                                "relative",
                                hasSeedData && "hover:bg-destructive/90"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : hasSeedData ? (
                                <Trash2 className="h-5 w-5" />
                            ) : (
                                <Database className="h-5 w-5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{hasSeedData ? "Delete Seed Data" : "Add Seed Data"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === "add"
                                ? "Add Seed Data?"
                                : "Delete Seed Data?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === "add"
                                ? "This will populate your workspace with sample data across all features. This helps you explore the platform's capabilities. You can delete it anytime."
                                : "This will delete all seed data from your workspace. Your actual data will not be affected and will remain intact."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={cn(
                                actionType === "delete" && "bg-destructive hover:bg-destructive/90"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : actionType === "add" ? (
                                "Add Seed Data"
                            ) : (
                                "Delete Seed Data"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
