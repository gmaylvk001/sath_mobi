import mongoose from "mongoose";

const TopBannerSchema = new mongoose.Schema({
  banner_image: { type: String, required: true }, // desktop image path
  mobile_banner_image: { type: String, default: "" }, // mobile image path (optional)
  redirect_url: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  order: { type: Number, default: 0 }, // 👈 added for sorting
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.top_banners ||
  mongoose.model("top_banners", TopBannerSchema);
