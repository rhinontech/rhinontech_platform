"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const CampaignFilters = () => {
    const params = useParams();
    const role = params.role as string;

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search campaigns..."
                        className="pl-8"
                    />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Link href={`/${role}/engage/campaigns/email-campaign/create`}>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                </Button>
            </Link>
        </div>
    );
};
