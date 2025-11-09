import mongoose from "mongoose";
import Review from "../models/Review.js";
import Property from "../models/Property.js";

// helper
const updatePropertyRating = async (propertyId) => {
  const objectId = new mongoose.Types.ObjectId(propertyId);

  const stats = await Review.aggregate([
    { $match: { property: objectId } },
    {
      $group: {
        _id: "$property",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: stats[0].averageRating,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
};

// ✅ Create review
export const addReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;

    const review = await Review.create({
      property: propertyId,
      user: req.user._id,
      rating,
      comment,
    });

    await updatePropertyRating(propertyId);

    // populate user so frontend sees name immediately
    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "name email"
    );

    res.status(201).json(populatedReview);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Error adding review" });
  }
};

// ✅ Get reviews for a property
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.id }).populate(
      "user",
      "name email"
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
};

// ✅ Delete review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();
    await updatePropertyRating(review.property);

    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Error deleting review" });
  }
};
