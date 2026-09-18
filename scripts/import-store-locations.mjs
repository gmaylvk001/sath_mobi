import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { scrapeStoreLocations } from "../lib/scrapeStoreLocations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

const StoreLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    url: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    source: { type: String, default: "stores.sathyamobiles.com" },
  },
  { timestamps: true }
);

const StoreLocation =
  mongoose.models.StoreLocation ||
  mongoose.model("StoreLocation", StoreLocationSchema);

async function importStoreLocations() {
  loadEnv();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const scrapedStores = await scrapeStoreLocations();

  if (!scrapedStores.length) {
    throw new Error("No stores scraped from stores.sathyamobiles.com");
  }

  const slugs = scrapedStores.map((store) => store.slug);
  await StoreLocation.deleteMany({ slug: { $nin: slugs } });

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
  }

  console.log(`Imported ${scrapedStores.length} store locations.`);
  await mongoose.disconnect();
}

importStoreLocations().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
