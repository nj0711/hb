// backend/src/controllers/paymentController.js
import Booking from "../models/Booking.js";

/**
 * 1️⃣ Mock Razorpay Order Creation (No real API call)
 * This generates a fake Razorpay order so frontend can open the popup.
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", bookingId } = req.body;

    if (!amount || !bookingId) {
      return res.status(400).json({ message: "Amount and bookingId required" });
    }

    // 💡 Always return a mock order (no Razorpay API required)
    console.log("💡 Mock Razorpay order created for booking:", bookingId);

    return res.status(200).json({
      success: true,
      mock: true,
      order: {
        id: `order_${bookingId}`,
        amount: amount * 100, // Razorpay expects paise
        currency,
      },
      key: "rzp_test_mockkey123", // fake key for Razorpay popup
    });
  } catch (error) {
    console.error("Error creating mock Razorpay order:", error);
    res.status(500).json({ message: "Error creating mock order" });
  }
};

/**
 * 2️⃣ Mock Razorpay Payment Verification
 * This simulates successful payment verification.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking and mark it as paid + confirmed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    await booking.save();

    console.log("✅ Mock payment verified successfully for booking:", bookingId);
    res.json({ success: true, message: "Mock payment verified successfully" });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};
