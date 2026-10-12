import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { isAdminRequest } from "@/lib/requireAdmin";

export async function GET(request) {
  try {
    await dbConnect();
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const users = await User.find({}, { password: 0 }).lean();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
