// /app/api/home/best-sellers/route.js
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");

  const categories = await Category.find({
    status: "Active",
    parentid: "none",
  })
    .sort({ position: 1 })
    .select("_id category_name category_slug image");

  let products = [];

  if (categoryId) {
    products = await Product.find({
      quantity: { $gt: 0 },
      category: categoryId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  return NextResponse.json({
    ok: true,
    categories,
    products,
  });
}
