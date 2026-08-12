import mongoose from "mongoose";

const StoreLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    url: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    source: { type: String, default: "stores.sathyamobiles.com" },
  },
  { timestamps: true }
);

export default mongoose.models.StoreLocation ||
  mongoose.model("StoreLocation", StoreLocationSchema);
