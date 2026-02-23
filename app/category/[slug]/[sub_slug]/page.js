
import CategoryClient from "@/components/category/[slug]/page";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const sub_slug = awaitedParams.sub_slug;
  const slug = awaitedParams.slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${baseUrl}/api/categories/${sub_slug}`, {
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

    return {
      title: category.meta_title || category.category_name,
      description:
        category.meta_description ||
        `Browse products in ${category.category_name}`,
      keywords: category.meta_keyword || "",

      openGraph: {
        title: category.meta_title || category.category_name,
        description: category.meta_description,
        url: `${baseUrl}/category/${slug}/${sub_slug}`,
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

async function getSubCategoryData(sub_slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${baseUrl}/api/categories/${sub_slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Page({ params }) {
  const awaitedParams = await params;
  const sub_slug = awaitedParams.sub_slug;
  const slug = awaitedParams.slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const data = await getSubCategoryData(sub_slug);

  const categorySchema = data?.main_category
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${baseUrl}/category/${slug}/${data.main_category.category_slug}`,
        name: data.main_category.category_name,
        description:
          data.main_category.meta_description ||
          data.main_category.category_description ||
          "",
        url: `${baseUrl}/category/${slug}/${data.main_category.category_slug}`,
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
            name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            item: `${baseUrl}/category/${slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.main_category.category_name,
            item: `${baseUrl}/category/${slug}/${data.main_category.category_slug}`,
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
      <CategoryClient />
    </>
  );
}
