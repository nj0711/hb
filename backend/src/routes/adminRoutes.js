import express from "express";
import {
  deleteBooking,
  deleteUser,
  getAllBookings,
  getAllChatUsers,
  getAllUsers,
  updateBookingStatus,
  updateUserStatus,
} from "../controllers/adminController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize("admin"));

// User management routes
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Booking management routes
router.get("/bookings", getAllBookings);
router.put("/bookings/:id/status", updateBookingStatus);
router.delete("/bookings/:id", deleteBooking);

// ✅ Chat: list all users for admin to start chat
router.get("/chat/users", getAllChatUsers);

export default router;
