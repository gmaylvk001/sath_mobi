import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Order from "@/models/ecom_order_info";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const excludeParam = searchParams.get("exclude");
    const excludedIds = excludeParam
      ? excludeParam.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    // 🚫 Regex to strictly exclude button/keypad phones
    const buttonPhoneRegex =
      /button|keypad|guru|it2163|nokia 105|nokia 106|feature phone|dualsim 2g/i;

    const baseQuery = {
      status: "Active",
      quantity: { $gt: 0 },
      images: { $ne: [] },
    };

    if (excludedIds.length > 0) {
      baseQuery._id = { $nin: excludedIds };
    }

    // Fetch parent categories from DB
    const allCategories = await Category.find({ parentid: "none" }).lean();

    const getCategoryMatcher = (slugKey) => {
      const catDoc = allCategories.find((c) =>
        (c.category_slug || "").toLowerCase().includes(slugKey)
      );

      const matchValues = [];
      if (catDoc) {
        matchValues.push(
          String(catDoc._id),
          catDoc.category_slug,
          catDoc.category_name
        );
      } else {
        matchValues.push(slugKey);
      }

      const regex = new RegExp(slugKey, "i");
      return {
        $or: [
          { category: { $in: matchValues } },
          { sub_category: { $in: matchValues } },
          { category_new: { $in: matchValues } },
          { sub_category_name: { $in: matchValues } },
          { category: regex },
          { sub_category: regex },
        ],
      };
    };

    const mobileFilter = getCategoryMatcher("mobile");
    const tvFilter = getCategoryMatcher("smart-tv");
    const acFilter = getCategoryMatcher("air-conditioner");
    const laptopFilter = getCategoryMatcher("laptop");
    const tabletFilter = getCategoryMatcher("tablet");
    const accessoryFilter = getCategoryMatcher("accessories");

    const addedIds = new Set(excludedIds.map(String));
    const usedBrands = new Set();

    const phoneProducts = [];
    const rightProducts = [];

    const addPhone = (p) => {
      if (!p || !p._id || addedIds.has(String(p._id))) return false;
      const brandKey = String(p.brand || "").toLowerCase().trim();
      if (brandKey && usedBrands.has(brandKey)) return false;

      addedIds.add(String(p._id));
      if (brandKey) usedBrands.add(brandKey);
      phoneProducts.push(p);
      return true;
    };

    const addRightProduct = (p) => {
      if (!p || !p._id || addedIds.has(String(p._id))) return false;

      addedIds.add(String(p._id));
      const brandKey = String(p.brand || "").toLowerCase().trim();
      if (brandKey) usedBrands.add(brandKey);
      rightProducts.push(p);
      return true;
    };

    // 📱 1. LEFT SIDE: 3 Smartphones (Price >= 15,000, 3 Distinct Brands, Trending / High-Value)
    // First, check high-selling order items for smartphones >= 15k
    try {
      const trendingOrderPhones = await Order.aggregate([
        { $unwind: "$order_item" },
        {
          $group: {
            _id: "$order_item.item_code",
            totalSold: { $sum: "$order_item.quantity" },
            lastOrderedAt: { $max: "$createdAt" },
          },
        },
        { $sort: { totalSold: -1, lastOrderedAt: -1 } },
        { $limit: 40 },
      ]);

      const orderItemCodes = trendingOrderPhones.map((o) => o._id).filter(Boolean);
      if (orderItemCodes.length > 0) {
        const orderMobiles = await Product.find({
          ...baseQuery,
          ...mobileFilter,
          _id: { $nin: Array.from(addedIds) },
          item_code: { $in: orderItemCodes },
          name: { $not: buttonPhoneRegex },
          price: { $gte: 15000 },
        })
          .sort({ price: -1, createdAt: -1 })
          .lean();

        for (const mob of orderMobiles) {
          if (phoneProducts.length >= 3) break;
          addPhone(mob);
        }
      }
    } catch (e) {
      console.error("Order aggregation error:", e);
    }

    // Fill remaining left phones from high-value smartphone pool (Price >= 15000, distinct brands)
    if (phoneProducts.length < 3) {
      const candidatesMobiles = await Product.find({
        ...baseQuery,
        ...mobileFilter,
        _id: { $nin: Array.from(addedIds) },
        name: { $not: buttonPhoneRegex },
        price: { $gte: 15000 },
      })
        .sort({ price: -1, createdAt: -1 })
        .limit(50)
        .lean();

      for (const mob of candidatesMobiles) {
        if (phoneProducts.length >= 3) break;
        addPhone(mob);
      }
    }

    // Fallback if under 3 phones (Price >= 10000 / 8000)
    if (phoneProducts.length < 3) {
      const fallbackMobiles = await Product.find({
        ...baseQuery,
        ...mobileFilter,
        _id: { $nin: Array.from(addedIds) },
        name: { $not: buttonPhoneRegex },
        price: { $gte: 8000 },
      })
        .sort({ price: -1, createdAt: -1 })
        .limit(30)
        .lean();

      for (const mob of fallbackMobiles) {
        if (phoneProducts.length >= 3) break;
        addPhone(mob);
      }
    }

    // 📺 2. RIGHT SIDE Slot 1: EXACTLY 1 Best / High-Value Trending Smart TV (Category: smart-tv)
    const bestTV = await Product.findOne({
      ...baseQuery,
      ...tvFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 12000 },
    })
      .sort({ price: -1, createdAt: -1 })
      .lean();

    if (bestTV) {
      addRightProduct(bestTV);
    } else {
      const fallbackTV = await Product.findOne({
        ...baseQuery,
        ...tvFilter,
        _id: { $nin: Array.from(addedIds) },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();
      if (fallbackTV) addRightProduct(fallbackTV);
    }

    // ❄️ 3. RIGHT SIDE Slot 2: EXACTLY 1 Best / High-Value Trending Air Conditioner (Category: air-conditioner)
    const bestAC = await Product.findOne({
      ...baseQuery,
      ...acFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 20000 },
    })
      .sort({ price: -1, createdAt: -1 })
      .lean();

    if (bestAC) {
      addRightProduct(bestAC);
    } else {
      const fallbackAC = await Product.findOne({
        ...baseQuery,
        ...acFilter,
        _id: { $nin: Array.from(addedIds) },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();
      if (fallbackAC) addRightProduct(fallbackAC);
    }

    // 💻 4. RIGHT SIDE Slot 3: EXACTLY 1 Best / High-Value Trending Laptop (Category: laptop)
    const bestLaptop = await Product.findOne({
      ...baseQuery,
      ...laptopFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 20000 },
    })
      .sort({ price: -1, createdAt: -1 })
      .lean();

    if (bestLaptop) {
      addRightProduct(bestLaptop);
    } else {
      const fallbackLaptop = await Product.findOne({
        ...baseQuery,
        ...laptopFilter,
        _id: { $nin: Array.from(addedIds) },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();
      if (fallbackLaptop) addRightProduct(fallbackLaptop);
    }

    // 📱 5. RIGHT SIDE Slot 4: EXACTLY 1 Best / High-Value Trending Tablet (Category: tablet)
    const bestTablet = await Product.findOne({
      ...baseQuery,
      ...tabletFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 8000 },
    })
      .sort({ price: -1, createdAt: -1 })
      .lean();

    if (bestTablet) {
      addRightProduct(bestTablet);
    } else {
      const fallbackTablet = await Product.findOne({
        ...baseQuery,
        ...tabletFilter,
        _id: { $nin: Array.from(addedIds) },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();
      if (fallbackTablet) addRightProduct(fallbackTablet);
    }

    // 🎧 6. RIGHT SIDE Slot 5: EXACTLY 1 Trending Accessory / Wearable / Audio (Category: accessories)
    const bestAccessory = await Product.findOne({
      ...baseQuery,
      ...accessoryFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 1500 },
    })
      .sort({ price: -1, createdAt: -1 })
      .lean();

    if (bestAccessory) {
      addRightProduct(bestAccessory);
    } else {
      const fallbackAccessory = await Product.findOne({
        ...baseQuery,
        ...accessoryFilter,
        _id: { $nin: Array.from(addedIds) },
      })
        .sort({ price: -1, createdAt: -1 })
        .lean();
      if (fallbackAccessory) addRightProduct(fallbackAccessory);
    }

    // Combined Array (3 Left Smartphones + 5 Right Category Products = 8 Total Slots)
    let finalProducts = [...phoneProducts, ...rightProducts];

    // 🔄 DYNAMIC FALLBACK: If any slot is empty, fill from other available high-value products
    if (finalProducts.length < 8) {
      const fallbackPool = await Product.find({
        ...baseQuery,
        _id: { $nin: Array.from(addedIds) },
        name: { $not: buttonPhoneRegex },
      })
        .sort({ price: -1, createdAt: -1 })
        .limit(40)
        .lean();

      for (const p of fallbackPool) {
        if (finalProducts.length >= 8) break;
        if (p && p._id && !addedIds.has(String(p._id))) {
          addedIds.add(String(p._id));
          finalProducts.push(p);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: finalProducts.slice(0, 8),
    });
  } catch (error) {
    console.error("Error in /api/home/top-sellers API:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch trending products" },
      { status: 500 }
    );
  }
}
