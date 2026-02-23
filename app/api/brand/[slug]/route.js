import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import Category from "@/models/ecom_category_info";

/**
 * Build category tree but only keep categories
 * that exist in productCategoryIds
 */
async function getCategoryTree(parentId, productCategoryIds) {
  const categories = await Category.find({ parentid: parentId }).lean();
  const tree = [];

  for (const category of categories) {
    const children = await getCategoryTree(category._id, productCategoryIds);

    if (
      productCategoryIds.has(category._id.toString()) ||
      children.length > 0
    ) {
      tree.push({
        ...category,
        subCategories: children
      });
    }
  }

  return tree;
}

export async function GET(request, { params }) {
  try {
    await dbConnect();

    //const { slug } = params;
    const awaitedParams = await params;
    const slug = awaitedParams.slug;

    /* ---------------- BRAND ---------------- */
    const brand = await Brand.findOne({ brand_slug: slug }).lean();
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    /* ---------------- PRODUCTS ---------------- */
    const products = await Product.find({ brand: brand._id, status:"Active" })

    if (!products.length) {
      return Response.json({
        brand,
        products: [],
        categories: [],
        filters: []
      });
    }

    /* ---------------- CATEGORIES ---------------- */
    // Collect ALL category IDs used by products
    const productCategoryIds = new Set(
      products.flatMap(p =>
        [p.category, p.sub_category].filter(Boolean).map(String)
      )
    );

    // Find root categories (parentid = null / 0 depending on schema)
    const rootCategories = await Category.find({
      parentid: null
    }).lean();

    const categoryTree = [];
    for (const root of rootCategories) {
      const children = await getCategoryTree(root._id, productCategoryIds);
      if (
        productCategoryIds.has(root._id.toString()) ||
        children.length > 0
      ) {
        categoryTree.push({
          ...root,
          subCategories: children
        });
      }
    }

    /* ---------------- FILTERS ---------------- */
    const productIds = products.map(p => p._id);

    const productFilters = await ProductFilter.find({
      product_id: { $in: productIds }
    }).lean();

    const filterIds = [...new Set(productFilters.map(pf => pf.filter_id))];

    const filters = await Filter.find({ _id: { $in: filterIds } })
      .populate({
        path: "filter_group",
        model: FilterGroup,
        select: "filtergroup_name"
      })
      .lean();

    const formattedFilters = filters.map(filter => ({
      ...filter,
      filter_group_name: filter.filter_group?.filtergroup_name || "No Group",
      filter_group_id: filter.filter_group?._id || null
    }));

    /* ---------------- RESPONSE ---------------- */
    return Response.json({
      brand,
      products,
      categories: categoryTree,
      filters: formattedFilters
    });

  } catch (error) {
    console.error("Brand page error:", error);
    return Response.json(
      { error: "Error fetching brand details" },
      { status: 500 }
    );
  }
}