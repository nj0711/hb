import express from "express";
import { addReview, deleteReview, getReviews } from "../controllers/reviewController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, addReview);            // add review
router.get("/:id", getReviews);               // get all reviews for property
router.delete("/:id", auth, deleteReview);    // delete review

export default router;
