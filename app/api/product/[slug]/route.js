// app/api/product/[slug]/route.js
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import fs from "node:fs";
import path from "node:path";

function keepAvailableImage(image) {
  if (typeof image !== "string" || !image.trim()) return false;

  const value = image.trim();
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return true;

  return fs.existsSync(path.join(process.cwd(), "public", "uploads", "products", value));
}

export async function GET(request, context) {
  const { params } = await context;
  const { slug } = await params;
  await dbConnect();

  if (!slug) {
    return new Response(JSON.stringify({ message: "Missing product slug" }), {
      status: 400,
    });
  }

  try {
    const product = await Product.findOne({ slug });

    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }

    const productData = product.toObject();
    productData.images = Array.isArray(productData.images)
      ? productData.images.filter(keepAvailableImage)
      : [];

    return new Response(JSON.stringify(productData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
