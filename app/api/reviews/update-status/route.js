// app/api/reviews/update-status/route.js
import dbConnect from "@/lib/db";
import Review from "@/models/Review";

export async function POST(req) {
  await dbConnect();
  const { reviewId, status } = await req.json();

  await Review.findByIdAndUpdate(reviewId, {
    review_status: status,
    updated_date: new Date()
  });

  return Response.json({ success: true });
}
