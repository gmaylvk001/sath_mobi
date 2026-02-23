import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      quantity: { $gt: 0 },
      images : { $ne : [] },
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .limit(8);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch latest products" },
      { status: 500 }
    );
  }
}
