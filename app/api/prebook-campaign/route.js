import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import dbConnect from "@/lib/db";
import PrebookCampaign from "@/models/PrebookCampaign";
import { isAdminRequest } from "@/lib/requireAdmin";
import { generateProductSlug } from "@/utils/combinations";

export const dynamic = "force-dynamic";

const uploadDir = path.join(process.cwd(), "public", "uploads", "prebook");

async function createUniqueSlug(productName, excludeId = null) {
  const baseSlug = generateProductSlug(productName) || `prebook-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (
    await PrebookCampaign.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function ensureCampaignSlugs(campaigns) {
  for (const campaign of campaigns) {
    if (!campaign.slug) {
      campaign.slug = await createUniqueSlug(campaign.product_name, campaign._id);
      await campaign.save();
    }
  }
}

async function saveImage(file) {
  if (!file || file.size === 0) return "";

  if (!file.type?.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await sharp(buffer).metadata();
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(file.name).toLowerCase() || ".webp";
  const safeName = path
    .basename(file.name, extension)
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-");
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${safeName}${extension}`;

  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/prebook/${filename}`;
}

async function deleteImage(imageUrl) {
  if (!imageUrl?.startsWith("/uploads/prebook/")) return;

  try {
    await unlink(path.join(process.cwd(), "public", imageUrl));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Unable to remove old prebook image:", error);
    }
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const campaignDocuments = await PrebookCampaign.find({}).sort({ updatedAt: -1 });
    await ensureCampaignSlugs(campaignDocuments);
    const campaigns = campaignDocuments.map((campaign) => campaign.toObject());
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const productName = String(formData.get("product_name") || "").trim();
    const productDetails = String(formData.get("product_details") || "").trim();
    const status = formData.get("status") === "Inactive" ? "Inactive" : "Active";
    const banner = formData.get("banner_image");
    const mobileBanner = formData.get("mobile_banner_image");
    const detailFiles = formData
      .getAll("detail_images")
      .filter((file) => file && file.size > 0);

    if (!productName) {
      return NextResponse.json(
        { success: false, message: "Product name is required." },
        { status: 400 }
      );
    }
    if (!banner || banner.size === 0) {
      return NextResponse.json(
        { success: false, message: "Banner image is required." },
        { status: 400 }
      );
    }

    const bannerImage = await saveImage(banner);
    const mobileBannerImage = await saveImage(mobileBanner);
    const detailImages = [];
    for (const file of detailFiles) {
      detailImages.push(await saveImage(file));
    }

    const campaign = await PrebookCampaign.create({
      product_name: productName,
      slug: await createUniqueSlug(productName),
      product_details: productDetails,
      banner_image: bannerImage,
      mobile_banner_image: mobileBannerImage,
      detail_images: detailImages,
      status,
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error) {
    console.error("Create prebook campaign error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unable to save campaign." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const id = String(formData.get("id") || "");
    const campaign = await PrebookCampaign.findById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found." },
        { status: 404 }
      );
    }

    const productName = String(formData.get("product_name") || "").trim();
    if (!productName) {
      return NextResponse.json(
        { success: false, message: "Product name is required." },
        { status: 400 }
      );
    }

    const status = formData.get("status") === "Inactive" ? "Inactive" : "Active";
    const banner = formData.get("banner_image");
    const mobileBanner = formData.get("mobile_banner_image");
    const detailFiles = formData
      .getAll("detail_images")
      .filter((file) => file && file.size > 0);
    let bannerImage = campaign.banner_image;
    let mobileBannerImage = campaign.mobile_banner_image;
    let retainedDetailImages = [];

    try {
      const requestedImages = JSON.parse(
        String(formData.get("retained_detail_images") || "[]")
      );
      retainedDetailImages = Array.isArray(requestedImages)
        ? requestedImages.filter((image) =>
            (campaign.detail_images || []).includes(image)
          )
        : [];
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid detail image data." },
        { status: 400 }
      );
    }

    if (banner && banner.size > 0) {
      const oldImage = bannerImage;
      bannerImage = await saveImage(banner);
      await deleteImage(oldImage);
    }
    if (mobileBanner && mobileBanner.size > 0) {
      const oldImage = mobileBannerImage;
      mobileBannerImage = await saveImage(mobileBanner);
      await deleteImage(oldImage);
    }

    const removedDetailImages = (campaign.detail_images || []).filter(
      (image) => !retainedDetailImages.includes(image)
    );
    for (const image of removedDetailImages) {
      await deleteImage(image);
    }

    const newDetailImages = [];
    for (const file of detailFiles) {
      newDetailImages.push(await saveImage(file));
    }

    campaign.product_name = productName;
    campaign.slug = await createUniqueSlug(productName, campaign._id);
    campaign.product_details = String(formData.get("product_details") || "").trim();
    campaign.banner_image = bannerImage;
    campaign.mobile_banner_image = mobileBannerImage;
    campaign.detail_images = [...retainedDetailImages, ...newDetailImages];
    campaign.status = status;
    await campaign.save();

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Update prebook campaign error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unable to update campaign." },
      { status: 500 }
    );
  }
}
