import Script from "next/script";

export default function CategorySchema({ category, products }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/category/${category.category_slug}`,
    name: category.category_name,
    description: category.category_description || "",
    url: `${baseUrl}/category/${category.category_slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/product/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <Script
      id="category-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}