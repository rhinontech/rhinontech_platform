"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepDetailsProps {
    data: any;
    updateData: (data: any) => void;
}

export const StepDetails = ({ data, updateData }: StepDetailsProps) => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Campaign Details</h2>
                <p className="text-muted-foreground">
                    Start by giving your campaign a name and subject line.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                        id="campaignName"
                        placeholder="e.g. Weekly Newsletter"
                        value={data.name || ""}
                        onChange={(e) => updateData({ ...data, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Internal use only.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                        id="subject"
                        placeholder="e.g. Don't miss out on these deals!"
                        value={data.subject || ""}
                        onChange={(e) => updateData({ ...data, subject: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="previewText">Preview Text</Label>
                    <Textarea
                        id="previewText"
                        placeholder="A short summary that appears next to the subject line..."
                        value={data.previewText || ""}
                        onChange={(e) => updateData({ ...data, previewText: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                        id="fromName"
                        placeholder="e.g. Rhinon Tech"
                        value={data.fromName || ""}
                        onChange={(e) => updateData({ ...data, fromName: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                        id="fromEmail"
                        placeholder="e.g. hello@rhinon.tech"
                        value={data.fromEmail || ""}
                        onChange={(e) => updateData({ ...data, fromEmail: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};
