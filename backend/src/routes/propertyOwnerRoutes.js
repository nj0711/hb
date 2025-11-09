// routes/propertyOwnerRoutes.js
import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createProperty,
  getOwnerProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";
import {
  getOwnerBookings,
  updateBookingStatus,
  getBookingDetails,
} from "../controllers/bookingController.js";

const router = express.Router();

// ✅ Property Owner routes
router.post(
  "/properties",
  auth,
  authorize("property_owner"),
  upload.array("images", 5),
  createProperty
);
router.get(
  "/properties",
  auth,
  authorize("property_owner"),
  getOwnerProperties
);
router.get(
  "/properties/:id",
  auth,
  authorize("property_owner"),
  getPropertyById
);
router.put(
  "/properties/:id",
  auth,
  authorize("property_owner"),
  upload.array("images", 5),
  updateProperty
);
router.delete(
  "/properties/:id",
  auth,
  authorize("property_owner"),
  deleteProperty
);

// ✅ Bookings for property owners
router.get("/bookings", auth, authorize("property_owner"), getOwnerBookings);
router.get(
  "/bookings/:bookingId",
  auth,
  authorize("property_owner"),
  getBookingDetails
);
router.put(
  "/bookings/:bookingId/:action",
  auth,
  authorize("property_owner"),
  updateBookingStatus
);

export default router;
