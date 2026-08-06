import { buildSitemapIndexXml, xmlResponse } from "@/lib/sitemap";

export async function GET() {
  try {
    const sitemap = await buildSitemapIndexXml();
    return xmlResponse(sitemap, 3600);
  } catch (error) {
    console.error("Sitemap index error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
