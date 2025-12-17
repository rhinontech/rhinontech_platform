"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StepDetails } from "./steps/StepDetails";
import { StepAudience } from "./steps/StepAudience";
import { StepSchedule } from "./steps/StepSchedule";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import EmailBuilder from "../../../../../Common/EmailBuilder/EmailBuilder";

const STEPS = [
    { id: 1, label: "Details" },
    { id: 2, label: "Content" },
    { id: 3, label: "Audience" },
    { id: 4, label: "Schedule" },
];

export const CampaignWizard = () => {
    const router = useRouter();
    const params = useParams();
    const role = params.role as string;

    const [currentStep, setCurrentStep] = useState(1);
    const [campaignData, setCampaignData] = useState({
        name: "",
        subject: "",
        previewText: "",
        fromName: "",
        fromEmail: "",
        audienceType: "all",
        scheduleType: "now",
    });

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Finish / Submit
            console.log("Submitting campaign:", campaignData);
            router.push(`/${role}/engage/campaigns/email-campaign`);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background w-full">
            {/* Wizard Header */}
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <span className="font-semibold text-foreground">
                        {campaignData.name || "New Campaign"}
                    </span>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium border-2 ${currentStep === step.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : currentStep > step.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground text-muted-foreground"
                                    }`}
                            >
                                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span
                                className={`ml-2 text-sm ${currentStep === step.id
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {step.label}
                            </span>
                            {index < STEPS.length - 1 && (
                                <div className="w-8 h-px bg-border mx-2" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleBack}>
                        {currentStep === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-2" /> Back</>}
                    </Button>
                    <Button onClick={handleNext}>
                        {currentStep === STEPS.length ? "Finish" : <>Next <ChevronRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden">
                {currentStep === 1 && (
                    <StepDetails data={campaignData} updateData={setCampaignData} />
                )}
                {currentStep === 2 && (
                    <div className="h-full">
                        <EmailBuilder isWizardMode={true} />
                    </div>
                )}
                {currentStep === 3 && (
                    <StepAudience data={campaignData} updateData={setCampaignData} />
                )}
                {currentStep === 4 && (
                    <StepSchedule data={campaignData} updateData={setCampaignData} />
                )}
            </div>
        </div>
    );
};
