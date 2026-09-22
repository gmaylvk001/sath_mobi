import { NextResponse } from "next/server";

function buildPrompt({ category, brand, product_code, product_name }) {
  return `You are an e-commerce SEO copywriter for a mobile and electronics store.

Generate product metadata in valid JSON only.

Product context:
{
  "Category":"${category}",
  "Brand":"${brand}",
  "Product Code":"${product_code}",
  "Product Name":"${product_name}"
}

Instructions:
1. Return ONLY valid JSON and no markdown fences.
2. Use the product name naturally in all SEO copy.
3. Optimize for Google search and product discoverability.
4. Title should be between 45 and 60 characters, SEO-friendly, and not too short or too long.
5. Meta description should be between 140 and 170 characters, persuasive, and include the product name, brand, and key benefit.
6. Description should be useful, human-readable, and around 150-220 words.
7. Highlights should contain exactly 6 strong bullet points.
8. Key features should contain exactly 5 product benefit points.
9. Keywords should be a comma-separated list with 8-12 relevant terms.
10. Keep values concise, commercially useful, and specific to the product.
11. Do not repeat the same keyword multiple times.
12. Avoid generic filler like "best quality" or "premium product" unless relevant.

JSON format:
{
  "category":"",
  "brand":"",
  "product_code":"",
  "product_name":"",
  "description":"",
  "highlights":[],
  "key_features":[],
  "meta_title":"",
  "meta_description":"",
  "meta_keywords":""
}`;
}

function extractGeneratedText(result) {
  if (!result?.output?.length) return null;

  for (const block of result.output) {
    const text = block?.content?.[0]?.text;
    if (text) return text;
  }

  return null;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const category = body.category || "";
    const brand = body.brand || "";
    const product_code = body.product_code || "";
    const product_name = body.product_name || "";

    if (!product_name && !product_code) {
      return NextResponse.json(
        { error: "Product name or product code is required." },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o";
    const prompt = buildPrompt({ category, brand, product_code, product_name });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
      return NextResponse.json(
        { error: result?.error?.message || "OpenAI request failed." },
        { status: response.status }
      );
    }

    const rawText = extractGeneratedText(result);
    if (!rawText) {
      return NextResponse.json(
        { error: "No content returned from OpenAI." },
        { status: 502 }
      );
    }

    const content =
      typeof rawText === "string" ? JSON.parse(rawText) : rawText;

    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    console.error("Error generating product content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate product content." },
      { status: 500 }
    );
  }
}
