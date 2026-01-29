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

interface CampaignFiltersProps {
    onAddCampaign: () => void;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    search: string;
    filter: string;
    setFilter: React.Dispatch<React.SetStateAction<string>>;
}

export const CampaignFilters = ({ onAddCampaign, setSearch, search, filter, setFilter }: CampaignFiltersProps) => {
    
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search campaigns..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select defaultValue="all" onValueChange={setFilter}>
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
                {/* <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                </Select> */}
            </div>
            <Button onClick={onAddCampaign}>
                <Plus className="mr-2 h-4 w-4" />
                Add new campaign
            </Button>
        </div>
    );
};
