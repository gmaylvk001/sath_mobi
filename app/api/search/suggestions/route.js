// app/api/search/suggestions/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    await dbConnect();

    const safeQuery = escapeRegex(q);

    const results = await Product.find({
      name: { $regex: safeQuery, $options: "i" },
    })
      .limit(5)
      .select("name price special_price slug images");

    return NextResponse.json(results);
  } catch (error) {
    console.error("Suggestion API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
