// models/Review.js
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ecom_users_info",
    required: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  reviews_title: { type: String, required: true },
  reviews_rating: { type: Number, min: 1, max: 5, required: true },
  reviews_comments: { type: String, default: "" },

  review_images: {
    type: [String],
    default: [],
  },

  review_status: {
    type: String,
    enum: ["pending", "approved", "flagged"],
    default: "pending",
  },
  created_date: { type: Date, default: Date.now },
  updated_date: { type: Date, default: Date.now },
});

export default mongoose.models.Review ||
  mongoose.model("Review", ReviewSchema);
