import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import StoreLocation from "@/models/storeLocation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const stores = await StoreLocation.find({ status: "Active" })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    console.error("Get store locations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch store locations" },
      { status: 500 }
    );
  }
}
