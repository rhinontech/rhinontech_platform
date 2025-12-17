"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Users, Rocket, PanelLeft } from "lucide-react";
import {
  PricingTable,
  PricingTableBody,
  PricingTableHeader,
  PricingTableHead,
  PricingTableRow,
  PricingTableCell,
  PricingTablePlan,
} from "./PricingTable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/context/SidebarContext";
import { useUserStore } from "@/utils/store";
import {
  createPaymentGateway,
  validatePayment,
} from "@/services/billing/transactionService";
import Cookies from "js-cookie";
import logo from "@/assets/logo/Logo_Rhinon_Tech_Dark.png";
import { toast } from "sonner";

interface RazorPayInterface {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function Subscription() {
  const router = useRouter();
  const { toggleBillingSidebar } = useSidebar();
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const orgName = useUserStore((state) => state.userData.orgName);
  const userEmail = useUserStore((state) => state.userData.userEmail);
  const currentPlan = useUserStore((state) => state.userData.orgPlan);
  const setUserData = useUserStore((state) => state.setUserData);

  const plans = [
    {
      name: "Starter",
      icon: Shield,
      monthlyPrice: 15000,
      yearlyPrice: 14000,
      description: "Perfect for small businesses getting started",
      features: {
        aiChatbot: "500k Tokens",
        users: "5",
        trainingSources: "Up to 10",
        liveTrafficChat: true,
        knowledgeHub: "10 articles",
        individualKnowledgeBase: false,
        seoAnalytics: "1 / week",
        directCalling: true,
        voiceBot: "Add on",
        campaigns: "3",
        crm: "Coming Soon",
        workflowAutomation: "Coming Soon",
      },
    },
    {
      name: "Growth",
      icon: Users,
      monthlyPrice: 25000,
      yearlyPrice: 24000,
      description: "Ideal for growing teams and businesses",
      popular: true,
      features: {
        aiChatbot: "1 Million Tokens",
        users: "15",
        trainingSources: "Up to 50",
        liveTrafficChat: true,
        knowledgeHub: "25 articles",
        individualKnowledgeBase: true,
        seoAnalytics: "2 / week",
        directCalling: true,
        voiceBot: "Add on",
        campaigns: "5",
        crm: "Coming Soon",
        workflowAutomation: "Coming Soon",
      },
    },
    {
      name: "Scale",
      icon: Rocket,
      monthlyPrice: 35000,
      yearlyPrice: 34000,
      description: "Advanced features for scaling businesses",
      features: {
        aiChatbot: "2 Million Tokens",
        users: "Unlimited",
        trainingSources: "Unlimited",
        liveTrafficChat: true,
        knowledgeHub: "Unlimited articles",
        individualKnowledgeBase: true,
        seoAnalytics: "4 / week",
        directCalling: true,
        voiceBot: "Add on",
        campaigns: "10",
        crm: "Coming Soon",
        workflowAutomation: "Coming Soon",
      },
    },
  ];

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL!;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = (
    basePrice: number,
    planName: string,
    billingCycle: "monthly" | "annual"
  ) => {
    // Only pass plan and cycle - price will be fetched from secure config
    const params = new URLSearchParams({
      plan: planName,
      cycle: billingCycle,
    });
    router.push(`/superadmin/billings/subscription/checkout?${params.toString()}`);
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleBillingSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold">Subscription</h2>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="relative min-h-screen overflow-hidden p-4">
            {/* Background Grid */}
            <div
              className={cn(
                "absolute inset-0 z-[-10] size-full max-h-102 opacity-50",
                "[mask-image:radial-gradient(ellipse_at_center,var(--background),transparent)]"
              )}
              style={{
                backgroundImage:
                  "radial-gradient(var(--foreground) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Header */}
            <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center mb-12">
              <h1
                className={cn(
                  "text-3xl leading-tight font-bold text-balance sm:text-5xl"
                )}>
                {"Choose your "}
                <i className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-400 bg-clip-text font-serif font-extrabold text-transparent">
                  {"plan"}
                </i>
              </h1>

              {/* <p className="text-muted-foreground mt-4 max-w-2xl text-pretty">
                Deploy Consistent Designs Faster With Figr's AI solutions.
              </p> */}

              {/* Billing Toggle */}
              <div className="mt-8 flex items-center gap-4 rounded-full border bg-muted p-1">
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  Yearly
                </button>
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    !isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  Monthly
                </button>
              </div>
            </div>

            {/* Pricing Table */}
            <PricingTable className="mx-auto my-5 max-w-5xl">
              <PricingTableHeader>
                <PricingTableRow>
                  <th />

                  {plans.map((plan) => {
                    const isCurrentPlan =
                      currentPlan &&
                      currentPlan.toLowerCase() === plan.name.toLowerCase();

                    return (
                      <th key={plan.name} className="p-1">
                        <PricingTablePlan
                          name={plan.name}
                          yearlyprice={`₹${plan.yearlyPrice / 1000}k/mo`}
                          monthlyprice={`₹${plan.monthlyPrice / 1000}k/mo`}
                          icon={plan.icon}
                          isYearly={isYearly}
                          /*  apply blue fade ONLY to current plan */
                          className={cn(
                            isCurrentPlan &&
                            "after:pointer-events-none after:absolute after:-inset-0.5 after:rounded-[inherit] after:bg-gradient-to-b after:from-blue-500/15 after:to-transparent after:blur-[2px]"
                          )}>
                          {isCurrentPlan && (
                            <Badge className="mb-2 bg-blue-900 text-white">
                              Current Plan
                            </Badge>
                          )}

                          <Button
                            disabled={isCurrentPlan || loading}
                            variant="outline"
                            className={cn(
                              "w-full rounded-lg",
                              // keep popular styling only if it is NOT current
                              (currentPlan === "Free" ||
                                currentPlan === "Trial") &&
                                plan.popular &&
                                !isCurrentPlan
                                ? "border-blue-700/60 bg-blue-600/80 text-white hover:bg-blue-600"
                                : "bg-transparent"
                            )}
                            size="lg"
                            onClick={() =>
                              handleCheckout(
                                isYearly ? plan.yearlyPrice : plan.monthlyPrice,
                                plan.name,
                                isYearly ? "annual" : "monthly"
                              )
                            }>
                            {isCurrentPlan ? "Active" : "Get Started"}
                          </Button>
                        </PricingTablePlan>
                      </th>
                    );
                  })}
                </PricingTableRow>
              </PricingTableHeader>

              <PricingTableBody>
                <PricingTableRow>
                  <PricingTableHead>AI Chatbot</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.aiChatbot}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Users</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.users}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Training Data Sources</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.trainingSources}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Live Traffic Chat</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.liveTrafficChat}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Knowledge Hub</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.knowledgeHub}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Individual Knowledge Base</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.individualKnowledgeBase}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>SEO Analytics Report</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.seoAnalytics}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Direct Calling</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.directCalling}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Voice Bot</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.voiceBot}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Campaigns</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.campaigns}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>CRM</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.crm}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>

                <PricingTableRow>
                  <PricingTableHead>Workflow Automation</PricingTableHead>
                  {plans.map((plan, idx) => (
                    <PricingTableCell key={idx}>
                      {plan.features.workflowAutomation}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>
              </PricingTableBody>
            </PricingTable>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
