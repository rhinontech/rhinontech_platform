// Coupon codes configuration
// Discount range: 10% - 50% off

export interface CouponCode {
    code: string;
    discount: number; // Percentage discount (10-50)
    description: string;
    expiryDate?: string; // Optional expiry date in ISO format
    isActive: boolean;
}

export const COUPON_CODES: Record<string, CouponCode> = {
    WELCOME10: {
        code: "WELCOME10",
        discount: 10,
        description: "Welcome offer - 10% off",
        isActive: true,
    },
    SAVE15: {
        code: "SAVE15",
        discount: 15,
        description: "Save 15% on your subscription",
        isActive: true,
    },
    EARLYBIRD20: {
        code: "EARLYBIRD20",
        discount: 20,
        description: "Early bird special - 20% off",
        isActive: true,
    },
    GROWTH25: {
        code: "GROWTH25",
        discount: 25,
        description: "Growth plan special - 25% off",
        isActive: true,
    },
    SCALE30: {
        code: "SCALE30",
        discount: 30,
        description: "Scale plan exclusive - 30% off",
        isActive: true,
    },
    PREMIUM35: {
        code: "PREMIUM35",
        discount: 35,
        description: "Premium customer discount - 35% off",
        isActive: true,
    },
    ANNUAL40: {
        code: "ANNUAL40",
        discount: 40,
        description: "Annual subscription special - 40% off",
        isActive: true,
    },
    PARTNER45: {
        code: "PARTNER45",
        discount: 45,
        description: "Partner exclusive - 45% off",
        isActive: true,
    },
    MEGA50: {
        code: "MEGA50",
        discount: 50,
        description: "Mega sale - 50% off",
        isActive: true,
    },
    FLASH12: {
        code: "FLASH12",
        discount: 12,
        description: "Flash sale - 12% off",
        expiryDate: "2025-12-31T23:59:59Z",
        isActive: true,
    },
    LOYAL18: {
        code: "LOYAL18",
        discount: 18,
        description: "Loyalty reward - 18% off",
        isActive: true,
    },
    STARTUP22: {
        code: "STARTUP22",
        discount: 22,
        description: "Startup special - 22% off",
        isActive: true,
    },
    ENTERPRISE28: {
        code: "ENTERPRISE28",
        discount: 28,
        description: "Enterprise discount - 28% off",
        isActive: true,
    },
    NEWYEAR33: {
        code: "NEWYEAR33",
        discount: 33,
        description: "New Year special - 33% off",
        expiryDate: "2026-01-31T23:59:59Z",
        isActive: true,
    },
    VIP38: {
        code: "VIP38",
        discount: 38,
        description: "VIP customer exclusive - 38% off",
        isActive: true,
    },
};

/**
 * Validates a coupon code
 * @param code - The coupon code to validate
 * @returns The coupon details if valid, null otherwise
 */
export function validateCoupon(code: string): CouponCode | null {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = COUPON_CODES[normalizedCode];

    if (!coupon || !coupon.isActive) {
        return null;
    }

    // Check expiry date if present
    if (coupon.expiryDate) {
        const expiryDate = new Date(coupon.expiryDate);
        const currentDate = new Date();
        if (currentDate > expiryDate) {
            return null;
        }
    }

    return coupon;
}

/**
 * Calculates the discount amount
 * @param subtotal - The subtotal amount before discount
 * @param discountPercentage - The discount percentage
 * @returns The discount amount
 */
export function calculateDiscount(
    subtotal: number,
    discountPercentage: number
): number {
    return Math.round((subtotal * discountPercentage) / 100);
}
