import Script from "next/script";

export default function CategoryBreadcrumbSchema({ category }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const schema = {
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
        name: category.category_name,
        item: `${baseUrl}/category/${category.category_slug}`,
      },
    ],
  };

  return (
    <Script
      id="category-breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}