import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Blog from "@/models/ecom_blog_info";
import StoreLocation from "@/models/storeLocation";

const STATIC_PAGES = [
  { path: "", changefreq: "weekly", priority: "0.9" },
  { path: "/aboutus", changefreq: "weekly", priority: "0.9" },
  { path: "/all-stores", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "weekly", priority: "0.9" },
  { path: "/privacypolicy", changefreq: "weekly", priority: "0.9" },
  { path: "/cancellation-refund-policy", changefreq: "weekly", priority: "0.9" },
  { path: "/terms-and-condition", changefreq: "weekly", priority: "0.9" },
  { path: "/shipping", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.9" },
  { path: "/faq", changefreq: "weekly", priority: "0.9" },
  { path: "/category", changefreq: "weekly", priority: "0.8" },
];

export function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }
  return baseUrl.replace(/\/$/, "");
}

export function formatLastMod(date) {
  return new Date(date || Date.now()).toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildUrlEntry({ loc, lastmod, changefreq = "weekly", priority = "0.8" }) {
  const parts = [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${formatLastMod(lastmod)}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean);

  return parts.join("\n");
}

export function buildUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

export function buildSitemapIndex(items) {
  const entries = items.map(
    (item) => `  <sitemap>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${formatLastMod(item.lastmod)}</lastmod>
  </sitemap>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
}

export function xmlResponse(body, maxAge = 3600) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}`,
    },
  });
}

function sliceByRange(items, from, to) {
  const start = Math.max(0, (from || 1) - 1);
  const end = to ? Math.min(items.length, to) : items.length;
  return items.slice(start, end);
}

async function getDescendantCategoryIds(categoryId) {
  const id = String(categoryId);
  const children = await Category.find({ parentid: id }, { _id: 1 }).lean();
  let ids = [id];

  for (const child of children) {
    const childIds = await getDescendantCategoryIds(child._id);
    ids = ids.concat(childIds);
  }

  return ids;
}

async function getCategoryBrandEntries(baseUrl) {
  const mainCategories = await Category.find(
    {
      parentid: "none",
      category_slug: { $exists: true, $ne: "" },
      status: "Active",
    },
    { category_slug: 1, updatedAt: 1 }
  ).lean();

  const entries = [];
  const seen = new Set();

  for (const mainCategory of mainCategories) {
    const categoryIds = await getDescendantCategoryIds(mainCategory._id);
    const products = await Product.find(
      { category: { $in: categoryIds }, status: "Active" },
      { brand: 1 }
    ).lean();

    const brandIds = [
      ...new Set(products.map((product) => product.brand).filter(Boolean)),
    ];
    if (!brandIds.length) continue;

    const brands = await Brand.find(
      {
        _id: { $in: brandIds },
        brand_slug: { $exists: true, $ne: "" },
        status: "Active",
      },
      { brand_slug: 1, updatedAt: 1 }
    ).lean();

    for (const brand of brands) {
      const key = `${mainCategory.category_slug}::${brand.brand_slug}`;
      if (seen.has(key)) continue;
      seen.add(key);

      entries.push(
        buildUrlEntry({
          loc: `${baseUrl}/category/brand/${mainCategory.category_slug}/${brand.brand_slug}`,
          lastmod: brand.updatedAt || mainCategory.updatedAt,
          changefreq: "weekly",
          priority: "0.7",
        })
      );
    }
  }

  return entries;
}

async function getBrandSitemapCount() {
  const standaloneBrands = await Brand.countDocuments({
    brand_slug: { $exists: true, $ne: "" },
    status: "Active",
  });

  const categoryBrandEntries = await getCategoryBrandEntries("");
  return standaloneBrands + categoryBrandEntries.length;
}

function buildCategoryPath(category, categoryMap) {
  if (!category?.category_slug) return null;

  if (!category.parentid || category.parentid === "none") {
    return `/category/${category.category_slug}`;
  }

  const parent = categoryMap.get(String(category.parentid));
  if (!parent) {
    return `/category/${category.category_slug}`;
  }

  const parentPath = buildCategoryPath(parent, categoryMap);
  return `${parentPath}/${category.category_slug}`;
}

async function getPageEntries(baseUrl) {
  const now = new Date();
  return STATIC_PAGES.map((page) =>
    buildUrlEntry({
      loc: `${baseUrl}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority,
    })
  );
}

async function getCategoryEntries(baseUrl) {
  const categories = await Category.find(
    { category_slug: { $exists: true, $ne: "" }, status: "Active" },
    { category_slug: 1, parentid: 1, updatedAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .lean();

  const categoryMap = new Map(
    categories.map((category) => [category._id.toString(), category])
  );

  return categories
    .map((category) => {
      const path = buildCategoryPath(category, categoryMap);
      if (!path) return null;

      const isRoot = !category.parentid || category.parentid === "none";
      return buildUrlEntry({
        loc: `${baseUrl}${path}`,
        lastmod: category.updatedAt,
        changefreq: "weekly",
        priority: isRoot ? "0.8" : "0.7",
      });
    })
    .filter(Boolean);
}

async function getBrandEntries(baseUrl) {
  const brands = await Brand.find(
    { brand_slug: { $exists: true, $ne: "" }, status: "Active" },
    { brand_slug: 1, updatedAt: 1 }
  )
    .sort({ brand_slug: 1 })
    .lean();

  const standaloneEntries = brands.map((brand) =>
    buildUrlEntry({
      loc: `${baseUrl}/brand/${brand.brand_slug}`,
      lastmod: brand.updatedAt,
      changefreq: "weekly",
      priority: "0.7",
    })
  );

  const categoryBrandEntries = await getCategoryBrandEntries(baseUrl);

  return [...standaloneEntries, ...categoryBrandEntries];
}

async function getStoreEntries() {
  const stores = await StoreLocation.find(
    { url: { $exists: true, $ne: "" }, status: "Active" },
    { url: 1, updatedAt: 1 }
  )
    .sort({ name: 1 })
    .lean();

  return stores.map((store) =>
    buildUrlEntry({
      loc: store.url,
      lastmod: store.updatedAt,
      changefreq: "weekly",
      priority: "0.7",
    })
  );
}

async function getBlogEntries(baseUrl) {
  const blogs = await Blog.find(
    { blog_slug: { $exists: true, $ne: "" }, status: "Active" },
    { blog_slug: 1, updatedAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .lean();

  return blogs.map((blog) =>
    buildUrlEntry({
      loc: `${baseUrl}/blog/${blog.blog_slug}`,
      lastmod: blog.updatedAt,
      changefreq: "weekly",
      priority: "0.7",
    })
  );
}

async function getProductEntries(baseUrl) {
  const products = await Product.find(
    { slug: { $exists: true, $ne: "" }, status: "Active" },
    { slug: 1, updatedAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .lean();

  return products.map((product) =>
    buildUrlEntry({
      loc: `${baseUrl}/product/${product.slug}`,
      lastmod: product.updatedAt,
      changefreq: "daily",
      priority: "0.8",
    })
  );
}

const ENTRY_FETCHERS = {
  pages: getPageEntries,
  categories: getCategoryEntries,
  brands: getBrandEntries,
  stores: getStoreEntries,
  blogs: getBlogEntries,
  products: getProductEntries,
};

export async function getSitemapCounts() {
  await dbConnect();

  const [categories, brands, stores, blogs, products] = await Promise.all([
    Category.countDocuments({ category_slug: { $exists: true, $ne: "" }, status: "Active" }),
    getBrandSitemapCount(),
    StoreLocation.countDocuments({ url: { $exists: true, $ne: "" }, status: "Active" }),
    Blog.countDocuments({ blog_slug: { $exists: true, $ne: "" }, status: "Active" }),
    Product.countDocuments({ slug: { $exists: true, $ne: "" }, status: "Active" }),
  ]);

  return {
    pages: STATIC_PAGES.length,
    categories,
    brands,
    stores,
    blogs,
    products,
  };
}

export async function buildSitemapIndexXml() {
  const baseUrl = getBaseUrl();
  const counts = await getSitemapCounts();
  const lastmod = new Date();

  const subSitemaps = [
    { name: "pages", count: counts.pages, withRange: false },
    { name: "categories", count: counts.categories, withRange: true },
    { name: "brands", count: counts.brands, withRange: true },
    { name: "stores", count: counts.stores, withRange: true },
    { name: "blogs", count: counts.blogs, withRange: true },
    { name: "products", count: counts.products, withRange: true },
  ];

  const items = subSitemaps.map(({ name, count, withRange }) => {
    const rangeQuery =
      withRange && count > 0 ? `?from=1&to=${count}` : withRange ? "?from=1&to=0" : "";

    return {
      loc: `${baseUrl}/sitemap_${name}_1.xml${rangeQuery}`,
      lastmod,
    };
  });

  return buildSitemapIndex(items);
}

export function createSubSitemapHandler(type) {
  return async function GET(request) {
    try {
      const baseUrl = getBaseUrl();
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const from = Number.parseInt(searchParams.get("from") || "1", 10);
      const to = Number.parseInt(searchParams.get("to") || "0", 10);

      const fetchEntries = ENTRY_FETCHERS[type];
      if (!fetchEntries) {
        return new Response("Not Found", { status: 404 });
      }

      let entries = await fetchEntries(baseUrl);

      if (type !== "pages" && to > 0) {
        entries = sliceByRange(entries, from, to);
      }

      return xmlResponse(buildUrlSet(entries), type === "products" ? 3600 : 86400);
    } catch (error) {
      console.error(`Sitemap ${type} error:`, error);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}
