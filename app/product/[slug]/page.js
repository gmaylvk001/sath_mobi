import ProductClient from "./ProductClient";

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isTitleHealthy(title) {
  const cleanTitle = stripHtml(title || "");
  return cleanTitle.length >= 45 && cleanTitle.length <= 60;
}

function isDescriptionHealthy(description) {
  const cleanDescription = stripHtml(description || "");
  return cleanDescription.length >= 120 && cleanDescription.length <= 170;
}

function getFallbackSeo(product, brandName) {
  const productName = product?.name || "Product";
  const safeBrand = brandName || "Sathyamobiles";
  const baseTitle = `${productName} - ${safeBrand}`;

  const title =
    isTitleHealthy(product?.meta_title)
      ? product.meta_title
      : baseTitle.length <= 60
        ? baseTitle
        : `${productName}`.slice(0, 60).trim();

  const descriptionText = stripHtml(
    product?.meta_description ||
      product?.description ||
      `Buy ${productName} online at ${safeBrand} with great deals, reliable delivery, and trusted support.`
  );

  const description =
    isDescriptionHealthy(product?.meta_description)
      ? product.meta_description
      : `${descriptionText.slice(0, 155)}${descriptionText.length > 155 ? "..." : ""}`;

  return {
    title: title.trim(),
    description: description.trim(),
    keywords: product?.search_keywords || `${productName}, ${safeBrand}, online shopping`,
  };
}

function extractTextFromOpenAiResponse(result) {
  if (typeof result?.output_text === "string" && result.output_text.trim()) {
    return result.output_text;
  }

  if (Array.isArray(result?.output)) {
    for (const block of result.output) {
      const text = block?.content?.[0]?.text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }

  return null;
}

async function generateSeoFromOpenAI(product, brandName) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const productName = product?.name || "Product";
  const productCategory = product?.sub_category_name || product?.category_new || "Electronics";
  const productBrand = brandName || product?.brand || "Sathyamobiles";

  const prompt = `You are a product SEO specialist for an Indian e-commerce store.

Return only valid JSON with keys: title, description, keywords.

Rules:
- title: 45-60 characters, SEO-friendly, include product name.
- description: 140-170 characters, include product name, brand, and a key benefit.
- keywords: 8-12 comma-separated search terms.
- product name: ${productName}
- brand: ${productBrand}
- category: ${productCategory}
- tone: clear, commercial, conversion-focused.
- do not include markdown or extra text.

Example format:
{"title":"${productName} Price & Features | ${productBrand}","description":"Shop ${productName} online from ${productBrand} with trusted quality, great value and fast delivery.","keywords":"${productName}, ${productBrand}, buy ${productName}, ${productCategory}, online shopping"}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        input: prompt,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn("OpenAI SEO generation failed:", result?.error?.message || response.statusText);
      return null;
    }

    const rawText = extractTextFromOpenAiResponse(result);
    if (!rawText) return null;

    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleanedText);
    const nextTitle = String(parsed.title || "").trim();
    const nextDescription = String(parsed.description || "").trim();
    const nextKeywords = String(parsed.keywords || "").trim();

    if (!nextTitle || !nextDescription) return null;

    return {
      title: nextTitle,
      description: nextDescription,
      keywords: nextKeywords,
    };
  } catch (error) {
    console.warn("SEO OpenAI generation error:", error.message || error);
    return null;
  }
}

async function resolveProductSeo(product, brandName) {
  const fallback = getFallbackSeo(product, brandName);
  const hasValidTitle = isTitleHealthy(product?.meta_title);
  const hasValidDescription = isDescriptionHealthy(product?.meta_description);

  if (hasValidTitle && hasValidDescription) {
    return {
      title: product.meta_title,
      description: product.meta_description,
      keywords: product.search_keywords || fallback.keywords,
    };
  }

  const aiSeo = await generateSeoFromOpenAI(product, brandName);
  if (aiSeo) {
    return {
      title: aiSeo.title || fallback.title,
      description: aiSeo.description || fallback.description,
      keywords: aiSeo.keywords || fallback.keywords,
    };
  }

  return fallback;
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseUrl}/api/product/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        title: "Product not found",
        description: "This product is unavailable",
      };
    }

    const product = await response.json();
    const brandName = product.brand
      ? (await fetch(`${baseUrl}/api/brand/get`, { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.success && Array.isArray(data.brands)) {
              const brand = data.brands.find((item) => String(item.id) === String(product.brand));
              return brand?.brand_name || null;
            }
            return null;
          }))
      : null;

    const seo = await resolveProductSeo(product, brandName);
    const image =
      product.images?.length > 0
        ? `${baseUrl}/uploads/products/${product.images[0]}`
        : `${baseUrl}/no-image.jpg`;

    return {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,

      openGraph: {
        title: seo.title,
        description: seo.description,
        url: `${baseUrl}/product/${slug}`,
        images: [image],
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
        images: [image],
      },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return {
      title: "Product",
      description: "Buy products online",
    };
  }
}

async function getProductData(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${baseUrl}/api/product/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getBrandName(brandId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${baseUrl}/api/brand/get`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.brands) {
      const brand = data.brands.find((b) => b.id === brandId);
      return brand?.brand_name || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function getReviewData(productId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${baseUrl}/api/reviews/${productId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProductNew({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const product = await getProductData(slug);

  let brandName = null;
  let reviewData = null;

  if (product) {
    const [brandResult, reviewResult] = await Promise.all([
      product.brand ? getBrandName(product.brand) : Promise.resolve(null),
      product._id ? getReviewData(product._id) : Promise.resolve(null),
    ]);
    brandName = brandResult;
    reviewData = reviewResult;
  }

  // Build Product schema
  const productSchema = product
    ? (() => {
        const sellingPrice = Number(product.special_price) || Number(product.price) || 0;
        const originalPrice = Number(product.price) || 0;
        const hasDiscount = Number(product.special_price) > 0 && Number(product.price) > Number(product.special_price);

        const images = (product.images || [])
          .filter((img) => img && img.trim() !== "" && img.trim().toLowerCase() !== "null")
          .map((img) =>
            img.startsWith("http") ? img : `${baseUrl}/uploads/products/${img}`
          );

        const description =
          product.meta_description ||
          product.description?.replace(/<[^>]*>/g, "").slice(0, 5000) ||
          product.name;

        const schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: description,
          url: `${baseUrl}/product/${product.slug}`,
          image: images.length > 0 ? images : [`${baseUrl}/no-image.jpg`],
          sku: product.sku || product.item_code || product._id,
          offers: {
            "@type": "Offer",
            url: `${baseUrl}/product/${product.slug}`,
            priceCurrency: "INR",
            price: sellingPrice,
            availability:
              product.stock_status === "In Stock" && product.quantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: {
              "@type": "Organization",
              name: "Sathya Mobiles",
            },
          },
        };

        // Add brand if available
        if (brandName) {
          schema.brand = {
            "@type": "Brand",
            name: brandName,
          };
        }

        // Add aggregate rating if reviews exist
        if (
          reviewData &&
          reviewData.totalReviews > 0 &&
          Number(reviewData.averageRating) > 0
        ) {
          schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: reviewData.averageRating,
            reviewCount: reviewData.totalReviews,
            bestRating: 5,
            worstRating: 1,
          };
        }

        // Add individual reviews if available
        if (reviewData?.reviews?.length > 0) {
          schema.review = reviewData.reviews.map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.reviews_rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              "@type": "Person",
              name: r.user_id?.name || "Customer",
            },
          }));
        }

        return schema;
      })()
    : null;

  // Build Breadcrumb schema
  const breadcrumbSchema = product
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
          ...(product.sub_category_name
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: product.sub_category_name,
                  item: `${baseUrl}/category/${product.category_new || ""}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.name,
                  item: `${baseUrl}/product/${product.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: product.name,
                  item: `${baseUrl}/product/${product.slug}`,
                },
              ]),
        ],
      }
    : null;

  const pageHeading = product?.name || "Product Details";

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <h1 className="container mx-auto px-4 pt-6 text-2xl font-bold text-gray-900 sm:text-4xl">
        {pageHeading}
      </h1>
      <ProductClient initialProduct={product} />
    </>
  );
}
