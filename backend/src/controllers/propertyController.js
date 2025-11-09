import path from "path";
import Property from "../models/Property.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ✅ Create new property
export const createProperty = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Validate required fields
    if (
      !req.body.name ||
      !req.body.description ||
      !req.body.type ||
      !req.body.price ||
      !req.body.location
    ) {
      return res.status(400).json({
        message: "All required fields must be provided",
        missingFields: {
          name: !req.body.name,
          description: !req.body.description,
          type: !req.body.type,
          price: !req.body.price,
          location: !req.body.location,
        },
      });
    }

    // Extract new fields
    const { bedrooms, maxOccupancy } = req.body;

    // Upload images
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file);
          if (result?.url) {
            images.push({
              url: result.url,
              public_id: result.public_id,
            });
          }
        }
      } catch (error) {
        console.error("Error uploading images:", error);
      }
    }

    // Create property
    const property = new Property({
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      type: req.body.type,
      price: Number(req.body.price),
      location: req.body.location.trim(),
      bedrooms: Number(bedrooms) || 1,
      maxOccupancy: Number(maxOccupancy) || 1,
      amenities: req.body.amenities
        ? req.body.amenities.split(",").map((a) => a.trim())
        : [],
      rules: req.body.rules || "",
      images,
      owner: req.user._id,
      status: "available",
      isApproved: false,
    });

    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ Fetch public properties (show all approved, including booked)
export const getProperties = async (req, res) => {
  try {
    // Include both available and booked, but still only approved
    const properties = await Property.find({
      isApproved: true,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Fetch single property
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "name email"
    );
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update property
export const updateProperty = async (req, res) => {
  console.log("Incoming BODY:", req.body);
  console.log("Incoming FILES:", req.files);

  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      price,
      location,
      rules,
      amenities,
      existingImages,
      bedrooms,
      maxOccupancy,
    } = req.body;

    // Parse amenities and existing images
    const amenitiesArray = amenities
      ? amenities.split(",").map((a) => a.trim()).filter((a) => a)
      : [];

    let keepImages = [];
    if (existingImages) {
      try {
        keepImages = JSON.parse(existingImages).filter(
          (img) => img.url && img.public_id
        );
      } catch {
        keepImages = [];
      }
    }

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    // Handle new uploads
    let newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        if (result?.url) {
          newImages.push({
            url: result.url,
            public_id: result.public_id,
          });
        }
      }
    }

    // Update fields
    if (name) property.name = name.trim();
    if (description) property.description = description.trim();
    if (type) property.type = type;
    if (price) property.price = Number(price);
    if (location) property.location = location.trim();
    if (rules) property.rules = rules;
    if (amenitiesArray.length) property.amenities = amenitiesArray;

    if (keepImages.length || newImages.length) {
      property.images = [...keepImages, ...newImages];
    }

    if (bedrooms !== undefined) property.bedrooms = Number(bedrooms);
    if (maxOccupancy !== undefined) property.maxOccupancy = Number(maxOccupancy);

    await property.save();
    res.json(property);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Error updating property" });
  }
};

// ✅ Delete property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!property) return res.status(404).json({ message: "Property not found" });

    await Property.deleteOne({ _id: req.params.id });
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Admin: Filtered property list
export const getAdminProperties = async (req, res) => {
  try {
    const { search, filter } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
      ];
    }

    if (filter === "pending") query.isApproved = false;
    if (filter === "approved") query.isApproved = true;
    if (filter === "cancelled") query.status = "cancelled";
    if (filter === "available") query.status = "available";

    const properties = await Property.find(query)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (err) {
    console.error("Error fetching admin properties:", err);
    res.status(500).json({ message: "Error fetching properties" });
  }
};

// ✅ Admin: Fetch all properties
export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error("Error fetching all properties:", error);
    res.status(500).json({ message: "Error fetching properties" });
  }
};

// ✅ Admin: Approve property
export const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    property.isApproved = true;
    property.rejectionReason = undefined;
    await property.save();

    res.json({ message: "Property approved successfully", property });
  } catch (error) {
    console.error("Error approving property:", error);
    res.status(500).json({ message: "Error approving property" });
  }
};

// ✅ Admin: Reject property
export const rejectProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    property.isApproved = false;
    property.status = "rejected";
    property.rejectionReason = req.body.reason || "Property rejected by admin";

    await property.save();
    res.json({ message: "Property rejected successfully", property });
  } catch (error) {
    console.error("Error rejecting property:", error);
    res.status(500).json({ message: "Error rejecting property" });
  }
};

// ✅ Admin: Pending & Approved helpers
export const getPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ isApproved: false })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    res.status(500).json({ message: "Error fetching pending properties" });
  }
};

export const getApprovedProperties = async (req, res) => {
  try {
    const properties = await Property.find({ isApproved: true })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error("Error fetching approved properties:", error);
    res.status(500).json({ message: "Error fetching approved properties" });
  }
};

// ✅ Owner: Fetch owned properties
export const getOwnerProperties = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const properties = await Property.find({ owner: req.user._id })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    console.error("Error fetching owner properties:", error);
    res.status(500).json({ message: "Error fetching owner properties" });
  }
};
