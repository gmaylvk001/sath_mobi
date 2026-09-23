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

function fitText(value, minLength, maxLength, suffix = "") {
  let text = stripHtml(value);

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  }

  if (text.length < minLength && suffix) {
    const available = maxLength - text.length - 1;
    if (available > 0) text = `${text} ${suffix.slice(0, available)}`.trim();
  }

  return text;
}

function getProductSeo(product, brandName) {
  const productName = product?.name || "Product";
  const safeBrand = brandName || "Sathyamobiles";
  const category = stripHtml(product?.sub_category_name || product?.category_new || "electronics");
  const price = Number(product?.special_price || product?.price);
  const priceText = Number.isFinite(price) && price > 0 ? ` at Rs. ${price}` : "";

  const storedTitle = stripHtml(product?.meta_title);
  const titleCandidates = [
    storedTitle,
    `${productName} - Buy Online | ${safeBrand}`,
    `Buy ${productName} Online | ${safeBrand}`,
    `${productName} Price & Details | ${safeBrand}`,
  ].filter(Boolean);
  const title =
    titleCandidates.find((candidate) => isTitleHealthy(candidate)) ||
    fitText(`Buy ${productName} Online | ${safeBrand}`, 45, 60, "Shop Now");

  const storedDescription = stripHtml(product?.meta_description);
  const description = isDescriptionHealthy(storedDescription)
    ? storedDescription
    : fitText(
        `Buy ${productName}${priceText} online at ${safeBrand}. Explore ${category} features, product details, pricing, secure payment, and reliable delivery for your next purchase.`,
        140,
        170,
        "Shop confidently today."
      );

  return {
    title: title.trim(),
    description: description.trim(),
    keywords: product?.search_keywords || `${productName}, ${safeBrand}, online shopping`,
  };
}

function resolveProductSeo(product, brandName) {
  const fallback = getProductSeo(product, brandName);
  const hasValidTitle = isTitleHealthy(product?.meta_title);
  const hasValidDescription = isDescriptionHealthy(product?.meta_description);

  if (hasValidTitle && hasValidDescription) {
    return {
      title: product.meta_title,
      description: product.meta_description,
      keywords: product.search_keywords || fallback.keywords,
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

    const seo = resolveProductSeo(product, brandName);
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
      
      <ProductClient initialProduct={product} />
      <h1 className="container mx-auto px-4 pt-6 text-2xl font-bold text-gray-900 sm:text-4xl">
        &nbsp;
      </h1>
    </>
  );
}
