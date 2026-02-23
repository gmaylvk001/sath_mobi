import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Review from "@/models/Review";
import dbConnect from "@/lib/db";

export async function GET(req, { params }) {
  await dbConnect();

  try {
    const productId = new mongoose.Types.ObjectId(params.id);

    const reviews = await Review.find({
      product_id: productId,
      review_status: "approved"
    })
      .populate("user_id", "name")
      .sort({ created_date: -1 })
      .lean();

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews === 0
        ? 0
        : (
            reviews.reduce((sum, r) => sum + r.reviews_rating, 0) /
            totalReviews
          ).toFixed(1);

    return NextResponse.json({
      rating: Number(avgRating),
      count: totalReviews,
      items: reviews
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
