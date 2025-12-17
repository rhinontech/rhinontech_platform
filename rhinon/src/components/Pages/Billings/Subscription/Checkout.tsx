"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Users, Rocket, Tag, X, Check } from "lucide-react";
import { useUserStore } from "@/utils/store";
import {
    createPaymentGateway,
    validatePayment,
} from "@/services/billing/transactionService";
import Cookies from "js-cookie";
import logo from "@/assets/logo/Logo_Rhinon_Tech_Dark.png";
import { toast } from "sonner";
import {
    validateCoupon,
    calculateDiscount,
    type CouponCode,
} from "@/config/couponCodes";
import { getPlanPrice, PLAN_PRICING } from "@/config/planPricing";
import {
    VOICE_BOT_TIERS,
    calculateVoiceBotPrice,
    type VoiceBotTier,
} from "@/config/voiceBotPricing";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RazorPayInterface {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

const planIcons: Record<string, any> = {
    Starter: Shield,
    Growth: Users,
    Scale: Rocket,
};

const GST_RATE = 0.18; // 18% GST

export default function Checkout() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
    const [discount, setDiscount] = useState(0);
    const [voiceBotMinutes, setVoiceBotMinutes] = useState<number>(0);

    const orgName = useUserStore((state) => state.userData.orgName);
    const userEmail = useUserStore((state) => state.userData.userEmail);
    const setUserData = useUserStore((state) => state.setUserData);

    // Get plan details from URL params
    const planName = searchParams.get("plan") || "";
    const billingCycle = (searchParams.get("cycle") || "monthly") as
        | "monthly"
        | "annual";

    // Fetch price from secure configuration (not from URL)
    const basePrice = getPlanPrice(planName, billingCycle) || 0;
    const planDetails = PLAN_PRICING[planName];

    // Calculate prices
    const isYearly = billingCycle === "annual";
    const voiceBotPriceMonthly = calculateVoiceBotPrice(voiceBotMinutes);
    const voiceBotPrice = isYearly ? voiceBotPriceMonthly * 12 : voiceBotPriceMonthly;
    const basePriceTotal = isYearly ? basePrice * 12 : basePrice;
    const subtotal = basePriceTotal + voiceBotPrice;
    const discountedSubtotal = subtotal - discount;
    const gst = Math.round(discountedSubtotal * GST_RATE);
    const total = discountedSubtotal + gst;

    const PlanIcon = planIcons[planName] || Shield;

    useEffect(() => {
        // Redirect if no plan details or invalid plan
        if (!planName || basePrice === 0) {
            toast.error("Invalid plan selected");
            router.push("/superadmin/billings/subscription");
        }
    }, [planName, basePrice, router]);

    const handleApplyPromoCode = () => {
        if (!promoCode.trim()) {
            toast.error("Please enter a promo code");
            return;
        }

        const coupon = validateCoupon(promoCode);
        if (!coupon) {
            toast.error("Invalid or expired promo code");
            return;
        }

        const discountAmount = calculateDiscount(subtotal, coupon.discount);
        setAppliedCoupon(coupon);
        setDiscount(discountAmount);
        toast.success(`Promo code applied! ${coupon.discount}% off`);
    };

    const handleRemovePromoCode = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setPromoCode("");
        toast.info("Promo code removed");
    };

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

    const handlePayment = async () => {
        setLoading(true);
        const amount = total * 100; // Convert to paise

        try {
            const values = {
                amount,
                plan: planName,
                plan_cycle: billingCycle,
                currency: "INR",
                receipt: orgName,
            };

            const response = await createPaymentGateway(values);
            const { id: order_id } = response.data.order;
            const isScriptLoaded = await loadRazorpayScript();

            if (!isScriptLoaded) {
                toast.error("Razorpay SDK failed to load. Please try again.");
                setLoading(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: values.amount,
                currency: values.currency,
                name: "RhinonTech",
                description: "Subscription Payment",
                image: logo,
                order_id,
                handler: async (response: RazorPayInterface) => {
                    setLoading(true);
                    const requestBody = {
                        paymentOrderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        paymentSignature: response.razorpay_signature,
                        plan: planName,
                        plan_cycle: billingCycle,
                    };
                    try {
                        const validateRes = await validatePayment(requestBody);
                        const trialEndDate = new Date(
                            validateRes?.data.subscription_end_date
                        );
                        const currentDate = new Date();
                        const isPlanValid = trialEndDate > currentDate;
                        Cookies.set("isPlanValid", isPlanValid ? "true" : "false");
                        setUserData({
                            orgPlan: validateRes?.data.plan,
                            isPlanValid,
                            planExpiryDate: validateRes?.data.subscription_end_date,
                        });
                        toast.success("Payment successful! Your plan has been activated.");
                        router.push("/superadmin/billings/subscription");
                    } catch (error) {
                        console.error("Payment Validation Failed");
                        toast.error("Payment validation failed. Please contact support.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: orgName,
                    email: userEmail,
                },
                theme: {
                    color: "#3399cc",
                },
            };

            setLoading(false);
            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on("payment.failed", (response: any) => {
                console.error("Payment failed:", response);
                toast.error(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();
        } catch (error) {
            console.error("Error in handlePayment:", error);
            setLoading(false);
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-1 flex-col w-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b h-[60px] p-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-base font-bold">Checkout</h2>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 h-0">
                <div className="flex-1 p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Features Column (Left) */}
                        <div className="order-2 lg:order-1">
                            {planDetails && (
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PlanIcon className="h-5 w-5" />
                                            {planName} Features
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {planDetails.description}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">AI Chatbot</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.aiChatbot}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">Users</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.users} users</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">Training Data Sources</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.trainingSources}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">Knowledge Hub</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.knowledgeHub}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">SEO Analytics Report</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.seoAnalytics}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">Campaigns</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.campaigns} campaigns</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">Voice Bot</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.voiceBot}</p>
                                                    </div>
                                                </div>

                                                {planDetails.features.individualKnowledgeBase && (
                                                    <div className="flex items-start gap-3">
                                                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium">Individual Knowledge Base</p>
                                                            <p className="text-sm text-muted-foreground">Included</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {planDetails.features.liveTrafficChat && (
                                                    <div className="flex items-start gap-3">
                                                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium">Live Traffic Chat</p>
                                                            <p className="text-sm text-muted-foreground">Included</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {planDetails.features.directCalling && (
                                                    <div className="flex items-start gap-3">
                                                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium">Direct Calling</p>
                                                            <p className="text-sm text-muted-foreground">Included</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">CRM</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.crm}</p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <div className="flex items-start gap-3">
                                                    <div className="h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Workflow Automation</p>
                                                        <p className="text-sm text-muted-foreground">{planDetails.features.workflowAutomation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Order Summary Column (Right) */}
                        <div className="space-y-6 order-1 lg:order-2">
                            {/* Plan Info (Moved above Order Summary) */}
                            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <PlanIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">{planName} Plan</p>
                                        <p className="text-sm text-muted-foreground">
                                            {isYearly ? "Billed Yearly" : "Billed Monthly"}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                    Change
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">
                                                {isYearly
                                                    ? `Base Price (₹${(basePrice / 1000).toFixed(0)}k × 12 months)`
                                                    : "Base Price (Monthly)"}
                                            </span>
                                            <span className="font-medium">₹{basePriceTotal.toLocaleString("en-IN")}</span>
                                        </div>

                                        {/* Voice Bot Add-on Section */}
                                        <div className="pt-2 pb-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">Voice Bot Add-on</span>
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                                        Optional
                                                    </span>
                                                </div>
                                                {voiceBotPrice > 0 && (
                                                    <div className="text-right">
                                                        <span className="font-medium block">₹{voiceBotPrice.toLocaleString("en-IN")}</span>
                                                        {isYearly && (
                                                            <span className="text-xs text-muted-foreground block">
                                                                (₹{voiceBotPriceMonthly.toLocaleString("en-IN")} × 12)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Select
                                                value={voiceBotMinutes.toString()}
                                                onValueChange={(value) => setVoiceBotMinutes(Number(value))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select minutes" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">None</SelectItem>
                                                    {VOICE_BOT_TIERS.map((tier) => (
                                                        <SelectItem key={tier.minutes} value={tier.minutes.toString()}>
                                                            <div className="flex items-center justify-between w-full gap-4">
                                                                <span>{tier.label}</span>
                                                                <span className="text-muted-foreground">
                                                                    (₹{Math.round(tier.totalPrice).toLocaleString("en-IN")})
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {voiceBotMinutes > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                    Includes {voiceBotMinutes.toLocaleString()} minutes of voice bot usage per month.
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-sm font-medium">Subtotal</span>
                                            <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                                        </div>

                                        {/* Promo Code Section */}
                                        {!appliedCoupon ? (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Have a promo code?</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter promo code"
                                                        value={promoCode}
                                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleApplyPromoCode();
                                                            }
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        onClick={handleApplyPromoCode}
                                                        variant="outline"
                                                        disabled={!promoCode.trim()}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                                                {appliedCoupon.code}
                                                            </p>
                                                            <p className="text-xs text-green-700 dark:text-green-300">
                                                                {appliedCoupon.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={handleRemovePromoCode}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Discount Display */}
                                        {discount > 0 && (
                                            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                                <span className="text-sm">
                                                    Discount ({appliedCoupon?.discount}% off)
                                                </span>
                                                <span className="font-medium">-₹{discount.toLocaleString("en-IN")}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">GST (18%)</span>
                                            <span className="font-medium">₹{gst.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between text-lg font-bold">
                                        <span>Total Amount</span>
                                        <span>₹{total.toLocaleString("en-IN")}</span>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {loading ? "Processing..." : "Pay Now"}
                                        </Button>
                                    </div>

                                    <p className="text-xs text-muted-foreground text-center">
                                        By proceeding, you agree to our terms and conditions
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                </ScrollArea>
            </div>
        </div >
    );
}
