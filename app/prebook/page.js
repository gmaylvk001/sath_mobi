import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/db";
import PrebookCampaign from "@/models/PrebookCampaign";
import { generateProductSlug } from "@/utils/combinations";

export const dynamic = "force-dynamic";

async function ensureSlug(campaign) {
  if (campaign.slug) return campaign.slug;

  const baseSlug =
    generateProductSlug(campaign.product_name) || `prebook-${campaign._id}`;
  let slug = baseSlug;
  let suffix = 2;

  while (await PrebookCampaign.exists({ slug, _id: { $ne: campaign._id } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  campaign.slug = slug;
  await campaign.save();
  return slug;
}

export default async function PrebookPage() {
  await dbConnect();
  const campaigns = await PrebookCampaign.find({ status: "Active" }).sort({
    updatedAt: -1,
  });

  if (campaigns.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            No active pre-booking
          </h1>
          <p className="mt-2 text-gray-600">
            Please check back later for upcoming products.
          </p>
        </div>
      </main>
    );
  }

  const campaignCards = await Promise.all(
    campaigns.map(async (campaign) => ({
      id: campaign._id.toString(),
      slug: await ensureSlug(campaign),
      product_name: campaign.product_name,
      product_details: campaign.product_details,
      banner_image: campaign.banner_image,
    }))
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Product Pre-booking
          </h1>
          <p className="mt-2 text-gray-600">
            Select a product to view details and submit your pre-booking.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaignCards.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/prebook/${campaign.slug}`}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Image
                src={campaign.banner_image}
                alt={campaign.product_name}
                width={700}
                height={360}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {campaign.product_name}
                </h2>
                {campaign.product_details && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {campaign.product_details}
                  </p>
                )}
                <span className="mt-4 inline-block font-semibold text-red-600">
                  Pre-book now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
