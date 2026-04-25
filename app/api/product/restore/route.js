import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product";
import ProductRemoved from "@/models/productRemoved";

export async function POST(req) {
  try {
    await connectDB();

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const removedProduct = await ProductRemoved.findById(productId).lean();

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

    return NextResponse.json(
      { message: "Product restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restoring product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
