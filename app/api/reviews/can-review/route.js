import { NextResponse } from "next/server";
import Order from "@/models/ecom_order_infos";
import Review from "@/models/Review";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId"); // IMPORTANT
    const userId = searchParams.get("userId"); // IMPORTANT
    const productCode = searchParams.get("productcode"); // IMPORTANT

     if (!productId || !userId) {
      return NextResponse.json(
        { canReview: false, message: "Invalid request" },
        { status: 400 }
      );
    }

   // const userObjectId = new mongoose.Types.ObjectId(userId);
   // const productObjectId = new mongoose.Types.ObjectId(productId);

    /* 1️⃣ Already reviewed check */
    const existingReview = await Review.findOne({
      user_id: userId,
      product_id: productId
    });

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        alreadyReviewed: true,
        message: "You have already reviewed this product",
      });
    }

    const order = await Order.findOne({
      user_id: userId,
      order_status: "shipped",
      "order_item.item_code": productCode
    });

    return NextResponse.json({
      canReview: Boolean(order)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ canReview: false }, { status: 500 });
  }
}
