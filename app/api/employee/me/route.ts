import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 401 }
      );
    }

    const token = parts[1];

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employee = await Employee.findById(decoded.id).select(
      '-password -plainPassword'
    );

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}