import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("req", req);

    const { email, password } = await req.json();

    await connectDB();
    console.log("dfd");

    const existingUser = await User.findOne({ email });
    console.log("existingUser", existingUser);

    if (!existingUser) {
      return NextResponse.json({ error: "Admin not found" }, { status: 400 });
    }

    const isPassword = await bcrypt.compare(password, existingUser.password);
    console.log(isPassword);

    if (!isPassword) return NextResponse.json({ error: "Incorrect Password" }, { status: 400 });

    if (existingUser.user_type !== "admin") {
      return NextResponse.json(
        { error: "This account is not authorized to access the admin area" },
        { status: 403 }
      );
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = NextResponse.json({ message: "User Login", token }, { status: 200 });
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return response;

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
