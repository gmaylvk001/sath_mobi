import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Order from "@/models/ecom_order_info";
import Category from "@/models/ecom_category_info";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const excludeParam = searchParams.get("exclude");
  const excludedIds = excludeParam
    ? excludeParam.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
  const excludedIdsSet = new Set(excludedIds.map(String));

  const TARGET_LIMIT = 12; // Total items to show in horizontal section
  const MAX_PER_BRAND = 3; // Max 3 products per brand

  try {
    if (!categorySlug) {
      return NextResponse.json({
        success: true,
        data: [],
        category: categorySlug,
      });
    }

    // 🔍 Find Category Details to check category type
    let catDoc = null;
    if (mongoose.Types.ObjectId.isValid(categorySlug)) {
      catDoc = await Category.findById(categorySlug).lean();
    }
    if (!catDoc) {
      catDoc = await Category.findOne({
        $or: [{ category_slug: categorySlug }, { category_name: categorySlug }],
      }).lean();
    }

    const catSlugLower = (catDoc?.category_slug || categorySlug || "").toLowerCase();
    const catNameLower = (catDoc?.category_name || "").toLowerCase();

    // Check if current category is Mobile / Phone
    const isMobileCategory =
      catSlugLower.includes("mobile") ||
      catSlugLower.includes("phone") ||
      catNameLower.includes("mobile") ||
      catNameLower.includes("phone");

    // 🚫 Regex to filter out button / feature phones
    const buttonPhoneRegex = /button|keypad|guru|it2163|nokia 105|nokia 106|feature phone|dualsim 2g/i;

    // Base query filter
    const baseFilter = {
      status: "Active",
      quantity: { $gt: 0 },
    };

    if (excludedIds.length > 0) {
      baseFilter._id = { $nin: excludedIds };
    }

    if (isMobileCategory) {
      baseFilter.name = { $not: buttonPhoneRegex };
      baseFilter.price = { $gte: 2500 }; // Exclude low-cost keypad/button phones
    }

    // Track selected products and per-brand limit count
    const selectedProducts = [];
    const brandCountMap = {};

    const addProductIfAllowed = (product) => {
      if (!product || !product._id || excludedIdsSet.has(String(product._id))) return false;

      // Strict check for mobile button phones
      if (isMobileCategory) {
        if (buttonPhoneRegex.test(product.name || "")) return false;
        if ((product.price || 0) < 2500) return false;
      }

      const brandKey = String(product.brand || "unknown");
      const currentCount = brandCountMap[brandKey] || 0;

      // 🔴 Rule: Max 3 products per brand
      if (currentCount < MAX_PER_BRAND) {
        selectedProducts.push(product);
        brandCountMap[brandKey] = currentCount + 1;
        return true;
      }
      return false;
    };

    // 1️⃣ Fetch Order-based Fast Moving Products
    const categoryQueryIds = [categorySlug];
    if (catDoc) {
      categoryQueryIds.push(String(catDoc._id), catDoc.category_slug, catDoc.category_name);
    }

    const orderProducts = await Order.find({
      "order_item.category": { $in: categoryQueryIds },
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const uniqueItemCodes = [
      ...new Set(
        orderProducts.flatMap((order) =>
          (order.order_item || [])
            .filter((item) =>
              categoryQueryIds.some(
                (id) => String(item.category || "").toLowerCase() === String(id).toLowerCase()
              )
            )
            .map((item) => item.item_code)
        )
      ),
    ].filter(Boolean);

    if (uniqueItemCodes.length > 0) {
      const fastMovingProducts = await Product.find({
        ...baseFilter,
        item_code: { $in: uniqueItemCodes },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();

      for (const p of fastMovingProducts) {
        if (selectedProducts.length >= TARGET_LIMIT) break;
        addProductIfAllowed(p);
      }
    }

    // 2️⃣ Fallback: Fetch Recently Added High-Price Models
    if (selectedProducts.length < TARGET_LIMIT) {
      const existingIds = selectedProducts.map((p) => p._id);

      const categoryMatchCondition = [
        { category: categorySlug },
        { sub_category: categorySlug },
        { category_new: categorySlug },
      ];
      if (catDoc) {
        categoryMatchCondition.push(
          { category: String(catDoc._id) },
          { category: catDoc.category_slug },
          { category: catDoc.category_name }
        );
      }

      const candidateProducts = await Product.find({
        ...baseFilter,
        $or: categoryMatchCondition,
        _id: { $nin: existingIds },
      })
        .sort({ createdAt: -1, price: -1 }) // Newly launched / recent models first, then highest price
        .limit(60)
        .lean();

      for (const p of candidateProducts) {
        if (selectedProducts.length >= TARGET_LIMIT) break;
        addProductIfAllowed(p);
      }
    }

    return NextResponse.json({
      success: true,
      data: selectedProducts,
      category: categorySlug,
    });
  } catch (error) {
    console.error("Error in /api/home/onsale API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

