import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product";
import ProductRemoved from "@/models/productRemoved";

export async function POST(req) {
  try {
    await connectDB();

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();

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

    await Product.deleteOne({ _id: productId });

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
