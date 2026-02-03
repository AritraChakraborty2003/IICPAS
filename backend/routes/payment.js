import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// Initialize Razorpay safely (avoid crashing app when env vars are missing)
let razorpay = null;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️ Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (err) {
  console.error("❌ Razorpay init failed:", err.message);
}

// Create order
router.post("/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0",
      });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Verify payment
router.post("/verify-payment", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Payment ID, and Signature are required",
      });
    }

    // Create the signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Verify the signature
    const isValidSignature = expectedSignature === signature;

    if (isValidSignature) {
      // Here you can save payment details to database
      // For now, we'll just return success

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          orderId,
          paymentId,
          status: "verified",
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

// Get payment details
router.get("/payment/:paymentId", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
});

// Refund payment
router.post("/refund", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const refundData = {
      payment_id: paymentId,
      amount: amount ? amount * 100 : undefined, // Amount in paise, if not provided, full refund
      notes: notes || { reason: "Customer requested refund" },
    };

    const refund = await razorpay.payments.refund(paymentId, refundData);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: refund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
});

export default router;
