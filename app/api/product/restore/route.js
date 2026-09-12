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
      return NextResponse.json(
        { error: "At least one product ID is required" },
        { status: 400 }
      );
    }

    for (const id of ids) {
      const removedProduct = await ProductRemoved.findById(id).lean();

      if (!removedProduct) {
        return NextResponse.json(
          { error: "Removed product not found" },
          { status: 404 }
        );
      }

      const { removedAt, ...productData } = removedProduct;

      await Product.replaceOne(
        { _id: removedProduct._id },
        {
          ...productData,
          updatedAt: new Date(),
        },
        { upsert: true }
      );

      await ProductRemoved.deleteOne({ _id: removedProduct._id });
    }

    return NextResponse.json(
      { message: "Products restored successfully", count: ids.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restoring product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
