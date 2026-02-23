// /api/categories/menu
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export async function GET() {
  await dbConnect();

  const order = [
    "mobiles",
    "smart-tv",
    "tablets",
    "accessories",
    "laptop-desktops",
     "air-conditioner"
  ];

  const categories = await Category.find({ status: "Active" }).lean();

  // Main categories only
  const mainCategories = categories.filter(
    (cat) => cat.parentid === "none"
  );

  // Safe sorting
  const sortedCategories = mainCategories.sort((a, b) => {
    const indexA = order.indexOf(a.category_slug);
    const indexB = order.indexOf(b.category_slug);

    // If both exist in order array
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one exists in order array
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither exists → fallback to position field
    return (a.position || 0) - (b.position || 0);
  });

  const categoryTree = sortedCategories.map((main) => ({
    ...main,
    subcategories: categories
      .filter((sub) => sub.parentid === main._id.toString())
      .sort((a, b) => (a.position || 0) - (b.position || 0)),
  }));

  return Response.json(categoryTree);
}