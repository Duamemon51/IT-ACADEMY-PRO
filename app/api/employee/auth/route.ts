import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    // ✅ Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email aur password required hain' },
        { status: 400 }
      );
    }

    // ✅ Find employee
    const employee = await Employee.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Invalid email ya password' },
        { status: 401 }
      );
    }

    // ✅ Check password
    const isMatch = await employee.comparePassword(password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email ya password' },
        { status: 401 }
      );
    }

    // ❌ Optional: block inactive users
    if (!employee.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account inactive hai' },
        { status: 403 }
      );
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        id: employee._id,
        employeeId: employee.employeeId,
        email: employee.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // ✅ Remove sensitive data
    const employeeData = employee.toObject();
    delete employeeData.password;
    delete employeeData.plainPassword;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        employee: employeeData,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}