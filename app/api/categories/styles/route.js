// /api/categories/styles
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const categories = await Category.find({
      status: "Active",
    }).sort({ position: 1 }).lean();

    // 1️⃣ Parent categories
    const parentCategories = categories.filter(
      (cat) => !cat.parentid || cat.parentid === "none"
    );

    const categoryStyles = {};

    parentCategories.forEach((parent) => {
      // 2️⃣ Child categories
      const subCategories = categories.filter(
        (child) => child.parentid_new === parent.md5_cat_name
      );

      categoryStyles[parent.category_slug] = {
        backgroundImage: parent.image || "",
        borderColor: parent.borderColor || "#000000", // optional DB field
        showallCategoryLink: `/category/${parent.category_slug}`,
        subcategoryList: subCategories.map((sub) => ({
          categoryname: sub.category_name,
          category_slug: `/category/${parent.category_slug}/${sub.category_slug}`,
        })),
      };
    });

    return NextResponse.json(categoryStyles, { status: 200 });

  } catch (error) {
    console.error("❌ Category styles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category styles" },
      { status: 500 }
    );
  }
}
