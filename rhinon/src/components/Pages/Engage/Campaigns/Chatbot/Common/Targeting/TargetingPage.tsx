"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Info, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatbotPreviewCard } from "../Editor/ChatbotPreviewCard";
import { useCampaignStore } from "../store/useCampaignStore";
import { chatbotCampaignsService } from "@/services/engage/campaigns/chatbot/chatbotCampaignsService";
import { useSearchParams } from "next/navigation";

interface TargetingPageProps {
    campaignType: "recurring" | "one-time";
    mode: "create" | "edit";
}

interface Condition {
    field: string;
    operator: string;
    value: string;
}

export const TargetingPage = ({ campaignType, mode }: TargetingPageProps) => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const role = params.role as string;
    const campaignId = searchParams.get("campaignId");
    const { heading, subheading, media, buttons, hasImage, layout } = useCampaignStore();

    // Load existing campaign targeting data in edit mode
    useEffect(() => {
        const loadCampaignTargeting = async () => {
            if (mode === "edit") {
                if (campaignId) {
                    try {
                        const campaign = await chatbotCampaignsService.getCampaignById(campaignId);

                        // Load targeting data
                        if (campaign.targeting) {
                            setVisitorType(campaign.targeting.visitorType || "all");

                            if (campaign.targeting.trigger) {
                                setTriggerValue(campaign.targeting.trigger.value?.toString() || "");
                                setTriggerUnit(campaign.targeting.trigger.unit || "seconds");
                            }

                            if (campaign.targeting.rules) {
                                setMatchType(campaign.targeting.rules.matchType || "match-all");

                                if (campaign.targeting.rules.conditions && campaign.targeting.rules.conditions.length > 0) {
                                    setConditions(campaign.targeting.rules.conditions.map(c => ({
                                        field: c.field || "current-page-url",
                                        operator: c.operator || "contains",
                                        value: c.value || ""
                                    })));
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error loading campaign targeting:", error);
                    }
                }
            }
        };

        loadCampaignTargeting();
    }, [mode, campaignId]);

    const [visitorType, setVisitorType] = useState<"all" | "first-time" | "returning">("all");
    const [triggerValue, setTriggerValue] = useState("13");
    const [triggerUnit, setTriggerUnit] = useState("seconds");
    const [matchType, setMatchType] = useState("match-all");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [conditions, setConditions] = useState<Condition[]>([
        { field: "current-page-url", operator: "contains", value: "" }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddCondition = () => {
        setConditions([...conditions, { field: "current-page-url", operator: "contains", value: "" }]);
    };

    const handleRemoveCondition = (index: number) => {
        if (conditions.length > 1) {
            setConditions(conditions.filter((_, i) => i !== index));
        }
    };

    const handleUpdateCondition = (index: number, field: keyof Condition, value: string) => {
        const newConditions = [...conditions];
        newConditions[index][field] = value;
        setConditions(newConditions);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const campaignData = {
                type: campaignType,
                status: "draft" as const,
                content: {
                    templateId: useCampaignStore.getState().templateId || "",
                    layout,
                    heading,
                    subheading,
                    hasImage,
                    media,
                    buttons: buttons.map(btn => ({
                        id: btn.id,
                        text: btn.text,
                        url: btn.url,
                        style: btn.style,
                        actionType: btn.actionType || "open-url"
                    }))
                },
                targeting: {
                    visitorType,
                    trigger: {
                        type: "time-on-page" as const,
                        value: parseInt(triggerValue) || 0,
                        unit: triggerUnit as "seconds" | "minutes"
                    },
                    rules: {
                        matchType: matchType as "match-all" | "match-any",
                        conditions
                    }
                }
            };

            if (mode === "create") {
                await chatbotCampaignsService.createCampaign(campaignData);
            } else {
                if (!campaignId) {
                    throw new Error("Campaign ID is required for update");
                }
                await chatbotCampaignsService.updateCampaign(campaignId, campaignData);
            }

            // Reset store after successful save
            useCampaignStore.getState().reset();

            router.push(`/${role}/engage/campaigns/chatbot/${campaignType}`);
        } catch (error) {
            console.error("Error saving campaign:", error);
            alert("Failed to save campaign. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <div className="flex flex-1 flex-col w-full">
                {/* Header */}
                <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <X className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-foreground">Exit Intent Campaign</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            Previous
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Content - Split Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Settings */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-2xl space-y-8">
                            {/* Who will receive this campaign */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Who will receive this campaign</h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant={visitorType === "all" ? "default" : "outline"}
                                        onClick={() => setVisitorType("all")}
                                        className="rounded-full"
                                    >
                                        All visitors
                                    </Button>
                                    <Button
                                        variant={visitorType === "first-time" ? "default" : "outline"}
                                        onClick={() => setVisitorType("first-time")}
                                        className="rounded-full"
                                    >
                                        First time visitors
                                    </Button>
                                    <Button
                                        variant={visitorType === "returning" ? "default" : "outline"}
                                        onClick={() => setVisitorType("returning")}
                                        className="rounded-full"
                                    >
                                        Returning visitors
                                    </Button>
                                </div>
                            </div>

                            {/* When to display this campaign */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">When to display this campaign</h2>

                                <div className="space-y-4">
                                    {/* Time on page */}
                                    <div className="flex items-center gap-3">
                                        <Label className="text-sm whitespace-nowrap">Time on page is more than:</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={triggerValue}
                                                onChange={(e) => setTriggerValue(e.target.value)}
                                                className="w-24"
                                            />
                                            <Select value={triggerUnit} onValueChange={setTriggerUnit}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="seconds">seconds</SelectItem>
                                                    <SelectItem value="minutes">minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>

                                    {/* Match conditions */}
                                    <div className="space-y-3">
                                        <Select value={matchType} onValueChange={setMatchType}>
                                            <SelectTrigger className="w-64">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="match-all">Match all of these conditions</SelectItem>
                                                <SelectItem value="match-any">Match any of these conditions</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Conditions */}
                                        <div className="space-y-2">
                                            {conditions.map((condition, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Select
                                                        value={condition.field}
                                                        onValueChange={(value) => handleUpdateCondition(index, "field", value)}
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="current-page-url">Current page URL</SelectItem>
                                                            <SelectItem value="referrer-url">Referrer URL</SelectItem>
                                                            <SelectItem value="device-type">Device type</SelectItem>
                                                            <SelectItem value="customer-activity">Customer&apos;s activity</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={condition.operator}
                                                        onValueChange={(value) => handleUpdateCondition(index, "operator", value)}
                                                    >
                                                        <SelectTrigger className="w-36">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="contains">contains</SelectItem>
                                                            <SelectItem value="equals">equals</SelectItem>
                                                            <SelectItem value="starts-with">starts with</SelectItem>
                                                            <SelectItem value="ends-with">ends with</SelectItem>
                                                            <SelectItem value="is">is</SelectItem>
                                                            <SelectItem value="about-to-leave-page">about to leave page</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Input
                                                        placeholder="Enter a string"
                                                        className="flex-1"
                                                        value={condition.value}
                                                        onChange={(e) => handleUpdateCondition(index, "value", e.target.value)}
                                                    />

                                                    {conditions.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveCondition(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            variant="link"
                                            className="text-blue-600 px-0"
                                            onClick={handleAddCondition}
                                        >
                                            + Add condition
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="w-[480px] border-l border-border bg-gray-50 dark:bg-gray-900/20 p-6 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Preview</h3>

                            {/* Desktop/Mobile Tabs */}
                            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "desktop" | "mobile")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="desktop">Desktop</TabsTrigger>
                                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Preview Area */}
                            <div className="relative">
                                {previewMode === "desktop" ? (
                                    <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "9/13" }}>
                                        <div className="relative h-full flex items-center justify-center p-4">
                                            {/* Desktop Preview */}
                                            <div className="absolute bottom-18 right-4">
                                                <ChatbotPreviewCard
                                                    heading={heading}
                                                    subheading={subheading}
                                                    media={media}
                                                    buttons={buttons}
                                                    hasImage={hasImage}
                                                    layout={layout}
                                                />
                                            </div>

                                            {/* Chatbot Icon */}
                                            <div className="absolute bottom-4 right-4">
                                                <div className="w-[50px] h-[50px] bg-blue-900 shadow-xl flex items-center justify-center" style={{ borderRadius: "10% 35% 25% 35%" }}>
                                                    <img
                                                        src="https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png"
                                                        alt="Chatbot"
                                                        className="p-2 object-contain"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden" style={{ aspectRatio: "9/12" }}>
                                        <div className="relative h-full flex items-center justify-center p-4">
                                            {/* Mobile Preview */}
                                            <div className="absolute bottom-4 right-18">
                                                <ChatbotPreviewCard
                                                    heading={heading}
                                                    subheading={subheading}
                                                    media={media}
                                                    buttons={buttons}
                                                    hasImage={hasImage}
                                                    layout={layout}
                                                />
                                            </div>

                                            {/* Chatbot Icon */}
                                            <div className="absolute bottom-4 right-4">
                                                <div className="w-[50px] h-[50px] bg-blue-900 shadow-xl flex items-center justify-center" style={{ borderRadius: "10% 35% 25% 35%" }}>
                                                    <img
                                                        src="https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png"
                                                        alt="Chatbot"
                                                        className="p-2 object-contain"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
