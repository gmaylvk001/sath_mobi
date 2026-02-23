import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Order from "@/models/ecom_order_info";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");

  try {
   const order_products = await Order.find({
     // order_status: "shipped",
      "order_item.0.category": categorySlug,
    }).sort({ createdAt: -1 });

     // 2️⃣ Extract item_codes from orders
    const itemCodes = order_products.flatMap(order =>
      order.order_item.map(item => item.item_code)
    );

    // Remove duplicates
    const uniqueItemCodes = [...new Set(itemCodes)];

    // Safety check
    if (!itemCodes.length) {
      return NextResponse.json({
        success: true,
        data: [],
        category: categorySlug,
      });
    }

    

    // 3️⃣ Fetch products using item_code
    const products = await Product.find({
      item_code: { $in: uniqueItemCodes.slice(0,4) },
    });


    return NextResponse.json({
      success: true,
      data: products,
      category : categorySlug,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
