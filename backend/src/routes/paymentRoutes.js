// backend/src/routes/paymentRoutes.js
import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// No real Razorpay API used — mock flow only
router.post("/order", auth, createOrder);
router.post("/verify", auth, verifyPayment);

export default router;
