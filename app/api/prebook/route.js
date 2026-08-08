// app/api/prebook/route.js
import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Prebook from '@/models/Prebook';
import { isAdminRequest } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await dbConnect();
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const bookings = await Prebook.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("Get prebook data error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prebook data" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const data = {
      name: String(body.name || "").trim(),
      phone: String(body.phone || "").trim(),
      pincode: String(body.pincode || "").trim(),
      district: String(body.district || "").trim(),
      product: String(body.product || "").trim(),
    };

    if (
      !data.name ||
      !/^\d{10}$/.test(data.phone) ||
      !/^\d{6}$/.test(data.pincode) ||
      !data.district ||
      !data.product
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide valid customer details." },
        { status: 400 }
      );
    }

    await dbConnect();
    const newPrebook = await Prebook.create(data);
    return NextResponse.json({ success: true, data: newPrebook });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to save prebook data' }, { status: 500 });
  }
}
