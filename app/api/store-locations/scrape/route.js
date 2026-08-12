import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import StoreLocation from "@/models/storeLocation";
import { isAdminRequest } from "@/lib/requireAdmin";
import { scrapeStoreLocations } from "@/lib/scrapeStoreLocations";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await dbConnect();

    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const scrapedStores = await scrapeStoreLocations();
    if (!scrapedStores.length) {
      return NextResponse.json(
        { success: false, message: "No stores found to import." },
        { status: 400 }
      );
    }

    const slugs = scrapedStores.map((store) => store.slug);
    await StoreLocation.deleteMany({ slug: { $nin: slugs } });

    let imported = 0;
    for (const store of scrapedStores) {
      await StoreLocation.findOneAndUpdate(
        { slug: store.slug },
        {
          name: store.name,
          slug: store.slug,
          url: store.url,
          city: store.city || "",
          status: "Active",
          source: "stores.sathyamobiles.com",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      imported += 1;
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} store locations.`,
      count: imported,
    });
  } catch (error) {
    console.error("Scrape store locations error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to scrape stores." },
      { status: 500 }
    );
  }
}
