import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export async function GET(req) {
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!token) {
    return Response.json({ loggedIn: false }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();
    const user = await User.findById(decoded.userId)
      .select('name email mobile user_type')
      .lean();

    if (!user) {
      return Response.json({ loggedIn: false }, { status: 401 });
    }

    return Response.json({
      loggedIn: true,
      user: decoded,
      role: user.user_type,
      phone: user.mobile,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return Response.json({ loggedIn: false }, { status: 401 });
    }

    console.error('Admin authentication check failed:', error);
    return Response.json({ error: 'Authentication check failed' }, { status: 500 });
  }
}