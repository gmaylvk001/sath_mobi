import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const product = await Product.findOne({ status: "NewArrived" })
      .sort({ createdAt: -1 }) // latest
      .lean();

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
