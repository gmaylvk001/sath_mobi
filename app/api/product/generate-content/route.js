import { NextResponse } from "next/server";

function buildPrompt({ category, brand, product_code, product_name }) {
  return `You are an e-commerce product content generator.

Generate product details in valid JSON only.

Product:
{
"Category":"${category}"
"Brand":"${brand}"
"Product Code":"${product_code}"
"Product Name":"${product_name}"
}

Instructions:

1. Return ONLY valid JSON.
2. Do not include markdown.
3. Generate SEO-friendly content.
4. Description should be 150-250 words.
5. Highlights should contain 8 bullet points.
6. Key Features should contain 5 bullet points.
7. Meta title maximum 60 characters.
8. Meta description maximum 160 characters.
9. Meta keywords should be comma separated.

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
