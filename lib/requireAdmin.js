import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function isAdminRequest(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token || !process.env.JWT_SECRET) return false;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId, { user_type: 1 }).lean();
    return user?.user_type === "admin";
  } catch {
    return false;
  }
}
