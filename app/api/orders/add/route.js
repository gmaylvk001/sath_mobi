import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";
import Product from "@/models/product";
import mongoose from 'mongoose';
import Coupon from '@/models/ecom_offer_info';
import Usedcoupon from '@/models/ecom_coupon_track_info';

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    const {
      user_id,
      order_username,
      order_phonenumber,
      order_item,
      order_amount,
      order_deliveryaddress,
      payment_method,
      payment_type,
      order_status,
      delivery_type,
      payment_id,
      order_number,
      order_details,
      payment_status,
      user_adddeliveryid,
      email_address,
    } = body;

    const safeOrderItem = Array.isArray(order_item) ? order_item : [];
    const safeOrderDetails = Array.isArray(order_details) ? order_details : [];

    // Validate required fields
    if (!user_id || !email_address || !order_phonenumber || safeOrderItem.length === 0 || !order_amount) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const newOrder = new EcomOrderInfo({
      user_id,
      order_username,
      order_phonenumber,
      order_item: safeOrderItem,
      order_amount,
      order_deliveryaddress,
      payment_method,
      payment_type,
      delivery_type,
      payment_id,
      order_number: order_number || `ORD${Date.now()}`,
      order_details: safeOrderDetails,
      user_adddeliveryid,
      email_address,
      order_status: order_status || "pending",
      payment_status: payment_status || "pending"
    });

    await newOrder.save();
    if (newOrder) {
      for (const item of safeOrderItem) {
        try {
          if (!item?.productId) continue;

          const product = await Product.findById(String(item.productId));
          const itemQuantity = Number(item.quantity || 0);
          const coupon = Number(item.discount || 0);

          if (coupon > 0 && item.coupondetails?.[0]?._id) {
            const userObjectId = new mongoose.Types.ObjectId(user_id);
            const couponid = new mongoose.Types.ObjectId(item.coupondetails[0]._id);
            const coupon_track = new Usedcoupon({ coupon_id: couponid, user_id: userObjectId });
            await coupon_track.save();

            const updatecoupon = await Coupon.findOne({ couponid });
            if (updatecoupon) {
              updatecoupon.used_by += 1;
              await updatecoupon.save();
            }
          }

          if (product && product.quantity > 0 && itemQuantity > 0) {
            product.quantity = Math.max(product.quantity - itemQuantity, 0);
            await product.save();
          }
        } catch (itemError) {
          console.error("Order side-effect failed for item:", item?.productId, itemError);
        }
      }
    }
    // Create notification after order is placed
    try {
      const Notification = require("@/models/Notification.js");
      const notification = new Notification({
        userId: user_id,
        message: `Order #${newOrder.order_number || newOrder._id} placed successfully!`,
        orderId: newOrder._id,
      });
      await notification.save();
    } catch (notifErr) {
      // Optionally log notification error, but don't block order creation
      console.error("Notification creation failed:", notifErr);
    }
    return Response.json({ success: true, message: "Order added successfully", order: newOrder }, { status: 201 });

  } catch (error) {
    console.error("Order creation failed:", error);
    return Response.json({ success: false, message: error.message, error: error.message }, { status: 500 });
  }
}
