import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTENT_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_request, { params }) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename || "");
    const safeFilename = path.basename(decodedFilename);

    if (!safeFilename || safeFilename !== decodedFilename) {
      return NextResponse.json(
        { success: false, message: "Invalid image filename" },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "topbanner",
      safeFilename
    );
    const imageBuffer = await fs.readFile(filePath);
    const extension = path.extname(safeFilename).toLowerCase();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Hero banner image not found" },
      { status: 404 }
    );
  }
}
