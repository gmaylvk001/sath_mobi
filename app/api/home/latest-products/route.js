import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const excludeParam = searchParams.get("exclude");
    const excludedIds = excludeParam
      ? excludeParam.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    // 🚫 Regex to exclude button/keypad phones
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

    // Fetch category docs from DB to get their exact _id, category_slug, and category_name
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

    // 📱 1. LEFT SIDE (Slots 1, 2, 3): 3 Smartphones (3 Distinct Brands, Price >= 15000, Newest First)
    const candidatesMobiles = await Product.find({
      ...baseQuery,
      ...mobileFilter,
      name: { $not: buttonPhoneRegex },
      price: { $gte: 15000 },
    })
      .sort({ createdAt: -1, price: -1 })
      .limit(30)
      .lean();

    for (const mob of candidatesMobiles) {
      if (phoneProducts.length >= 3) break;
      addPhone(mob);
    }

    // Fallback if under 3 phones >= 15k: get phones >= 10k
    if (phoneProducts.length < 3) {
      const fallbackMobiles = await Product.find({
        ...baseQuery,
        ...mobileFilter,
        _id: { $nin: Array.from(addedIds) },
        name: { $not: buttonPhoneRegex },
        price: { $gte: 10000 },
      })
        .sort({ createdAt: -1, price: -1 })
        .limit(20)
        .lean();

      for (const mob of fallbackMobiles) {
        if (phoneProducts.length >= 3) break;
        addPhone(mob);
      }
    }

    // 📺 2. RIGHT SIDE Slot 1: EXACTLY 1 Latest Smart TV (Category: smart-tv)
    const latestTV = await Product.findOne({
      ...baseQuery,
      ...tvFilter,
      _id: { $nin: Array.from(addedIds) },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (latestTV) addRightProduct(latestTV);

    // ❄️ 3. RIGHT SIDE Slot 2: EXACTLY 1 Latest Air Conditioner (Category: air-conditioner)
    const latestAC = await Product.findOne({
      ...baseQuery,
      ...acFilter,
      _id: { $nin: Array.from(addedIds) },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (latestAC) addRightProduct(latestAC);

    // 💻 4. RIGHT SIDE Slot 3: EXACTLY 1 Latest Laptop (Category: laptop-desktops)
    const latestLaptop = await Product.findOne({
      ...baseQuery,
      ...laptopFilter,
      _id: { $nin: Array.from(addedIds) },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (latestLaptop) addRightProduct(latestLaptop);

    // 📱 5. RIGHT SIDE Slot 4: EXACTLY 1 Latest Tablet (Category: tablets)
    const latestTablet = await Product.findOne({
      ...baseQuery,
      ...tabletFilter,
      _id: { $nin: Array.from(addedIds) },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (latestTablet) addRightProduct(latestTablet);

    // 🎧 6. RIGHT SIDE Slot 5: EXACTLY 1 Latest Accessory / Earbuds (Category: accessories, Price >= 2000)
    const latestAccessory = await Product.findOne({
      ...baseQuery,
      ...accessoryFilter,
      _id: { $nin: Array.from(addedIds) },
      price: { $gte: 2000 },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (latestAccessory) addRightProduct(latestAccessory);

    // Combined Array: 3 Mobiles (Left) + 1 TV + 1 AC + 1 Laptop + 1 Tablet + 1 Accessory = 8 Total Slots
    let finalProducts = [...phoneProducts, ...rightProducts];

    // 🔄 FALLBACK GUARANTEE: If any category (e.g. AC) has 0 stock/eligible items, fill remaining slots from other categories!
    if (finalProducts.length < 8) {
      const fallbackPool = await Product.find({
        ...baseQuery,
        _id: { $nin: Array.from(addedIds) },
        name: { $not: buttonPhoneRegex },
        price: { $gte: 2000 },
      })
        .sort({ createdAt: -1, price: -1 })
        .limit(20)
        .lean();

      for (const p of fallbackPool) {
        if (finalProducts.length >= 8) break;
        if (p && p._id && !addedIds.has(String(p._id))) {
          addedIds.add(String(p._id));
          finalProducts.push(p);
        }
      }
    }

    return NextResponse.json(finalProducts.slice(0, 8));
  } catch (error) {
    console.error("Error fetching latest products:", error);
    return NextResponse.json(
      { message: "Failed to fetch latest products" },
      { status: 500 }
    );
  }
}






