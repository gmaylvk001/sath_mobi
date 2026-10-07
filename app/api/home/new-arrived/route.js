import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // Query strictly for product marked as newArrived: "yes"
    const product = await Product.findOne({
      $or: [
        { newArrived: "yes" },
        { newarrived: "yes" },
        { newArrived: "Yes" },
        { newarrived: "Yes" }
      ]
    }).lean();

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}