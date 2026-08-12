const STORES_PAGE_URL = "https://stores.sathyamobiles.com/";
const STORES_BASE_URL = "https://stores.sathyamobiles.com";

function normalizeStoreUrl(url = "") {
  if (!url) return "";
  return url.startsWith("http") ? url : `${STORES_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function parseStoresFromJsonLd(html) {
  const scriptMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (!scriptMatch) return null;

  const parsed = JSON.parse(scriptMatch[1]);
  const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
  const itemList = graph.find((entry) => entry["@type"] === "ItemList");
  if (!itemList?.itemListElement?.length) return null;

  return itemList.itemListElement.map((item) => {
    const url = normalizeStoreUrl(item.url);
    const slug = url.replace(`${STORES_BASE_URL}/`, "").replace(/\/$/, "");

    return {
      name: String(item.name || "").trim(),
      slug,
      url,
    };
  });
}

function parseStoresFromEmbeddedJson(html) {
  const storesMatch = html.match(/const\s+STORES\s*=\s*(\[[\s\S]*?\]);/);
  if (!storesMatch) return null;

  const stores = JSON.parse(storesMatch[1]);
  return stores.map((store) => ({
    name: String(store.name || "").trim(),
    slug: String(store.slug || "").trim(),
    url: normalizeStoreUrl(store.slug),
    city: String(store.city || "").trim(),
  }));
}

export async function scrapeStoreLocations() {
  const response = await fetch(STORES_PAGE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SathyaMobilesBot/1.0)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch store page (${response.status})`);
  }

  const html = await response.text();
  const jsonLdStores = parseStoresFromJsonLd(html);
  const embeddedStores = parseStoresFromEmbeddedJson(html);
  const stores = (embeddedStores?.length ? embeddedStores : jsonLdStores) || [];

  return stores
    .filter((store) => store.name && store.slug && store.url)
    .sort((a, b) => a.name.localeCompare(b.name));
}
