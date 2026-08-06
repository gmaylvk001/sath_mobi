"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductComponent from "@/app/admin/components/product/create";
import { generateProductSlug } from "@/utils/combinations";

function buildInitialProductData(newProduct, ai = {}) {
  const keyFeatures = Array.isArray(ai.key_features)
    ? ai.key_features.map((feature) => `• ${feature}`).join("\n")
    : ai.key_features || "";

  const name = ai.product_name || newProduct.name || newProduct.item_description || "";

  return {
    name,
    slug: generateProductSlug(name),
    item_code: newProduct.item_code || "",
    brand_code: newProduct.brand_code || ai.product_code || "",
    price: newProduct.price ?? "",
    special_price: newProduct.special_price ?? "",
    quantity: newProduct.quantity ?? "",
    description: ai.description || "",
    product_highlights: Array.isArray(ai.highlights) ? ai.highlights : [],
    key_specifications: keyFeatures,
    meta_title: ai.meta_title || "",
    meta_description: ai.meta_description || "",
    search_keywords: ai.meta_keywords || "",
    brandName: ai.brand || newProduct.brand || "",
    categoryName: ai.category || newProduct.group_property || newProduct.brand || "",
  };
}

function CreateProductContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [initialProductData, setInitialProductData] = useState(null);
  const [loading, setLoading] = useState(source === "newproduct");
  const [ready, setReady] = useState(source !== "newproduct");

  useEffect(() => {
    if (source !== "newproduct") return;

    const stored = sessionStorage.getItem("newProductUploadData");
    if (!stored) {
      toast.error("No new product data found. Please upload from the new products list.");
      setLoading(false);
      setReady(true);
      return;
    }

    let newProduct;
    try {
      newProduct = JSON.parse(stored);
    } catch {
      toast.error("Invalid product data.");
      sessionStorage.removeItem("newProductUploadData");
      setLoading(false);
      setReady(true);
      return;
    }

    sessionStorage.removeItem("newProductUploadData");

    async function generateContent() {
      try {
        const response = await fetch("/api/product/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: newProduct.group_property || newProduct.brand || "",
            brand: newProduct.brand || "",
            product_code: newProduct.brand_code || newProduct.item_code || "",
            product_name: newProduct.name || newProduct.item_description || "",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate product content.");
        }

        setInitialProductData(buildInitialProductData(newProduct, data.content));
        toast.success("Product content generated successfully.");
      } catch (error) {
        toast.error(error.message || "AI generation failed. Basic fields were prefilled.");
        setInitialProductData(buildInitialProductData(newProduct));
      } finally {
        setLoading(false);
        setReady(true);
      }
    }

    generateContent();
  }, [source]);

  if (loading) {
    return (
      <div className="px-2 py-16 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent mb-4" />
        <p className="text-gray-700 font-medium">Generating product content with AI...</p>
        <p className="text-sm text-gray-500 mt-1">This may take a few seconds.</p>
      </div>
    );
  }

  if (!ready) return null;

  return <ProductComponent initialProductData={initialProductData} />;
}

export default function CreateProductPage() {
  return (
    <div className="px-2">
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense
        fallback={
          <div className="py-16 text-center text-gray-600">Loading create product page...</div>
        }
      >
        <CreateProductContent />
      </Suspense>
    </div>
  );
}
