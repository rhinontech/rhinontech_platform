// Pricing configuration for subscription plans
// This is the single source of truth for plan pricing and features

export interface PlanFeatures {
    aiChatbot: string;
    users: string;
    trainingSources: string;
    liveTrafficChat: boolean;
    knowledgeHub: string;
    individualKnowledgeBase: boolean;
    seoAnalytics: string;
    directCalling: boolean;
    voiceBot: string;
    campaigns: string;
    crm: string;
    workflowAutomation: string;
}

export interface PlanPricing {
    monthly: number;
    annual: number;
}

export interface PlanDetails {
    name: string;
    description: string;
    pricing: PlanPricing;
    features: PlanFeatures;
}

export const PLAN_PRICING: Record<string, PlanDetails> = {
    Starter: {
        name: "Starter",
        description: "Perfect for small businesses getting started",
        pricing: {
            monthly: 15000, // ₹10,000/month
            annual: 14000, // ₹10,000/month (billed annually: ₹1,20,000/year)
        },
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
            crm: "Included",
            workflowAutomation: "Coming Soon",
        },
    },
    Growth: {
        name: "Growth",
        description: "Ideal for growing teams and businesses",
        pricing: {
            monthly: 25000, // ₹25,000/month
            annual: 24000, // ₹25,000/month (billed annually: ₹3,00,000/year)
        },
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
            crm: "Included",
            workflowAutomation: "Coming Soon",
        },
    },
    Scale: {
        name: "Scale",
        description: "Advanced features for scaling businesses",
        pricing: {
            monthly: 35000, // ₹35,000/month
            annual: 34000, // ₹35,000/month (billed annually: ₹4,20,000/year)
        },
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
            crm: "Included",
            workflowAutomation: "Coming Soon",
        },
    },
};

/**
 * Get the price for a specific plan and billing cycle
 * @param planName - The name of the plan (Starter, Growth, Scale)
 * @param cycle - The billing cycle (monthly or annual)
 * @returns The price in rupees, or null if plan not found
 */
export function getPlanPrice(
    planName: string,
    cycle: "monthly" | "annual"
): number | null {
    const plan = PLAN_PRICING[planName];
    if (!plan) {
        return null;
    }
    return plan.pricing[cycle];
}

/**
 * Validate if the provided price matches the expected plan price
 * @param planName - The name of the plan
 * @param cycle - The billing cycle
 * @param providedPrice - The price to validate
 * @returns True if valid, false otherwise
 */
export function validatePlanPrice(
    planName: string,
    cycle: "monthly" | "annual",
    providedPrice: number
): boolean {
    const expectedPrice = getPlanPrice(planName, cycle);
    if (expectedPrice === null) {
        return false;
    }
    return expectedPrice === providedPrice;
}
