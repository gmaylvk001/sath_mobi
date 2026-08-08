import mongoose from "mongoose";

const PrebookCampaignSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true, index: true },
    product_details: { type: String, default: "", trim: true },
    banner_image: { type: String, required: true },
    mobile_banner_image: { type: String, default: "" },
    detail_images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.PrebookCampaign ||
  mongoose.model("PrebookCampaign", PrebookCampaignSchema);
