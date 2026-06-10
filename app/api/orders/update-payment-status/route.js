import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const {
      order_id,
      order_number,
      payment_status,
      payment_id,
      order_status,
    } = body;

    if (!order_id && !order_number) {
      return Response.json(
        { success: false, message: "Order ID or order number is required" },
        { status: 400 }
      );
    }

    if (!payment_status) {
      return Response.json(
        { success: false, message: "Payment status is required" },
        { status: 400 }
      );
    }

    const query = order_id ? { _id: order_id } : { order_number };
    const updateData = {
      payment_status,
    };

    if (typeof payment_id !== "undefined") {
      updateData.payment_id = payment_id;
    }

    if (typeof order_status !== "undefined") {
      updateData.order_status = order_status;
    }

    const updatedOrder = await EcomOrderInfo.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Order payment status updated successfully",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
