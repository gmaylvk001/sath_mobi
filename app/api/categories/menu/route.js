// /api/categories/menu
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info";

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

  const [categories, allBrands, allProducts] = await Promise.all([
    Category.find({ status: "Active" }).lean(),
    Brand.find({ status: "Active" }).lean(),
    Product.find({ status: "Active" }).select("category sub_category brand sub_category_new").lean()
  ]);

  // Create brand lookups
  const brandMap = new Map();
  allBrands.forEach((b) => {
    brandMap.set(b._id.toString(), b);
    if (b.brand_slug) brandMap.set(b.brand_slug, b);
    if (b.brand_name) brandMap.set(b.brand_name.toLowerCase(), b);
  });

  // Main categories only
  const mainCategories = categories.filter(
    (cat) => cat.parentid === "none"
  );

  // Safe sorting
  const sortedCategories = mainCategories.sort((a, b) => {
    const indexA = order.indexOf(a.category_slug);
    const indexB = order.indexOf(b.category_slug);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return (a.position || 0) - (b.position || 0);
  });

  const categoryTree = sortedCategories.map((main) => {
    const mainIdStr = main._id.toString();

    const subcategories = categories
      .filter((sub) => sub.parentid === mainIdStr)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((sub) => {
        const subIdStr = sub._id.toString();

        // Find products belonging to this subcategory
        const subProds = allProducts.filter(
          (p) =>
            p.sub_category === subIdStr ||
            p.category === subIdStr ||
            (p.sub_category_new && sub.md5_cat_name && p.sub_category_new.includes(sub.md5_cat_name))
        );

        // Collect unique brands from these products
        const subBrandSet = new Map();
        subProds.forEach((p) => {
          if (!p.brand) return;
          const bObj = brandMap.get(p.brand.toString()) || brandMap.get(p.brand.toString().toLowerCase());
          if (bObj && !subBrandSet.has(bObj._id.toString())) {
            subBrandSet.set(bObj._id.toString(), {
              _id: bObj._id,
              brand_name: bObj.brand_name,
              brand_slug: bObj.brand_slug,
              image: bObj.image || ""
            });
          }
        });

        return {
          ...sub,
          brands: Array.from(subBrandSet.values())
        };
      });

    // Collect all products belonging to main category or its subcategories
    const subCatIds = subcategories.map((s) => s._id.toString());
    const allCatIds = new Set([mainIdStr, ...subCatIds]);

    const mainProds = allProducts.filter(
      (p) =>
        allCatIds.has(p.category) ||
        allCatIds.has(p.sub_category) ||
        (p.sub_category_new && main.md5_cat_name && p.sub_category_new.includes(main.md5_cat_name))
    );

    const mainBrandSet = new Map();
    mainProds.forEach((p) => {
      if (!p.brand) return;
      const bObj = brandMap.get(p.brand.toString()) || brandMap.get(p.brand.toString().toLowerCase());
      if (bObj && !mainBrandSet.has(bObj._id.toString())) {
        mainBrandSet.set(bObj._id.toString(), {
          _id: bObj._id,
          brand_name: bObj.brand_name,
          brand_slug: bObj.brand_slug,
          image: bObj.image || ""
        });
      }
    });

    return {
      ...main,
      subcategories,
      brands: Array.from(mainBrandSet.values())
    };
  });

  return Response.json(categoryTree);
}