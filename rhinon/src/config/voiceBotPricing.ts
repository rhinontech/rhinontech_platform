// Voice Bot pricing tiers configuration

export interface VoiceBotTier {
    minutes: number;
    pricePerMinute: number;
    label: string;
    totalPrice: number;
}

export const VOICE_BOT_TIERS: VoiceBotTier[] = [
    {
        minutes: 40,
        pricePerMinute: 0.07,
        label: "40 minutes",
        totalPrice: 40 * 0.07 * 83, // Convert USD to INR (approx ₹83 per USD)
    },
    {
        minutes: 200,
        pricePerMinute: 0.07,
        label: "200 minutes",
        totalPrice: 200 * 0.07 * 83,
    },
    {
        minutes: 1200,
        pricePerMinute: 0.06,
        label: "1,200 minutes",
        totalPrice: 1200 * 0.06 * 83,
    },
    {
        minutes: 5000,
        pricePerMinute: 0.05,
        label: "5,000 minutes",
        totalPrice: 5000 * 0.05 * 83,
    },
    {
        minutes: 12500,
        pricePerMinute: 0.04,
        label: "12,500 minutes",
        totalPrice: 12500 * 0.04 * 83,
    },
];

/**
 * Get Voice Bot tier by minutes
 */
export function getVoiceBotTier(minutes: number): VoiceBotTier | null {
    return VOICE_BOT_TIERS.find(tier => tier.minutes === minutes) || null;
}

/**
 * Calculate Voice Bot price for selected minutes
 */
export function calculateVoiceBotPrice(minutes: number): number {
    const tier = getVoiceBotTier(minutes);
    return tier ? Math.round(tier.totalPrice) : 0;
}
