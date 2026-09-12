import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product";
import ProductRemoved from "@/models/productRemoved";

export async function POST(req) {
  try {
    await connectDB();

    const { productId, productIds } = await req.json();
    const ids = Array.isArray(productIds) ? productIds : productId ? [productId] : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "At least one product ID is required" }, { status: 400 });
    }

    for (const id of ids) {
      const product = await Product.findById(id).lean();

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      await ProductRemoved.replaceOne(
        { _id: product._id },
        {
          ...product,
          removedAt: new Date(),
          updatedAt: new Date(),
        },
        { upsert: true }
      );

      await Product.deleteOne({ _id: id });
    }

    return NextResponse.json({ message: "Products deleted successfully", count: ids.length }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
