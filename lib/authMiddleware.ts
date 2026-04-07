import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export function getAdminFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  let token: string | null = null;

  // ✅ Check cookie first
  const cookieToken = req.cookies.get('admin_token')?.value;

  if (cookieToken) {
    token = cookieToken;
  }

  // ✅ Then check header
  if (!token && authHeader) {
    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) return null;

  return verifyToken(token);
}

export function requireAdmin(req: NextRequest) {
  const admin = getAdminFromRequest(req);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  return null;
}