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
    // ✅ Check if selected category is Mobiles
    const selectedCategory = categories.find(
      (c) => String(c._id) === String(categoryId)
    );
    const isMobileCategory =
      selectedCategory &&
      (selectedCategory.category_slug?.toLowerCase().includes("mobile") ||
        selectedCategory.category_name?.toLowerCase().includes("mobile"));

    // Build product query
    const productQuery = {
      quantity: { $gt: 0 },
      category: categoryId,
      status: "Active",
    };

    // ✅ Mobile category only: price >= 10000 filter
    if (isMobileCategory) {
      productQuery.price = { $gte: 10000 };
    }

    // Fetch more products to allow brand-based filtering (fetch 60 to pick 10 mixed)
    const allProducts = await Product.find(productQuery)
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    // ✅ Max 3 products per brand — mixed brands
    const brandCount = {};
    const MAX_PER_BRAND = 3;

    for (const product of allProducts) {
      if (products.length >= 10) break;

      const brandKey = String(product.brand || "unknown").toLowerCase().trim();
      const count = brandCount[brandKey] || 0;

      if (count < MAX_PER_BRAND) {
        brandCount[brandKey] = count + 1;
        products.push(product);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    categories,
    products,
  });
}
