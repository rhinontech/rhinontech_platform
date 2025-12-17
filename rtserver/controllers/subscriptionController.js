const { subscriptions } = require("../models");

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { transactions } = require("../models");

const { logActivity } = require("../utils/activityLogger");

const createPayment = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;
    const { amount, currency, receipt, plan, plan_cycle } = req.body;

    if (!amount || !currency || !receipt || !organization_id || !user_id) {
      return res.status(400).json({
        message:
          "amount, currency, receipt, tier, and user details are required",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
    });

    if (!order) {
      return res
        .status(500)
        .json({ message: "Failed to create order in Razorpay" });
    }
    try {
      const transaction = await transactions.create({
        organization_id,
        user_id: user_id,
        subscription_tier: plan,
        subscription_cycle: plan_cycle,
        payment_amount: amount / 100,
        payment_order_id: order.id,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({
        message: "Error saving transaction to database",
        error: error.message,
      });
    }

    //log activity
    logActivity(user_id, organization_id, "PAYMENT", "Payment created", {
      amount,
      currency,
      receipt,
      plan,
      plan_cycle,
    });
    res.status(200).json({ order });
  } catch (error) {
    console.error("Error creating payment:", error);
    res
      .status(500)
      .json({ message: "Error creating payment", error: error.message });
  }
};

const validatePayment = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;
    const { paymentOrderId, paymentId, paymentSignature, plan, plan_cycle } =
      req.body;

    if (!paymentOrderId || !paymentId || !paymentSignature) {
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    sha.update(`${paymentOrderId}|${paymentId}`);
    const expected_signature = sha.digest("hex");

    let payment_status;

    if (expected_signature === paymentSignature) {
      payment_status = "success";
    } else {
      payment_status = "failed";
    }

    try {
      const transaction = await transactions.findOne({
        where: {
          payment_order_id: paymentOrderId,
          organization_id,
          user_id: user_id,
        },
      });

      const subscription = await subscriptions.findOne({
        where: {
          organization_id,
        },
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }

      if (!subscription) {
        return res.status(404).json({
          message: "subscription not found",
        });
      }

      await transaction.update({
        payment_id: paymentId,
        payment_signature: paymentSignature,
        payment_status,
      });

      // const planDurations = {
      //   Basic: 1,
      //   Advance: 2,
      //   Premium: 3,
      // };

      const planStartDate = new Date();
      const planEndDate = new Date(planStartDate);

      if (plan_cycle === "annual") {
        planEndDate.setFullYear(planEndDate.getFullYear() + 1);
      } else if (plan_cycle === "monthly") {
        planEndDate.setMonth(planEndDate.getMonth() + 1);
      }

      if (payment_status === "success") {
        await subscription.update({
          subscription_tier: plan,
          subscription_cycle: plan_cycle,
          subscription_start_date: planStartDate,
          subscription_end_date: planEndDate,
        });
      }
      await transaction.save();
      await subscription.save();

      //log activity
      logActivity(
        user_id,
        organization_id,
        "PAYMENT",
        "Payment successfully completed",
        { plan, plan_cycle }
      );
      res.status(200).json({
        message:
          payment_status === "success"
            ? "Payment validated successfully"
            : "Payment validation failed",
        orderId: paymentOrderId,
        paymentID: paymentId,
        plan: subscription.subscription_tier,
        subscription_start_date: subscription.subscription_start_date,
        subscription_end_date: subscription.subscription_end_date,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      return res.status(500).json({
        message: "Error saving transaction to database",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error validating payment:", error);
    res
      .status(500)
      .json({ message: "Error validating payment", error: error.message });
  }
};

const transactionDetails = async (req, res) => {
  try {
    const { organization_id, user_id } = req.user;

    if (!organization_id || !user_id) {
      return res.status(400).json({ message: "org_id , user_id is required" });
    }

    const transaction = await transactions.findAll({
      where: { organization_id, user_id: user_id },
      order: [["created_at", "DESC"]],
    });
    if (!transaction) {
      return res.status(400).json({ message: "transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({
      message: "Error Fetching Transaction detail",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  validatePayment,
  transactionDetails,
};
