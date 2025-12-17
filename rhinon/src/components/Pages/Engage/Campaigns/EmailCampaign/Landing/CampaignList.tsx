"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data
const campaigns = [
    {
        id: "1",
        name: "Weekly Newsletter",
        status: "active",
        type: "Newsletter",
        sent: 12500,
        opens: "45%",
        clicks: "12%",
        conversions: "3.6%",
        lastActive: "Just now",
    },
    {
        id: "2",
        name: "Black Friday Sale",
        status: "paused",
        type: "Promotional",
        sent: 5400,
        opens: "38%",
        clicks: "15%",
        conversions: "2.2%",
        lastActive: "2 days ago",
    },
    {
        id: "3",
        name: "Welcome Series",
        status: "active",
        type: "Transactional",
        sent: 8900,
        opens: "62%",
        clicks: "28%",
        conversions: "4.1%",
        lastActive: "1 hour ago",
    },
    {
        id: "4",
        name: "Product Update",
        status: "draft",
        type: "Newsletter",
        sent: 0,
        opens: "0%",
        clicks: "0%",
        conversions: "0%",
        lastActive: "Never",
    },
];

export const CampaignList = () => {
    const params = useParams();
    const role = params.role as string;

    return (
        <div className="rounded-md border mt-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Campaign Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Opens</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Conv. Rate</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{campaign.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {campaign.type} • Last active: {campaign.lastActive}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Switch checked={campaign.status === "active"} />
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
                            </TableCell>
                            <TableCell>{campaign.type}</TableCell>
                            <TableCell className="text-right">{campaign.sent.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{campaign.opens}</TableCell>
                            <TableCell className="text-right">{campaign.clicks}</TableCell>
                            <TableCell className="text-right">{campaign.conversions}</TableCell>
                            <TableCell>
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
                                            <Link href={`/${role}/engage/campaigns/email-campaign/edit/${campaign.id}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <BarChart2 className="mr-2 h-4 w-4" /> View Reports
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {campaign.status === "active" ? (
                                            <DropdownMenuItem>
                                                <Pause className="mr-2 h-4 w-4" /> Pause
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem>
                                                <Play className="mr-2 h-4 w-4" /> Resume
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
