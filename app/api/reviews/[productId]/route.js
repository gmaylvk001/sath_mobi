import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await dbConnect();
  const { productId } = await params;

  /* 1️⃣ Get ALL approved reviews (for stats) */
  const allReviews = await Review.find({
    product_id: productId,
    review_status: "approved",
  });

  const totalReviews = allReviews.length;

  const ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  allReviews.forEach((r) => {
    ratingCount[r.reviews_rating]++;
    totalRating += r.reviews_rating;
  });

  const averageRating = totalReviews
    ? (totalRating / totalReviews).toFixed(1)
    : 0;

  /* 2️⃣ Get LAST 5 reviews only (for UI display) */
  const latestReviews = await Review.find({
    product_id: productId,
    review_status: "approved",
  })
    .populate("user_id", "name")
    .sort({ created_date: -1 })
    .limit(5);

  return NextResponse.json({
    averageRating,
    totalReviews,
    ratingCount,
    reviews: latestReviews, // 👈 only last 5
  });
}
