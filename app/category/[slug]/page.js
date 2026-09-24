import CategoryClient from "@/components/category/CategoryComponent";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const { slug } = params;
  const baseUrl = getSiteUrl();

  try {
    const res = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Category Not Found",
        description: "This category does not exist",
      };
    }

    const data = await res.json();
    const category = data.main_category;
    const canonicalUrl = getCanonicalUrl(`/category/${category.category_slug || slug}`);

    return {
      title: category.meta_title || category.category_name,
      description:
        category.meta_description ||
        `Browse products in ${category.category_name}`,
      keywords: category.meta_keyword || "",
      alternates: {
        canonical: canonicalUrl,
      },

      openGraph: {
        title: category.meta_title || category.category_name,
        description: category.meta_description,
        url: canonicalUrl,
        images: category.image ? [`${baseUrl}${category.image}`] : [],
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title: category.meta_title || category.category_name,
        description: category.meta_description,
      },
    };
  } catch {
    return {
      title: "Category",
      description: "Browse products by category",
    };
  }
}

async function getCategoryData(slug) {
  const baseUrl = getSiteUrl();
  try {
    const res = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Page({ params }) {
  const { slug } = params;
  const baseUrl = getSiteUrl();
  const data = await getCategoryData(slug);
  const pageHeading =
    data?.main_category?.category_name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const categorySchema = data?.main_category
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${baseUrl}/category/${data.main_category.category_slug}`,
        name: data.main_category.category_name,
        description:
          data.main_category.meta_description ||
          data.main_category.category_description ||
          "",
        url: `${baseUrl}/category/${data.main_category.category_slug}`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: (data.products || []).slice(0, 50).map((p, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${baseUrl}/product/${p.slug}`,
            name: p.name,
            image:
              p.images?.length > 0
                ? `${baseUrl}/uploads/products/${p.images[0]}`
                : undefined,
          })),
        },
      }
    : null;

  const breadcrumbSchema = data?.main_category
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.main_category.category_name,
            item: `${baseUrl}/category/${data.main_category.category_slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      {categorySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <h1 className="container mx-auto px-4 pt-8 text-xl font-bold text-gray-600 sm:text-3xl">
        {pageHeading}
      </h1>
      <CategoryClient />
    </>
  );
}
