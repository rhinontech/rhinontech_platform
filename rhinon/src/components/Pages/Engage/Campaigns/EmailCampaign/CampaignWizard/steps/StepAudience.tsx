"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Filter } from "lucide-react";

interface StepAudienceProps {
    data: any;
    updateData: (data: any) => void;
}

export const StepAudience = ({ data, updateData }: StepAudienceProps) => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Select Audience</h2>
                <p className="text-muted-foreground">
                    Who should receive this campaign?
                </p>
            </div>

            <RadioGroup
                value={data.audienceType || "all"}
                onValueChange={(val) => updateData({ ...data, audienceType: val })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div>
                    <RadioGroupItem value="all" id="all" className="peer sr-only" />
                    <Label
                        htmlFor="all"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Users className="mb-3 h-6 w-6" />
                        <div className="text-center">
                            <div className="font-semibold">All Subscribers</div>
                            <div className="text-sm text-muted-foreground">Send to everyone in your list</div>
                        </div>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem value="segment" id="segment" className="peer sr-only" />
                    <Label
                        htmlFor="segment"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Filter className="mb-3 h-6 w-6" />
                        <div className="text-center">
                            <div className="font-semibold">Segment</div>
                            <div className="text-sm text-muted-foreground">Send to a specific group</div>
                        </div>
                    </Label>
                </div>
            </RadioGroup>

            {data.audienceType === "segment" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Segment</CardTitle>
                        <CardDescription>Choose a segment to target.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Segment selection dropdown would go here...
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
