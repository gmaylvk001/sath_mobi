'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jsPDF } from "jspdf";
import { ToastContainer, toast } from 'react-toastify';
import { FaPhoneAlt,  FaStore  } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import dayjs from "dayjs";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const orderId = params?.orderId;
  const [isUpdating, setIsUpdating] = useState(false);
 
  // FOR ORDER HISTORY
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const [order, setOrder] = useState(null);
  const paymentStatus = (order?.payment_status || "pending").toLowerCase();
  const orderProductsSubtotal = order?.order_details?.reduce(
    (sum, item) => sum + Number(item.product_price || 0) * Number(item.quantity || 0),
    0
  ) || 0;
  const orderShippingCost = Math.max(0, Number(order?.order_amount || 0) - orderProductsSubtotal);

  const formatCurrency = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN") : "N/A";

  const getImageDataUrl = async (src) => {
    const response = await fetch(src);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const generateInvoice = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const rightEdge = pageWidth - margin;
      let y = 16;

      const drawHeader = async () => {
        try {
          const logo = await getImageDataUrl("/images/logo/sathyalogo.png");
          doc.addImage(logo, "PNG", margin, y, 34, 17);
        } catch (error) {
          console.error("Logo load failed:", error);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(220, 38, 38);
        doc.text("SATHYA MOBILE", margin + 40, y + 8);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("Invoice", rightEdge, y + 8, { align: "right" });
        doc.text(`Order #${order.order_number || orderId}`, rightEdge, y + 14, { align: "right" });

        y += 25;
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.5);
        doc.line(margin, y, rightEdge, y);
        y += 9;
      };

      const sectionTitle = (title) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(45, 45, 45);
        doc.text(title, margin + 3, y + 5.5);
        y += 12;
      };

      const detailRow = (label, value, x, rowY) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(70, 70, 70);
        doc.text(label, x, rowY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(35, 35, 35);
        doc.text(String(value || "N/A"), x + 28, rowY);
      };

      const ensureSpace = (neededHeight) => {
        if (y + neededHeight <= pageHeight - margin) return;
        doc.addPage();
        y = margin;
      };

      await drawHeader();

      sectionTitle("Customer Details");
      detailRow("Name:", order.order_username, margin, y);
      detailRow("Phone:", order.order_phonenumber, margin + 92, y);
      y += 7;
      detailRow("Email:", order.email_address, margin, y);
      detailRow("Store:", order.order_details?.[0]?.store_id, margin + 92, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Address:", margin, y);
      doc.setFont("helvetica", "normal");
      const addressLines = doc.splitTextToSize(order.order_deliveryaddress || "N/A", pageWidth - margin * 2 - 28);
      doc.text(addressLines, margin + 28, y);
      y += Math.max(8, addressLines.length * 5 + 4);

      sectionTitle("Order Details");
      detailRow("Order No:", order.order_number || orderId, margin, y);
      detailRow("Date:", formatDate(order.createdAt), margin + 92, y);
      y += 7;
      detailRow("Payment:", order.payment_method || "N/A", margin, y);
      detailRow("Status:", paymentStatusLabel[paymentStatus] || "Pending", margin + 92, y);
      y += 7;
      detailRow("Delivery:", order.delivery_type || "N/A", margin, y);
      detailRow("Shipping:", orderShippingCost > 0 ? formatCurrency(orderShippingCost) : "Free Shipping", margin + 92, y);
      y += 12;

      sectionTitle("Ordered Products");

      const columns = [
        { title: "Product", x: margin, width: 68 },
        { title: "Model", x: margin + 70, width: 34 },
        { title: "Qty", x: margin + 107, width: 14, align: "center" },
        { title: "Unit Price", x: margin + 125, width: 28, align: "right" },
        { title: "Total", x: margin + 158, width: 24, align: "right" },
      ];

      const drawTableHeader = () => {
        doc.setFillColor(220, 38, 38);
        doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        columns.forEach((column) => {
          const textX = column.align === "right" ? column.x + column.width : column.align === "center" ? column.x + column.width / 2 : column.x + 2;
          doc.text(column.title, textX, y + 5.5, { align: column.align || "left" });
        });
        y += 8;
      };

      drawTableHeader();

      doc.setTextColor(35, 35, 35);
      doc.setFont("helvetica", "normal");

      order.order_details?.forEach((item) => {
        const unitPrice = Number(item.product_price || 0);
        const quantity = Number(item.quantity || 0);
        const total = unitPrice * quantity;
        const productLabel = `${item.product_name || "N/A"}${item.item_code ? ` - (${String(item.item_code).replace(/^ITEM/, "")})` : ""}`;
        const productLines = doc.splitTextToSize(productLabel, columns[0].width - 3);
        const modelLines = doc.splitTextToSize(item.model || "N/A", columns[1].width - 3);
        const rowHeight = Math.max(productLines.length, modelLines.length, 1) * 5 + 5;

        ensureSpace(rowHeight + 18);
        if (y === margin) drawTableHeader();

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y, rightEdge, y);
        doc.setFontSize(8);
        doc.text(productLines, columns[0].x + 2, y + 5);
        doc.text(modelLines, columns[1].x + 2, y + 5);
        doc.text(String(quantity), columns[2].x + columns[2].width / 2, y + 5, { align: "center" });
        doc.text(formatCurrency(unitPrice), columns[3].x + columns[3].width, y + 5, { align: "right" });
        doc.text(formatCurrency(total), columns[4].x + columns[4].width, y + 5, { align: "right" });
        y += rowHeight;
      });

      y += 4;
      ensureSpace(24);
      const subTotal = orderProductsSubtotal;
      const shippingCost = Math.max(0, Number(order.order_amount || 0) - subTotal);
      const totalsX = rightEdge - 58;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Sub-Total:", totalsX, y, { align: "right" });
      doc.text(formatCurrency(subTotal), rightEdge, y, { align: "right" });
      y += 7;
      doc.text("Shipping:", totalsX, y, { align: "right" });
      doc.text(formatCurrency(shippingCost), rightEdge, y, { align: "right" });
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total:", totalsX, y, { align: "right" });
      doc.text(formatCurrency(order.order_amount || subTotal), rightEdge, y, { align: "right" });

      doc.save(`invoice-${order.order_number || orderId}.pdf`);
    } catch (error) {
      console.error("Invoice generation failed:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const paymentStatusStyles = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };

  const paymentStatusLabel = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
  };

  // const orderr = {
  //   history: [
  //     {
  //       date: '2025-07-22T12:00:00Z',
  //       comment: 'Order placed by user',
  //       status: 'Pending',
  //       customer_notified: true,
  //     },
  //     {
  //       date: '2025-07-23T08:30:00Z',
  //       comment: 'Order packed and ready to ship',
  //       status: 'Processing',
  //       customer_notified: false,
  //     },
  //     {
  //       date: '2025-07-23T14:00:00Z',
  //       comment: 'Order shipped via BlueDart',
  //       status: 'Shipped',
  //       customer_notified: true,
  //     },
  //   ],
  // };

const addHistory = async () => {
  if (!status || !comment) {
    toast.error("Please select a status and add a comment");
    return;
  }

  setIsUpdating(true);
  try {
    const res = await fetch(`/api/allorders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        comment,
        customer_notified: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to update history:", data);
      toast.error("Failed to update history");
    } else {
      //console.log("✅ History updated", data);
      setOrder(data);
      setStatus("");
      setComment("");
      toast.success("History updated successfully!");
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    toast.error("Network error occurred");
  } finally {
    setIsUpdating(false);
  }
};
  useEffect(() => {
    if (orderId) {
      fetch(`/api/allorders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(err => console.error("Fetch error:", err));
    }
  }, [orderId]);

  if (!order) return <p className="text-center mt-10">Loading...</p>;
  // console.log('Order:', order);


  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto bg-white overflow-x-hidden">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Orders</h2>
      <ToastContainer />

      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {/* Order Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <div className="bg-gray-100 border-b p-2 sm:p-3 font-semibold text-sm text-gray-700">Order Details</div>
    <div className="divide-y text-sm text-gray-700">
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <IoWalletSharp className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Payment:
        </span>
        <div className="flex flex-col gap-2 min-w-0 break-words">
          <span>{order.payment_method || "N/A"}</span>
          <span
            className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
              paymentStatusStyles[paymentStatus] || paymentStatusStyles.pending
            }`}
          >
            {paymentStatusLabel[paymentStatus] || "Pending"}
          </span>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Date:
        </span>
        <span className="min-w-0 break-words">{dayjs(order.createdAt).format("DD/MM/YYYY hh:mm:ss A")}</span>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Pickup:
        </span>
        <span className="min-w-0 break-words">
          {order.delivery_type === "store_pickup" ? (
            <span className="py-0.5 text-white px-2 bg-red-500 rounded inline-block">{order.delivery_type}</span>
          ) : (
            order.delivery_type
          )}
        </span>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <MdOutlineLocalShipping className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Shipping:
        </span>
        <span className="min-w-0 break-words">{orderShippingCost > 0 ? `Rs. ${orderShippingCost.toLocaleString("en-IN")}` : "Free Shipping"}</span>
      </div>
    </div>
  </div>

  {/* Customer Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <div className="bg-gray-100 border-b p-2 sm:p-3 font-semibold text-sm text-gray-700">Customer Details</div>
    <div className="divide-y text-sm text-gray-700">
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <MdContacts className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Name:
        </span>
        <span className="min-w-0 break-words">{order.order_username}</span>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Phone:
        </span>
        <span className="min-w-0 break-words">{order.order_phonenumber}</span>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Store:
        </span>
        <span className="min-w-0 break-words">{order.order_details?.[0]?.store_id}</span>
      </div>
      <div className="p-2.5 sm:p-3 flex gap-3 items-start">
        <span className="shrink-0 flex items-center gap-2 font-semibold min-w-[88px] sm:min-w-[100px]">
          <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
          Email:
        </span>
        <span className="min-w-0 break-all">{order.email_address}</span>
      </div>
    </div>
  </div>

  {/* Options / Invoice */}
  <div className="bg-white shadow rounded overflow-hidden md:col-span-2 lg:col-span-1">
    <div className="bg-gray-100 border-b p-2 sm:p-3 font-semibold text-sm text-gray-700">Options</div>
    <div className="p-2.5 sm:p-3 space-y-3">
      <textarea
        className="w-full border rounded p-2 text-sm"
        placeholder="Note: Maximum 150 characters allowed"
        maxLength={150}
        rows={3}
      />
      <button
        onClick={generateInvoice}
        className="bg-red-500 text-white px-4 py-2.5 rounded text-sm hover:bg-red-600 w-full"
      >
        Generate Invoice
      </button>
    </div>
  </div>
</div>


      {/* Order Info */}
      <div className="bg-white p-3 sm:p-4 shadow rounded">
        <h3 className="font-semibold text-gray-600 border-b pb-2 text-base sm:text-lg break-all">Order #{order.order_number}</h3>
        {/* Address */}
        <div className="mt-4">
  <table className="w-full border text-sm text-gray-700">
    <thead>
      <tr className="bg-gray-100 border-b">
        <th className="p-2 text-left">Delivery Address</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="p-2 break-words whitespace-normal">{order.order_deliveryaddress}</td>
      </tr>
    </tbody>
  </table>
</div>



        {/* Product Table */}
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[560px] border text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Model</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
 {order.order_details?.map((item, i) => (
  <tr key={i} className="border-b">
    <td className="p-2 break-words max-w-[220px]">
  {item.slug ? (
    <a 
      href={`/product/${item.slug}`} 
      className="text-blue-600 hover:underline"
    >
      {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
    </a>
  ) : (
    <span>
      {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
    </span>
  )}
</td>

    <td className="p-2 whitespace-nowrap">{item.model}</td>
    <td className="p-2 text-center">{item.quantity}</td>
    <td className="p-2 text-right whitespace-nowrap">₹{Number(item.quantity * item.product_price).toLocaleString("en-IN")}</td>
    <td className="p-2 text-right whitespace-nowrap">₹{Number(item.quantity * item.product_price).toLocaleString("en-IN")}</td>
  </tr>
))}
  <tr className="font-semibold">
    <td colSpan="4" className="p-2 text-right">Sub-Total:</td>
    {/* <td className="p-2 text-right">₹{order.sub_total}</td> */}
    <td className="p-2 text-right whitespace-nowrap">Rs. {orderProductsSubtotal.toLocaleString("en-IN")}</td>
  </tr>
  <tr>
    <td colSpan="4" className="p-2 text-right">Shipping:</td>
    {/* <td className="p-2 text-right">₹{order.shipping_fee}</td> */}
     <td className="p-2 text-right whitespace-nowrap">Rs. {orderShippingCost.toLocaleString("en-IN")}</td>
  </tr>
  <tr className="font-bold bg-gray-100">
    <td colSpan="4" className="p-2 text-right">Total:</td>
    <td className="p-2 text-right whitespace-nowrap">₹{Number(order.order_amount).toLocaleString("en-IN")}</td>
  </tr>
</tbody>

          </table>
        </div>


        {/* Order History */}
<div className="bg-white p-3 sm:p-4 shadow rounded mt-6">
  <h3 className="font-semibold text-gray-600 border-b pb-2">Order History</h3>

  {/* Order History Table */}
  <div className="mt-3 overflow-x-auto -mx-1 px-1">
  <table className="w-full min-w-[520px] text-sm border text-gray-700">
    <thead>
      <tr className="bg-gray-100 border-b">
        <th className="p-2 text-left">Date Added</th>
        <th className="p-2 text-left">Comment</th>
        <th className="p-2 text-left">Status</th>
        <th className="p-2 text-center">Customer Notified</th>
      </tr>
    </thead>
    <tbody>
      {order.order_history?.map((entry, i) => (
        <tr key={i} className="border-b">
          <td className="p-2 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
          <td className="p-2 break-words">{entry.comment}</td>
          <td className="p-2 whitespace-nowrap">{entry.status}</td>
          <td className="p-2 text-center">
            {entry.customer_notified ? "Yes" : "No"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  </div>

  {/* Add Order History Form */}
  <div className="mt-6">
    <h4 className="font-semibold text-gray-600 border-b pb-2">
      Add Order History
    </h4>

    {/* Order Status Dropdown */}
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Order Status
      </label>
     <select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
>
  <option>Choose</option>
  <option value="Cancelled">Cancelled</option>
  <option value="Shipped">Shipped</option>
  <option value="Accepted">Accepted</option>
</select>
    </div>

    {/* Comment Box */}
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Comment
      </label>
      <textarea
  value={comment}
  onChange={(e) => setComment(e.target.value)}
  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
  rows={3}
  placeholder="Enter comment here..."
></textarea>
    </div>

    {/* Add History Button */}
    <div className="mt-4">
      <button
  onClick={addHistory}
  disabled={isUpdating}
  className="bg-red-500 text-white px-4 py-2.5 rounded text-sm hover:bg-red-600 disabled:bg-gray-400 w-full sm:w-auto"
>
  {isUpdating ? "Adding..." : "+ Add History"}
</button>
    </div>
  </div>
</div>
</div>
</div>
  );
};

export default OrderDetails;

