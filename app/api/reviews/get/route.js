import Review from "@/models/Review";
import dbConnect from "@/lib/db";

export async function GET() {
  await dbConnect();

  const reviews = await Review.find()
    .populate({
      path: "product_id",
      select: "name slug",
    })
    .populate({
      path: "user_id",
      select: "name",
    })
    .sort({ created_date: -1 });

  return Response.json(reviews);
}
