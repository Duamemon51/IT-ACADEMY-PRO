// app/api/admin/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email aur password zaroori hain' },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Email ya password galat hai' },
        { status: 401 }
      );
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Email ya password galat hai' },
        { status: 401 }
      );
    }

    // Generate token
    const token = signToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login kamiyab raha',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          token,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Dobara koshish karein.' },
      { status: 500 }
    );
  }
}
