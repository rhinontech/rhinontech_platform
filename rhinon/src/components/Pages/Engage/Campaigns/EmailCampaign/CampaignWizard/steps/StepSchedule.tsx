"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StepScheduleProps {
    data: any;
    updateData: (data: any) => void;
}

export const StepSchedule = ({ data, updateData }: StepScheduleProps) => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Review & Schedule</h2>
                <p className="text-muted-foreground">
                    When do you want to send this campaign?
                </p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold text-foreground">Campaign:</span>
                            <p className="text-muted-foreground">{data.name || "Untitled"}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">Subject:</span>
                            <p className="text-muted-foreground">{data.subject || "No subject"}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">Audience:</span>
                            <p className="text-muted-foreground">
                                {data.audienceType === "all" ? "All Subscribers" : "Segment"}
                            </p>
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">From:</span>
                            <p className="text-muted-foreground">
                                {data.fromName} &lt;{data.fromEmail}&gt;
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <RadioGroup
                value={data.scheduleType || "now"}
                onValueChange={(val) => updateData({ ...data, scheduleType: val })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div>
                    <RadioGroupItem value="now" id="now" className="peer sr-only" />
                    <Label
                        htmlFor="now"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Send className="mb-3 h-6 w-6" />
                        <div className="text-center">
                            <div className="font-semibold">Send Now</div>
                            <div className="text-sm text-muted-foreground">Start sending immediately</div>
                        </div>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem value="later" id="later" className="peer sr-only" />
                    <Label
                        htmlFor="later"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <CalendarClock className="mb-3 h-6 w-6" />
                        <div className="text-center">
                            <div className="font-semibold">Schedule</div>
                            <div className="text-sm text-muted-foreground">Pick a date and time</div>
                        </div>
                    </Label>
                </div>
            </RadioGroup>

            {data.scheduleType === "later" && (
                <div className="p-4 border rounded-md bg-muted/30 text-center text-muted-foreground text-sm">
                    Date and time picker would go here...
                </div>
            )}
        </div>
    );
};
