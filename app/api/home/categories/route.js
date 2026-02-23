import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export async function GET() {
  await dbConnect();

  // Your preferred order
  const order = [
    "mobiles",
    "smart-tv",
    "tablets",
    "air-conditioner",
    "laptop-desktops",
    "accessories"
  ];

  const categories = await Category.find({ parentid: "none" })
    .select("category_name category_slug image")
    .lean();

  // Custom sort
  const sortedCategories = categories.sort(
    (a, b) =>
      order.indexOf(a.category_slug) - order.indexOf(b.category_slug)
  );

  return NextResponse.json(sortedCategories);
}