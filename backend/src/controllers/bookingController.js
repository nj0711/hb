import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

// ✅ Create a new booking (auto-fetch owner)
export const createBooking = async (req, res) => {
  try {
    const property = req.body.property || req.body.propertyId;
    const { checkInDate, checkOutDate, totalAmount } = req.body;

    // 1️⃣ Validate inputs
    if (!property || !checkInDate || !checkOutDate || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 2️⃣ Fetch property to get owner automatically
    const propertyDoc = await Property.findById(property).select("owner");
    if (!propertyDoc) {
      return res.status(404).json({ message: "Property not found" });
    }

    const ownerId = propertyDoc.owner;

    // 3️⃣ Check overlapping bookings
    const overlappingBooking = await Booking.findOne({
      property,
      status: { $ne: "cancelled" },
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) },
        },
      ],
    });

    if (overlappingBooking) {
      return res
        .status(400)
        .json({ message: "Property not available for selected dates" });
    }

    // 4️⃣ Create booking
    const booking = new Booking({
      property,
      client: req.user?._id, // from auth middleware
      owner: ownerId, // auto-fetched from property
      checkInDate,
      checkOutDate,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
    });

    await booking.save();

    // ✅ Keep property visible — don't mark as booked
    await Property.findByIdAndUpdate(property, {
      lastBookedAt: new Date(),
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// ✅ Public Availability Check
export const checkAvailability = async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Dates are required" });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const overlappingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }],
    });

    if (overlappingBooking) {
      return res
        .status(400)
        .json({ message: "Property not available for these dates" });
    }

    return res.json({ message: "Property available" });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ message: "Error checking availability" });
  }
};

// ✅ Owner Bookings
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const bookings = await Booking.find({ owner: ownerId })
      .populate("property", "name images price location address type")
      .populate("client", "name email phone address")
      .populate("cancelledBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error in getOwnerBookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// ✅ Client Bookings
export const getClientBookings = async (req, res) => {
  try {
    const clientId = req.user._id;

    const bookings = await Booking.find({ client: clientId })
      .populate("property", "name images price location address type")
      .populate("owner", "name email phone address")
      .populate("cancelledBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching client bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// ✅ Update Booking Status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, action } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (action === "confirm") {
      if (String(booking.owner) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "Only the owner can confirm this booking" });
      }
      if (booking.status === "cancelled") {
        return res
          .status(400)
          .json({ message: "Cannot confirm a cancelled booking" });
      }
      booking.status = "confirmed";
      await booking.save();
      return res.json(booking);
    }

    if (action === "cancel") {
      const isOwner = String(booking.owner) === String(userId);
      const isClient = String(booking.client) === String(userId);

      if (!isOwner && !isClient) {
        return res.status(403).json({
          message:
            "You can only cancel your own booking or an owner can cancel",
        });
      }

      if (isClient) {
        const now = new Date();
        const checkIn = new Date(booking.checkInDate);
        const diffDays = (checkIn - now) / (1000 * 60 * 60 * 24);
        if (diffDays < 2) {
          return res.status(400).json({
            message:
              "Cancellations are only allowed at least 2 days before check-in",
          });
        }
      }

      booking.status = "cancelled";
      booking.cancelledBy = userId;
      await booking.save();
      return res.json(booking);
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status" });
  }
};

// Booking Details
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ client: userId }, { owner: userId }],
    })
      .populate("property", "name images price location type")
      .populate("client", "name email phone address")
      .populate("owner", "name email phone address")
      .populate("cancelledBy", "name email role");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Error fetching booking details" });
  }
};

// Admin: All Bookings
export const getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};

    const bookings = await Booking.find(filter)
      .populate("property", "name location")
      .populate("client", "name email phone address")
      .populate("owner", "name email phone address");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// Admin: Booking Stats
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
    });
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    res.status(500).json({ message: "Error fetching booking statistics" });
  }
};
