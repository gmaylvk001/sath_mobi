import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ProductRemoved from "@/models/productRemoved";

export async function GET() {
  try {
    await connectDB();

    const removedProducts = await ProductRemoved.find({})
      .sort({ removedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(removedProducts, { status: 200 });
  } catch (error) {
    console.error("Error fetching removed products:", error);
    return NextResponse.json(
      { error: "Failed to fetch removed products" },
      { status: 500 }
    );
  }
}
