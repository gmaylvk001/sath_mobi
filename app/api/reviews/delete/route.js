import Review from "@/models/Review";
import dbConnect from "@/lib/db";

export async function POST(req) {
  await dbConnect();
  const { reviewId } = await req.json();

  await Review.findByIdAndDelete(reviewId);

  return Response.json({ success: true });
}
