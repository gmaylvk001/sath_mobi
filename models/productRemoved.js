import mongoose from "mongoose";
import { ProductSchema } from "./product";

const ProductRemovedSchema = ProductSchema.clone();

ProductRemovedSchema.add({
  removedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProductRemoved ||
  mongoose.model("ProductRemoved", ProductRemovedSchema, "products_removed");
