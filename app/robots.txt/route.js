import { NextResponse } from "next/server";

const COMMON_DISALLOWS = [
  "/admin",
  "/api",
  "/cart",
  "/checkout",
  "/order",
  "/profile",
  "/address",
  "/wishlist",
  "/search",
];

const ADSBOT_DISALLOWS = [
  "/checkout",
  "/cart",
  "/order",
  "/api",
];

function buildGroup({ agent, disallow = [], crawlDelay, sitemap }) {
  const lines = [`User-agent: ${agent}`];

  if (crawlDelay) {
    lines.push(`Crawl-delay: ${crawlDelay}`);
  }

  disallow.forEach((path) => {
    lines.push(`Disallow: ${path}`);
  });

  if (sitemap) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  return lines.join("\n");
}

export async function GET(request) {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const origin = new URL(request.url).origin;
  const baseUrl = (envBaseUrl || origin).replace(/\/+$/, "");
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  const robotsTxt = [
    "# robots.txt for Sathya Mobiles",
    "# Sensitive customer, checkout, admin, and internal API routes are blocked from crawlers.",
    "",
    buildGroup({
      agent: "*",
      disallow: COMMON_DISALLOWS,
      sitemap: sitemapUrl,
    }),
    "",
    "# Google Ads crawler can ignore the wildcard section, so keep explicit checkout restrictions.",
    buildGroup({
      agent: "adsbot-google",
      disallow: ADSBOT_DISALLOWS,
    }),
    "",
    buildGroup({
      agent: "Nutch",
      disallow: ["/"],
    }),
    "",
    buildGroup({
      agent: "AhrefsBot",
      crawlDelay: 10,
      disallow: COMMON_DISALLOWS,
      sitemap: sitemapUrl,
    }),
    "",
    buildGroup({
      agent: "AhrefsSiteAudit",
      crawlDelay: 10,
      disallow: COMMON_DISALLOWS,
      sitemap: sitemapUrl,
    }),
    "",
    buildGroup({
      agent: "MJ12bot",
      crawlDelay: 10,
    }),
    "",
    buildGroup({
      agent: "Pinterest",
      crawlDelay: 1,
    }),
    "",
  ].join("\n");

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
