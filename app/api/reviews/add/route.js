import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Review from "@/models/Review";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export async function POST(req) {
  await dbConnect();

  const formData = await req.formData();
  const images = formData.getAll("images");

  const uploadDir = path.join(process.cwd(), "public/uploads/reviews");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const savedImages = [];

  for (const img of images) {
    const buffer = Buffer.from(await img.arrayBuffer());
    const fileName = `${Date.now()}-${img.name}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    savedImages.push(fileName);
  }

  const review = await Review.create({
    user_id: new mongoose.Types.ObjectId(formData.get("user_id")),
    product_id: new mongoose.Types.ObjectId(formData.get("product_id")),
    reviews_title: formData.get("reviews_title"),
    reviews_rating: Number(formData.get("reviews_rating")),
    reviews_comments: formData.get("reviews_comments"),
    review_images: savedImages,
  });

  return NextResponse.json({ success: true, review });
}
