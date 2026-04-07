// app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getAdminFromRequest } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const admin = await Admin.findById(adminPayload.id).select('-password');

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin nahi mila' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Signout
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout kamiyab raha',
  });

  response.cookies.set('admin_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
