// app/api/admin/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Tamaam fields zaroori hain' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords match nahi kar rahe' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password kam az kam 6 characters ka hona chahiye' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'Is email se admin pehle se register hai' },
        { status: 409 }
      );
    }

    // Create admin
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
    });

    // Generate token
    const token = signToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin account kamiyabi se bana diya gaya',
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
      { status: 201 }
    );

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Dobara koshish karein.' },
      { status: 500 }
    );
  }
}
