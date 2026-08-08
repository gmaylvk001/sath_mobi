import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import PrebookCampaign from "@/models/PrebookCampaign";
import PrebookLanding from "@/components/prebook/PrebookLanding";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  const campaign = await PrebookCampaign.findOne({
    slug,
    status: "Active",
  })
    .select({ product_name: 1, product_details: 1 })
    .lean();

  if (!campaign) {
    return { title: "Pre-booking Not Found" };
  }

  return {
    title: `Pre-book ${campaign.product_name}`,
    description:
      campaign.product_details?.slice(0, 160) ||
      `Pre-book ${campaign.product_name} online.`,
  };
}

export default async function ProductPrebookPage({ params }) {
  const { slug } = await params;
  await dbConnect();
  const campaign = await PrebookCampaign.findOne({
    slug,
    status: "Active",
  }).lean();

  if (!campaign) notFound();

  return (
    <PrebookLanding
      campaign={{
        product_name: campaign.product_name,
        product_details: campaign.product_details,
        banner_image: campaign.banner_image,
        mobile_banner_image: campaign.mobile_banner_image,
        detail_images: campaign.detail_images || [],
      }}
    />
  );
}
