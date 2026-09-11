import BrandComponent from "@/components/brand/BrandComponent";

async function getBrand(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/brand/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.brand || null;
  } catch {
    return null;
  }
}

export default async function Dashboard({ params }) {
  const resolvedParams = await params;
  const brand = await getBrand(resolvedParams.slug);

  return (
    <div>
      {brand?.brand_name && (
        <h1 className="container mx-auto px-4 pt-8 text-2xl sm:text-3xl font-bold text-gray-900">
          {brand.brand_name}
        </h1>
      )}
      <BrandComponent params={resolvedParams} />
    </div>
  );
}