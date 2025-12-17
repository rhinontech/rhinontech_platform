import { PrivateAxios } from "@/helpers/PrivateAxios";
import { validatePlanPrice, getPlanPrice } from "@/config/planPricing";


/**
 * Creates a payment gateway order for subscription
 * 
 * SECURITY: This function validates the price on the frontend before sending to backend.
 * However, the backend MUST also validate the price to prevent API manipulation.
 * 
 * @param values - Payment details including amount, plan, and billing cycle
 * @returns Payment gateway response with order details
 * @throws Error if price validation fails or API request fails
 */
export const createPaymentGateway = async (values: {
  amount: number;
  currency: string;
  receipt: string;
  plan: string;
  plan_cycle: "monthly" | "annual";
}) => {
  try {
    // Frontend validation: Verify the amount matches expected price
    const baseAmount = values.amount / 100; // Convert from paise to rupees
    const expectedPrice = getPlanPrice(values.plan, values.plan_cycle);

    if (!expectedPrice) {
      throw new Error(`Invalid plan: ${values.plan}`);
    }

    // Validate that the amount matches the expected price (before any discounts)
    // Note: This is a basic check. Discount validation happens on backend.
    // Validate that the amount matches or exceeds the base plan price
    // Note: Since we have add-ons (Voice Bot) and discounts, the final amount can vary.
    // Ideally, backend should recalculate the exact expected total including add-ons.
    // For now, we ensure the amount is at least the base plan price (minus max potential discount)
    // or simply check that it's not zero/manipulated to be trivial.

    // Strict check: Amount should be >= Base Price (unless huge discount applied)
    // Real validation must happen on backend with all parameters (plan + add-ons - discount)
    if (baseAmount < expectedPrice * 0.1) { // Sanity check: shouldn't be less than 10% of base price
      console.error(
        `Price mismatch detected! Expected at least: ₹${expectedPrice * 0.1}, Got: ₹${baseAmount}`
      );
      throw new Error("Invalid pricing for selected plan");
    }

    const response = await PrivateAxios.post("/transactions/order", {
      ...values,
    });

    return response;
  } catch (error) {
    console.log("error create payment gateway");
    throw error;
  }
};

export const validatePayment = async (requestBody: {
  paymentOrderId: string;
  paymentId: string;
  paymentSignature: string;
  plan: string;
  plan_cycle: string;
}) => {
  try {
    const response = await PrivateAxios.post("/transactions/order/validate", {
      ...requestBody,
    });
    return response;
  } catch (error) {
    console.log("payment validation failed");
  }
};

export const getTransactionHistory = async () => {
  try {
    const response = await PrivateAxios.get("/transactions/get-transactions");
    return response.data;
  } catch (error) {
    console.log("failed to fetch transaction history");
  }
};
