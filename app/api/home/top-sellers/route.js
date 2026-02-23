import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

import Order from "@/models/ecom_order_info";
import Product from "@/models/product";

export async function GET() {
  await dbConnect();

  try {
    const products = await Order.aggregate([
      { $unwind: "$order_item" },

      // group by product item_code
      {
        $group: {
          _id: "$order_item.item_code",
          totalSold: { $sum: "$order_item.quantity" },
          lastOrderedAt: { $max: "$createdAt" },
        },
      },

      { $sort: { lastOrderedAt: -1 } },
      { $limit: 10 },

      // join product table
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "item_code",
          as: "product",
        },
      },
      { $unwind: "$product" },

      {
        $project: {
          _id: 0,
          item_code: "$_id",
          name: "$product.name",
          brand: "$product.brand",
          price: "$product.price",
          special_price: "$product.special_price",
          images: "$product.images",
          totalSold: 1,
        },
      },
    ]);

    return NextResponse.json({ success: true, data: products });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
