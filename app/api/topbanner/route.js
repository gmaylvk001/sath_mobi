import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopBanner from "@/models/topbanner";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOP_BANNER_UPLOAD_SEGMENTS = ["uploads", "topbanner"];

function getPublicDir() {
  return path.join(process.cwd(), "public");
}

function getTopBannerUploadDir() {
  return path.join(getPublicDir(), ...TOP_BANNER_UPLOAD_SEGMENTS);
}

function toPublicUrl(...segments) {
  return `/${segments.join("/")}`;
}

function normalizeUrlPath(fileUrl = "") {
  if (!fileUrl) return "";
  return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
}

function getFilenameFromUrl(fileUrl = "") {
  return normalizeUrlPath(fileUrl).split("/").filter(Boolean).pop() || "";
}

function getBannerPathCandidates(fileUrl = "") {
  const normalizedUrl = normalizeUrlPath(fileUrl);
  if (!normalizedUrl) return [];

  const filename = getFilenameFromUrl(normalizedUrl);
  const dePrefixedName = filename.replace(/^\d+-/, "");

  const urlCandidates = [
    normalizedUrl,
    filename ? toPublicUrl(...TOP_BANNER_UPLOAD_SEGMENTS, filename) : "",
    filename ? toPublicUrl("assets", "images", filename) : "",
    dePrefixedName && dePrefixedName !== filename
      ? toPublicUrl(...TOP_BANNER_UPLOAD_SEGMENTS, dePrefixedName)
      : "",
    dePrefixedName && dePrefixedName !== filename
      ? toPublicUrl("assets", "images", dePrefixedName)
      : "",
  ].filter(Boolean);

  return [...new Set(urlCandidates)].map((urlPath) => ({
    urlPath,
    filePath: path.join(getPublicDir(), urlPath.replace(/^\/+/, "")),
  }));
}

function resolveExistingBannerUrl(fileUrl = "") {
  const normalizedUrl = normalizeUrlPath(fileUrl);
  const candidates = getBannerPathCandidates(normalizedUrl);
  const match = candidates.find(({ filePath }) => fs.existsSync(filePath));
  return match?.urlPath || normalizedUrl;
}

function resolveExistingBannerFile(fileUrl = "") {
  const candidates = getBannerPathCandidates(fileUrl);
  return candidates.find(({ filePath }) => fs.existsSync(filePath))?.filePath || null;
}

async function saveFile(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      await sharp(buffer).metadata();
    } catch (err) {
      throw new Error("Invalid image file. Please upload a valid image.");
    }

    const uploadDir = getTopBannerUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer).toFile(filepath);

    return toPublicUrl(...TOP_BANNER_UPLOAD_SEGMENTS, filename);
  } catch (err) {
    console.error("Save file error:", err);
    throw err;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const banners = await TopBanner.find({}).sort({ order: 1 });
    const normalizedBanners = banners.map((banner) => ({
      ...banner.toObject(),
      banner_image: resolveExistingBannerUrl(banner.banner_image),
    }));

    return NextResponse.json({ success: true, banners: normalizedBanners });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const file = formData.get("banner_image");
    const redirect_url = formData.get("redirect_url");
    const status = formData.get("status") || "Active";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    let filePath;
    try {
      filePath = await saveFile(file);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }

    const lastBanner = await TopBanner.findOne().sort({ order: -1 });
    const newOrder = lastBanner ? lastBanner.order + 1 : 0;

    const newBanner = new TopBanner({
      banner_image: filePath,
      redirect_url: redirect_url || "",
      status,
      order: newOrder,
    });

    await newBanner.save();

    return NextResponse.json({ success: true, banner: newBanner });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const existingBanner = await TopBanner.findById(id);
    if (!existingBanner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    const updateData = { updatedAt: new Date() };

    const redirect_url = formData.get("redirect_url");
    if (redirect_url !== null) updateData.redirect_url = redirect_url;

    const status = formData.get("status");
    if (status !== null) updateData.status = status;

    const file = formData.get("banner_image");
    if (file && file.size > 0) {
      try {
        const filePath = await saveFile(file);
        updateData.banner_image = filePath;

        const oldFilePath = resolveExistingBannerFile(existingBanner.banner_image);
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        return NextResponse.json(
          { success: false, message: err.message },
          { status: 400 }
        );
      }
    }

    const updatedBanner = await TopBanner.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, message: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < orderedIds.length; i += 1) {
      await TopBanner.findByIdAndUpdate(orderedIds[i], { order: i });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const banner = await TopBanner.findById(id);
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    const filePath = resolveExistingBannerFile(banner.banner_image);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await TopBanner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
