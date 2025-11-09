import express from "express";
import {
  checkAvailability,
  createBooking,
  getAllBookings,
  getBookingDetails,
  getBookingStats,
  getClientBookings,
  getOwnerBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// ✅ Admin routes
router.get("/admin", auth, isAdmin, getAllBookings);
router.get("/admin/stats", auth, isAdmin, getBookingStats);

// ✅ Owner routes
router.get("/owner", auth, getOwnerBookings);

// ✅ Client routes
router.post("/", auth, createBooking);
router.get("/client", auth, getClientBookings);

// ✅ Public availability check (NO auth)
router.post("/check-availability", checkAvailability);

// ✅ Common routes
router.get("/:bookingId", auth, getBookingDetails);
router.put("/:bookingId/:action", auth, updateBookingStatus);

export default router;
